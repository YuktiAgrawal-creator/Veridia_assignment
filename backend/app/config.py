"""
Veridia Match - Configuration & Constants
"""
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
CSV_PATH = os.getenv("VERIDIA_CSV_PATH", str(BASE_DIR / "veridia_csv.csv"))
DB_PATH = os.getenv("VERIDIA_DB_PATH", str(BASE_DIR / "veridia_match.db"))

# Scoring Weights (Sum = 1.0)
WEIGHT_DELIVERY = 0.35
WEIGHT_CAPACITY = 0.30
WEIGHT_CERTIFICATION = 0.20
WEIGHT_TRACK_RECORD = 0.15

# Canonical Supported Lists
CANONICAL_MATERIALS = [
    "aluminium",
    "stainless steel",
    "mild steel",
    "copper",
    "brass",
    "titanium",
    "nylon",
    "ABS",
    "cast iron",
]

CANONICAL_PROCESSES = [
    "CNC milling",
    "CNC turning",
    "EDM",
    "casting",
    "forging",
    "grinding",
    "injection moulding",
    "sheet metal",
    "welding",
]

CANONICAL_CERTIFICATIONS = [
    "ISO 9001",
    "ISO 14001",
    "ISO 13485",
    "IATF 16949",
    "AS9100",
]

POPULAR_DESTINATIONS = [
    "United States",
    "Germany",
    "United Kingdom",
    "Japan",
    "Netherlands",
    "France",
    "Canada",
    "Australia",
    "Italy",
    "Singapore",
]
