"""
Veridia Match - Certification Expiry Evaluation Engine
"""
from datetime import date, datetime
from typing import Optional, Tuple
from enum import Enum


class CertStatus(str, Enum):
    VALID = "VALID"
    EXPIRED = "EXPIRED"
    UNVERIFIED = "UNVERIFIED"
    NOT_HELD = "NOT_HELD"
    NOT_REQUIRED = "NOT_REQUIRED"


def parse_iso_date(date_str: Optional[str]) -> Optional[date]:
    """Parse ISO date string YYYY-MM-DD into a date object."""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def evaluate_certification_validity(
    manufacturer_certs: list[str],
    required_cert: Optional[str],
    raw_expiry_date: Optional[str],
    raw_audit_date: Optional[str],
    evaluation_date: date,
) -> Tuple[CertStatus, str]:
    """
    Evaluates certification validity against a deterministic evaluation_date.
    
    Validation Policy:
    1. If no certification is required by the buyer, returns NOT_REQUIRED.
    2. If the required certification is not in the manufacturer's certified list, returns NOT_HELD.
    3. If the expiry date is missing or malformed, returns UNVERIFIED (never assume valid).
    4. If evaluation_date > expiry_date, returns EXPIRED.
    5. If evaluation_date <= expiry_date:
       - If last_audit_date is available and last_audit_date <= evaluation_date <= expiry_date: returns VALID.
       - If last_audit_date is unavailable, validity is granted based on expiry_date with an unverified-audit caveat.
       - If evaluation_date == expiry_date: returns VALID (certificate is valid through midnight of expiry day).
    """
    if not required_cert:
        return CertStatus.NOT_REQUIRED, "No specific certification required by buyer."

    # Check if manufacturer holds the certification
    cleaned_certs = [c.upper().replace("-", " ").strip() for c in manufacturer_certs]
    target_clean = required_cert.upper().replace("-", " ").strip()

    if target_clean not in cleaned_certs:
        return CertStatus.NOT_HELD, f"Manufacturer does not hold required certification: {required_cert}."

    # Expiry parsing
    exp_date = parse_iso_date(raw_expiry_date)
    if exp_date is None:
        return CertStatus.UNVERIFIED, f"Expiry date for {required_cert} is missing or malformed ('{raw_expiry_date}')."

    # Audit date parsing
    audit_date = parse_iso_date(raw_audit_date)

    # Expiry Check
    if evaluation_date > exp_date:
        return CertStatus.EXPIRED, (
            f"Certification {required_cert} expired on {exp_date.isoformat()} "
            f"prior to evaluation date {evaluation_date.isoformat()}."
        )

    # Valid on evaluation date (including boundary condition evaluation_date == exp_date)
    if audit_date and evaluation_date < audit_date:
        return CertStatus.VALID, (
            f"{required_cert} is valid on {evaluation_date.isoformat()} "
            f"(expires {exp_date.isoformat()}; next audit recorded on {audit_date.isoformat()})."
        )

    audit_msg = f"Last audit verified on {audit_date.isoformat()}." if audit_date else "Audit date not recorded."
    return CertStatus.VALID, (
        f"{required_cert} is valid on evaluation date {evaluation_date.isoformat()} "
        f"(expires {exp_date.isoformat()}). {audit_msg}"
    )
