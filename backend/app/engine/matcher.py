"""
Veridia Match - Two-Stage Matchmaking Engine
"""
import logging
from datetime import date
from typing import List, Dict, Any, Tuple, Optional

from backend.app.models.schemas import BuyerRequirement, ManufacturerMatch, ScoreBreakdown
from backend.app.data.cleaner import (
    normalize_material,
    normalize_process,
    normalize_certification,
)
from backend.app.engine.expiry import evaluate_certification_validity, CertStatus, parse_iso_date
from backend.app.engine.scorer import compute_match_score

logger = logging.getLogger(__name__)


class MatchEngine:
    def __init__(self, dataset_records: List[Dict[str, Any]]):
        self.dataset_records = dataset_records

    def evaluate_match(
        self,
        requirements: BuyerRequirement,
        evaluation_date: date,
        include_ineligible: bool = False,
    ) -> Tuple[List[ManufacturerMatch], Dict[str, int]]:
        """
        Executes two-stage matching:
        Stage 1: Hard eligibility filtering (Material, Process, Certification, Capacity, Deadline).
        Stage 2: Transparent weighted scoring and explanation generation.
        """
        # Step 0: Normalize buyer requirements
        norm_material, mat_err = normalize_material(requirements.material)
        if mat_err:
            raise ValueError(mat_err)

        target_processes, proc_err = normalize_process(requirements.process)
        if proc_err:
            raise ValueError(proc_err)

        norm_cert, cert_err = normalize_certification(requirements.certification)
        if cert_err:
            raise ValueError(cert_err)

        evaluated_matches: List[ManufacturerMatch] = []
        counts = {"eligible": 0, "needs_verification": 0, "ineligible": 0}

        for record in self.dataset_records:
            reasons: List[str] = []
            warnings: List[str] = []
            ineligible_reasons: List[str] = []
            needs_verification_reasons: List[str] = []

            # ----------------------------------------------------
            # STAGE 1: HARD ELIGIBILITY FILTERING
            # ----------------------------------------------------

            # 1. Material Matching
            mfg_materials = [m.lower().strip() for m in record["materials"]]
            if norm_material.lower() in mfg_materials:
                reasons.append(f"Supports required material '{norm_material}'.")
            else:
                ineligible_reasons.append(
                    f"Does not support '{norm_material}' (supports: {', '.join(record['materials'])})."
                )

            # 2. Process Matching
            mfg_processes = [p.lower().strip() for p in record["processes"]]
            matched_procs = [
                tp for tp in target_processes if tp.lower() in mfg_processes
            ]
            if matched_procs:
                reasons.append(
                    f"Offers process '{', '.join(matched_procs)}' (primary specialty: {record['primary_process']})."
                )
            else:
                ineligible_reasons.append(
                    f"Does not offer requested process '{requirements.process}' (offers: {', '.join(record['processes'])})."
                )

            # 3. Certification Validity Matching
            cert_status, cert_msg = evaluate_certification_validity(
                manufacturer_certs=record["certifications"],
                required_cert=norm_cert,
                raw_expiry_date=record.get("certification_expiry"),
                raw_audit_date=record.get("last_audit_date"),
                evaluation_date=evaluation_date,
            )

            if norm_cert:
                if cert_status == CertStatus.VALID:
                    reasons.append(cert_msg)
                elif cert_status == CertStatus.UNVERIFIED:
                    needs_verification_reasons.append(cert_msg)
                    warnings.append(cert_msg)
                else:  # EXPIRED or NOT_HELD
                    ineligible_reasons.append(cert_msg)
            else:
                # Buyer has no mandatory certification
                reasons.append(
                    f"Holds certified standards: {', '.join(record['certifications'])}."
                )

            # 4. Capacity Feasibility Matching
            mfg_capacity = record["capacity_units_per_month"]
            if mfg_capacity <= 0:
                needs_verification_reasons.append("Monthly production capacity is unrecorded.")
                warnings.append("Supplier monthly capacity not published.")
            elif requirements.quantity > mfg_capacity:
                ineligible_reasons.append(
                    f"Order volume ({requirements.quantity:,} units) exceeds monthly capacity ({mfg_capacity:,} units)."
                )
            else:
                reasons.append(
                    f"Monthly capacity of {mfg_capacity:,} units accommodates requested {requirements.quantity:,} units."
                )

            # Batch order range check
            moq = record["min_order_qty"]
            max_order = record["max_order_qty"]
            if requirements.quantity < moq:
                warnings.append(
                    f"Requested volume ({requirements.quantity:,}) is below supplier minimum order quantity ({moq:,} units)."
                )
            elif requirements.quantity > max_order:
                warnings.append(
                    f"Requested volume ({requirements.quantity:,}) exceeds standard single batch limit ({max_order:,} units)."
                )

            # 5. Delivery Deadline Matching
            mfg_lead_days = record["lead_time_days"]
            if mfg_lead_days is None:
                needs_verification_reasons.append("Lead time data unavailable in dataset record.")
                warnings.append("Estimated turnaround unrecorded; requires direct delivery confirmation.")
            elif mfg_lead_days > requirements.delivery_deadline_days:
                ineligible_reasons.append(
                    f"Estimated lead time ({mfg_lead_days} days) exceeds requested deadline ({requirements.delivery_deadline_days} days)."
                )
            else:
                slack = requirements.delivery_deadline_days - mfg_lead_days
                reasons.append(
                    f"Estimated lead time of {mfg_lead_days} days satisfies requested {requirements.delivery_deadline_days}-day deadline ({slack} days buffer)."
                )

            # 6. Destination Country & Export Capabilities
            exp_years = record.get("export_experience_years", 0)
            if exp_years > 0:
                reasons.append(f"Proven export capabilities ({exp_years} years international shipping experience).")
            warnings.append(
                f"Manufacturer is based in {record['city']}, {record['state_name']}, India. Customs clearance, shipping lanes, and import tariffs for {requirements.destination_country} require direct verification."
            )

            # 7. Check Data Quality Anomalies for this supplier
            if record["on_time_delivery_pct"] > 100.0:
                warnings.append(
                    f"Historical on-time delivery metric recorded as {record['on_time_delivery_pct']}%; clamped to 100.0%."
                )

            # ----------------------------------------------------
            # STATUS DECISION
            # ----------------------------------------------------
            if ineligible_reasons:
                status = "INELIGIBLE"
                counts["ineligible"] += 1
                warnings.extend([f"DISQUALIFIED: {r}" for r in ineligible_reasons])
            elif needs_verification_reasons:
                status = "NEEDS_VERIFICATION"
                counts["needs_verification"] += 1
            else:
                status = "ELIGIBLE"
                counts["eligible"] += 1

            if not include_ineligible and status == "INELIGIBLE":
                continue

            # ----------------------------------------------------
            # STAGE 2: WEIGHTED SCORING
            # ----------------------------------------------------
            has_high_rigor = any(
                c in ["AS9100", "IATF 16949", "ISO 13485"] for c in record["certifications"]
            )
            score, breakdown, score_msgs = compute_match_score(
                lead_time_days=mfg_lead_days,
                deadline_days=requirements.delivery_deadline_days,
                quantity=requirements.quantity,
                monthly_capacity=mfg_capacity,
                min_order_qty=moq,
                max_order_qty=max_order,
                cert_status=cert_status.value,
                total_certs_held=len(record["certifications"]),
                has_high_rigor_cert=has_high_rigor,
                required_cert=norm_cert,
                on_time_delivery_pct=record["on_time_delivery_pct"],
                export_experience_years=exp_years,
            )

            # Ineligible records score zero
            if status == "INELIGIBLE":
                score = 0.0
                breakdown = ScoreBreakdown(
                    delivery_suitability=0.0,
                    capacity_suitability=0.0,
                    certification_quality=0.0,
                    track_record=0.0,
                    total_score=0.0,
                )

            m_match = ManufacturerMatch(
                record_id=record["record_id"],
                manufacturer_id=record["manufacturer_id"],
                name=record["name"],
                country=record["country"],
                city=record["city"],
                state=record["state"],
                state_name=record["state_name"],
                full_address=record["full_address"],
                company_size=record["company_size"],
                status=status,
                match_score=score,
                score_breakdown=breakdown,
                materials=record["materials"],
                processes=record["processes"],
                primary_process=record["primary_process"],
                certifications=record["certifications"],
                certification_expiry=record["certification_expiry"],
                last_audit_date=record["last_audit_date"],
                capacity_units_per_month=mfg_capacity,
                min_order_qty=moq,
                max_order_qty=max_order,
                lead_time_days=mfg_lead_days,
                lead_time_weeks=record.get("lead_time_weeks"),
                export_experience_years=exp_years,
                on_time_delivery_pct=record["on_time_delivery_pct"],
                delivery_rating=record["delivery_rating"],
                contact_email=record["contact_email"],
                website=record["website"],
                reasons=reasons,
                warnings=warnings,
            )
            evaluated_matches.append(m_match)

        # Sort: ELIGIBLE first, then NEEDS_VERIFICATION; within each, descending by match_score
        status_priority = {"ELIGIBLE": 0, "NEEDS_VERIFICATION": 1, "INELIGIBLE": 2}
        evaluated_matches.sort(
            key=lambda x: (status_priority.get(x.status, 3), -x.match_score, x.lead_time_days or 999)
        )

        return evaluated_matches, counts
