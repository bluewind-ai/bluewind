import logging
from typing import Type  # noqa: F401

from django.db import transaction
from django.db.models import Q

from dns_records.models import DNSRecord
from domain_names.models import DomainName
from functions.bluewind_function.v1.functions import bluewind_function_v1
from functions.mark_domain_name_as_scanned.v1.functions import (
    mark_domain_name_as_scanned_v1,
)

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def store_dns_records_v1(dns_records_data, domain_names):
    all_created_records = []

    for domain_entry in dns_records_data:
        domain_name = domain_entry["domain_name"]
        dns_records = domain_entry["dns_records"]

        # Get or create the DomainName instance
        domain, _ = DomainName.objects.get_or_create(name=domain_name)

        with transaction.atomic():
            records_to_create = []

            # Prepare TXT records
            for txt_record in dns_records.get("TXT", []):
                name, value = txt_record.split(": ", 1)
                subdomain = name.removesuffix(f".{domain_name}")
                records_to_create.append(
                    DNSRecord(
                        domain=domain, name=subdomain, record_type="TXT", value=value
                    )
                )

            # Prepare MX records
            for mx_record in dns_records.get("MX", []):
                priority, value = mx_record.split(" ", 1)
                records_to_create.append(
                    DNSRecord(
                        domain=domain,
                        name="",  # MX records are typically at the apex
                        record_type="MX",
                        value=value.rstrip("."),
                        priority=int(priority),
                    )
                )

            # Bulk create all records
            created_records = DNSRecord.objects.bulk_create(records_to_create)
            all_created_records.extend(created_records)

        logger.info(f"DNS records for {domain_name} have been stored.")

    # Create a Q object to filter for all created records
    q_filter = Q()
    for record in all_created_records:
        q_filter |= Q(
            domain=record.domain,
            name=record.name,
            record_type=record.record_type,
            value=record.value,
        )
    mark_domain_name_as_scanned_v1(domain_names=domain_names)
    return DNSRecord.objects.filter(q_filter)
