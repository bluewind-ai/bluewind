import logging
from typing import Type  # noqa: F401

from django.db import transaction

from dns_records.models import DNSRecord
from domain_names.models import DomainName
from functions.bluewind_function.v1.functions import bluewind_function_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def store_dns_records_v1(dns_records_data):
    for domain_entry in dns_records_data:
        domain_name = domain_entry["domain_name"]
        dns_records = domain_entry["dns_records"]

        # Get or create the DomainName instance
        domain, _ = DomainName.objects.get_or_create(name=domain_name)

        with transaction.atomic():
            # Process TXT records
            for txt_record in dns_records.get("TXT", []):
                name, value = txt_record.split(": ", 1)
                subdomain = name.removesuffix(f".{domain_name}")
                DNSRecord.objects.create(
                    domain=domain, name=subdomain, record_type="TXT", value=value
                )

            # Process MX records
            for mx_record in dns_records.get("MX", []):
                priority, value = mx_record.split(" ", 1)
                DNSRecord.objects.create(
                    domain=domain,
                    name="",  # MX records are typically at the apex
                    record_type="MX",
                    value=value.rstrip("."),
                    priority=int(priority),
                )

        print(f"DNS records for {domain_name} have been stored.")
