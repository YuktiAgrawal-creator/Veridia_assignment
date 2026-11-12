"""
Veridia Match - Dataset Loader & In-Memory Store
"""
import csv
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from backend.app.config import CSV_PATH

logger = logging.getLogger(__name__)


class DatasetStore:
    _instance: Optional["DatasetStore"] = None

    def __init__(self, csv_path: str = CSV_PATH):
        self.csv_path = csv_path
        self.records: List[Dict[str, Any]] = []
        self.quality_report: Dict[str, Any] = {}
        self._load_and_index()

    @classmethod
    def get_instance(cls, csv_path: str = CSV_PATH) -> "DatasetStore":
        if cls._instance is None:
            cls._instance = cls(csv_path)
        return cls._instance

    @classmethod
    def reset_instance(cls):
        cls._instance = None

    def _load_and_index(self):
        records = []
        id_counts: Dict[str, List[Dict[str, Any]]] = {}
        missing_lead_time_ids = []
        invalid_otd_pct_records = []
        materials_set = set()
        processes_set = set()
        certifications_set = set()
        cities_set = set()
        states_set = set()

        with open(self.csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                mid = row["manufacturer_id"].strip()
                record_id = f"{mid}_rec_{idx+1}"

                # Materials list
                raw_materials = [m.strip() for m in row.get("materials", "").split(";") if m.strip()]
                for m in raw_materials:
                    materials_set.add(m)

                # Processes list
                raw_processes = [p.strip() for p in row.get("processes", "").split(";") if p.strip()]
                for p in raw_processes:
                    processes_set.add(p)

                # Certifications list
                raw_certs = [c.strip() for c in row.get("certifications", "").split(";") if c.strip()]
                for c in raw_certs:
                    certifications_set.add(c)

                # Geo
                city = row.get("city", "").strip()
                state = row.get("state", "").strip()
                state_name = row.get("state_name", "").strip()
                if city:
                    cities_set.add(city)
                if state_name:
                    states_set.add(state_name)

                # Numerics & Dates
                capacity = int(row.get("capacity_units_per_month") or 0)
                min_order = int(row.get("min_order_qty") or 0)
                max_order = int(row.get("max_order_qty") or 0)
                exp_years = int(row.get("export_experience_years") or 0)

                raw_lead_days = row.get("lead_time_days", "").strip()
                raw_lead_weeks = row.get("lead_time_weeks", "").strip()
                lead_days = int(float(raw_lead_days)) if raw_lead_days else None
                lead_weeks = float(raw_lead_weeks) if raw_lead_weeks else None

                if lead_days is None:
                    missing_lead_time_ids.append(mid)

                raw_otd = float(row.get("on_time_delivery_pct", "0").strip() or 0)
                if raw_otd > 100.0 or raw_otd < 0.0:
                    invalid_otd_pct_records.append({
                        "manufacturer_id": mid,
                        "name": row.get("name", "").strip(),
                        "on_time_delivery_pct": raw_otd,
                        "delivery_rating": row.get("delivery_rating", "").strip(),
                    })

                cert_expiry = row.get("certification_expiry", "").strip() or None
                last_audit = row.get("last_audit_date", "").strip() or None

                entry = {
                    "record_id": record_id,
                    "manufacturer_id": mid,
                    "name": row.get("name", "").strip(),
                    "country": row.get("country", "").strip() or "India",
                    "city": city,
                    "state": state,
                    "state_name": state_name,
                    "full_address": row.get("full_address", "").strip(),
                    "company_size": row.get("company_size", "").strip(),
                    "capacity_tier": row.get("capacity_tier", "").strip(),
                    "capacity_units_per_month": capacity,
                    "min_order_qty": min_order,
                    "max_order_qty": max_order,
                    "lead_time_days": lead_days,
                    "lead_time_weeks": lead_weeks,
                    "materials": raw_materials,
                    "processes": raw_processes,
                    "primary_process": row.get("primary_process", "").strip(),
                    "certifications": raw_certs,
                    "certification_expiry": cert_expiry,
                    "last_audit_date": last_audit,
                    "export_experience_years": exp_years,
                    "on_time_delivery_pct": raw_otd,
                    "delivery_rating": row.get("delivery_rating", "").strip(),
                    "contact_email": row.get("contact_email", "").strip(),
                    "website": row.get("website", "").strip(),
                    "status": row.get("status", "active").strip(),
                }
                records.append(entry)

                if mid not in id_counts:
                    id_counts[mid] = []
                id_counts[mid].append(entry)

        # Detect ID collisions
        id_collisions = []
        for mid, entries in id_counts.items():
            if len(entries) > 1:
                id_collisions.append({
                    "manufacturer_id": mid,
                    "count": len(entries),
                    "records": [
                        {
                            "record_id": e["record_id"],
                            "name": e["name"],
                            "city": e["city"],
                            "capacity": e["capacity_units_per_month"],
                        }
                        for e in entries
                    ],
                })

        self.records = records
        self.quality_report = {
            "total_records": len(records),
            "unique_ids": len(id_counts),
            "id_collisions": id_collisions,
            "missing_lead_time_count": len(missing_lead_time_ids),
            "missing_lead_time_ids": missing_lead_time_ids,
            "invalid_otd_pct_count": len(invalid_otd_pct_records),
            "invalid_otd_pct_records": invalid_otd_pct_records,
            "materials_catalog": sorted(list(materials_set)),
            "processes_catalog": sorted(list(processes_set)),
            "certifications_catalog": sorted(list(certifications_set)),
            "cities_count": len(cities_set),
            "states_count": len(states_set),
        }
        logger.info(f"Loaded {len(records)} manufacturer records into memory.")

    def get_all_records(self) -> List[Dict[str, Any]]:
        """Returns read-only copy of manufacturer dataset records."""
        return self.records

    def get_quality_report(self) -> Dict[str, Any]:
        return self.quality_report
