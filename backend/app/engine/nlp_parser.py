"""
Veridia Match - Natural Language Requirement Parser (Rule-Based + AI Optional)
"""
import re
from typing import Dict, Any, Optional

from backend.app.config import (
    CANONICAL_MATERIALS,
    CANONICAL_PROCESSES,
    CANONICAL_CERTIFICATIONS,
    POPULAR_DESTINATIONS,
)
from backend.app.data.cleaner import MATERIAL_SYNONYMS, PROCESS_SYNONYMS, CERTIFICATION_SYNONYMS


def parse_natural_language_rfq(text: str) -> Dict[str, Any]:
    """
    Deterministically converts an informal or conversational buyer requirement / RFQ
    into structured parameters, without needing an external API key.
    """
    normalized = text.lower()

    # 1. Detect Quantity
    qty = 1000  # standard default
    qty_match = re.search(r"(\d[\d,]*)\s*(?:units|pcs|pieces|parts|components|qty|quantity)?", normalized)
    if qty_match:
        try:
            val = int(qty_match.group(1).replace(",", ""))
            if val > 0:
                qty = val
        except ValueError:
            pass

    # 2. Detect Material
    detected_material = "aluminium"  # sensible default
    for syn, canonical in MATERIAL_SYNONYMS.items():
        # Match as whole word
        pattern = r"\b" + re.escape(syn) + r"\b"
        if re.search(pattern, normalized):
            detected_material = canonical
            break

    # 3. Detect Process (check more specific terms first)
    detected_process = "CNC machining"
    # Sort synonyms by length descending so specific terms like 'cnc turning' or 'cnc milling' match before 'cnc'
    sorted_synonyms = sorted(PROCESS_SYNONYMS.items(), key=lambda item: len(item[0]), reverse=True)
    for syn, targets in sorted_synonyms:
        pattern = r"\b" + re.escape(syn) + r"\b"
        if re.search(pattern, normalized):
            if syn in ["cnc", "cnc machining", "cnc-machining", "machining"]:
                detected_process = "CNC machining"
            else:
                detected_process = targets[0]
            break

    # 4. Detect Certification
    detected_cert = "ISO 9001"
    cert_found = False
    for syn, canonical in CERTIFICATION_SYNONYMS.items():
        pattern = r"\b" + re.escape(syn) + r"\b"
        if re.search(pattern, normalized):
            detected_cert = canonical
            cert_found = True
            break
    if not cert_found and ("no cert" in normalized or "any cert" in normalized):
        detected_cert = None

    # 5. Detect Deadline Days
    deadline_days = 42
    deadline_match = re.search(
        r"(?:within|in|by|deadline(?:\s*of)?)\s*(\d+)\s*(?:days|day|d)", normalized
    )
    if deadline_match:
        try:
            val = int(deadline_match.group(1))
            if 1 <= val <= 365:
                deadline_days = val
        except ValueError:
            pass
    else:
        # Check weeks
        weeks_match = re.search(r"(\d+)\s*(?:weeks|week|wks)", normalized)
        if weeks_match:
            try:
                deadline_days = int(weeks_match.group(1)) * 7
            except ValueError:
                pass

    # 6. Detect Destination Country
    destination = "United States"
    country_map = {
        "usa": "United States",
        "us": "United States",
        "united states": "United States",
        "germany": "Germany",
        "uk": "United Kingdom",
        "united kingdom": "United Kingdom",
        "japan": "Japan",
        "netherlands": "Netherlands",
        "france": "France",
        "canada": "Canada",
        "australia": "Australia",
        "italy": "Italy",
        "singapore": "Singapore",
    }
    for c_alias, c_canonical in country_map.items():
        pattern = r"\b" + re.escape(c_alias) + r"\b"
        if re.search(pattern, normalized):
            destination = c_canonical
            break

    return {
        "material": detected_material,
        "process": detected_process,
        "quantity": qty,
        "certification": detected_cert,
        "delivery_deadline_days": deadline_days,
        "destination_country": destination,
    }
