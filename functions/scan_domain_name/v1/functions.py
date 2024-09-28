import dns.resolver

from forms.create_domain_name.v1.forms import CreateDomainNameV1
from functions.bluewind_function.v1.functions import bluewind_function_v1


def fetch_subdomains(domain):
    """
    Return the specified subdomains for the given domain.

    Args:
        domain (str): The main domain.

    Returns:
        list: A list of specified subdomains.
    """
    return [domain, f"_dmarc.{domain}", f"google._domainkey.{domain}"]


def query_dns(domain, record_type):
    """
    Query DNS for a specific domain and record type.

    Args:
        domain (str): The domain to query.
        record_type (str): The DNS record type to query for.

    Returns:
        list: A list of DNS records found.
    """
    try:
        answers = dns.resolver.resolve(domain, record_type)
        if record_type == "MX":
            return [f"{rdata.preference} {rdata.exchange}" for rdata in answers]
        elif record_type == "SOA":
            rdata = answers[0]
            return [
                f"{
                    rdata.mname} {
                    rdata.rname} {
                    rdata.serial} {
                    rdata.refresh} {
                        rdata.retry} {
                            rdata.expire} {
                                rdata.minimum}"
            ]
        elif record_type == "TXT":
            return [b"".join(rdata.strings).decode("utf-8") for rdata in answers]
        else:
            return [str(rdata) for rdata in answers]
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.exception.DNSException):
        return []


@bluewind_function_v1()
def scan_domain_name_v1(domain_name=CreateDomainNameV1):
    dns_records = {
        "A": [],
        "AAAA": [],
        "MX": [],
        "TXT": [],
        "NS": [],
        "CNAME": [],
        "SOA": [],
        "SRV": [],
    }

    record_types = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "SRV"]

    subdomains = fetch_subdomains(domain_name)

    for subdomain in subdomains:
        for record_type in record_types:
            results = query_dns(subdomain, record_type)
            if results:
                if subdomain == domain_name:
                    dns_records[record_type].extend(results)
                else:
                    dns_records[record_type].extend(
                        [f"{subdomain}: {result}" for result in results]
                    )

    # Remove duplicates and sort
    for record_type in dns_records:
        dns_records[record_type] = sorted(list(set(dns_records[record_type])))

    return dns_records
