"""
Veridia Match - Data Normalization & Cleaning Module
"""
import re
from typing import Optional, List, Tuple

# Exact synonym maps
MATERIAL_SYNONYMS = {
    "aluminium": "aluminium",
    "aluminum": "aluminium",
    "stainless steel": "stainless steel",
    "stainless": "stainless steel",
    "ss": "stainless steel",
    "mild steel": "mild steel",
    "ms": "mild steel",
    "carbon steel": "mild steel",
    "copper": "copper",
    "cu": "copper",
    "brass": "brass",
    "titanium": "titanium",
    "ti": "titanium",
    "nylon": "nylon",
    "polyamide": "nylon",
    "pa": "nylon",
    "pa6": "nylon",
    "abs": "ABS",
    "cast iron": "cast iron",
    "ci": "cast iron",
}

# Process mappings: some inputs map to multiple valid sub-processes (e.g. CNC Machining)
PROCESS_SYNONYMS = {
    "cnc machining": ["CNC milling", "CNC turning"],
    "cnc": ["CNC milling", "CNC turning"],
    "cnc-machining": ["CNC milling", "CNC turning"],
    "machining": ["CNC milling", "CNC turning"],
    "cnc milling": ["CNC milling"],
    "cnc-milling": ["CNC milling"],
    "milling": ["CNC milling"],
    "cnc turning": ["CNC turning"],
    "cnc-turning": ["CNC turning"],
    "turning": ["CNC turning"],
    "lathe": ["CNC turning"],
    "sheet metal": ["sheet metal"],
    "sheet-metal": ["sheet metal"],
    "sheetmetal": ["sheet metal"],
    "sheet metal fabrication": ["sheet metal"],
    "injection moulding": ["injection moulding"],
    "injection molding": ["injection moulding"],
    "moulding": ["injection moulding"],
    "molding": ["injection moulding"],
    "edm": ["EDM"],
    "electrical discharge machining": ["EDM"],
    "wire edm": ["EDM"],
    "wire-edm": ["EDM"],
    "casting": ["casting"],
    "metal casting": ["casting"],
    "die casting": ["casting"],
    "sand casting": ["casting"],
    "forging": ["forging"],
    "metal forging": ["forging"],
    "welding": ["welding"],
    "tig welding": ["welding"],
    "mig welding": ["welding"],
    "weldment": ["welding"],
    "grinding": ["grinding"],
    "surface grinding": ["grinding"],
    "precision grinding": ["grinding"],
}

CERTIFICATION_SYNONYMS = {
    "iso9001": "ISO 9001",
    "iso-9001": "ISO 9001",
    "iso 9001": "ISO 9001",
    "iso14001": "ISO 14001",
    "iso-14001": "ISO 14001",
    "iso 14001": "ISO 14001",
    "iso13485": "ISO 13485",
    "iso-13485": "ISO 13485",
    "iso 13485": "ISO 13485",
    "iatf16949": "IATF 16949",
    "iatf-16949": "IATF 16949",
    "iatf 16949": "IATF 16949",
    "ts16949": "IATF 16949",
    "as9100": "AS9100",
    "as-9100": "AS9100",
    "as 9100": "AS9100",
    "as9100d": "AS9100",
}


def normalize_string(val: Optional[str]) -> str:
    """Strip whitespace and collapse multiple internal spaces."""
    if not val:
        return ""
    return re.sub(r"\s+", " ", str(val).strip())


def normalize_material(raw: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Normalizes material name.
    Returns (canonical_material, error_message).
    """
    cleaned = normalize_string(raw).lower()
    if not cleaned:
        return None, "Material cannot be empty"
    canonical = MATERIAL_SYNONYMS.get(cleaned)
    if not canonical:
        return None, f"Unrecognized material: '{raw}'. Supported materials: {', '.join(sorted(set(MATERIAL_SYNONYMS.values())))}"
    return canonical, None


def normalize_process(raw: Optional[str]) -> Tuple[List[str], Optional[str]]:
    """
    Normalizes process name.
    Returns (list_of_target_processes, error_message).
    For example, 'CNC Machining' returns (['CNC milling', 'CNC turning'], None).
    """
    cleaned = normalize_string(raw).lower()
    if not cleaned:
        return [], "Process cannot be empty"
    targets = PROCESS_SYNONYMS.get(cleaned)
    if not targets:
        return [], f"Unrecognized process: '{raw}'. Supported processes: CNC milling, CNC turning, EDM, casting, forging, grinding, injection moulding, sheet metal, welding"
    return targets, None


def normalize_certification(raw: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Normalizes quality certification code.
    Returns (canonical_certification, error_message).
    """
    cleaned = normalize_string(raw).lower()
    if not cleaned or cleaned in ["none", "any", "all", "n/a", "na"]:
        return None, None
    canonical = CERTIFICATION_SYNONYMS.get(cleaned)
    if not canonical:
        return None, f"Unrecognized certification: '{raw}'. Supported: ISO 9001, ISO 14001, ISO 13485, IATF 16949, AS9100"
    return canonical, None
