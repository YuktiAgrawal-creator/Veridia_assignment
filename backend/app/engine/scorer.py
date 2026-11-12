"""
Veridia Match - Transparent Weighted Scoring Engine
"""
from typing import Optional, Dict, Any, Tuple
from backend.app.models.schemas import ScoreBreakdown


def calculate_delivery_score(
    lead_time_days: Optional[int],
    deadline_days: int,
) -> Tuple[float, str]:
    """
    Computes delivery suitability score (0 - 35 points).
    """
    if lead_time_days is None:
        return 15.0, "Lead time unverified in supplier records; baseline neutral points allocated."

    if lead_time_days > deadline_days:
        return 0.0, f"Lead time ({lead_time_days} days) exceeds requested deadline ({deadline_days} days)."

    # Buffer bonus
    slack_days = deadline_days - lead_time_days
    slack_ratio = slack_days / max(deadline_days, 1)
    # Score ranges from 20.0 (exact match) up to 35.0 (generous buffer)
    score = round(20.0 + (slack_ratio * 15.0), 1)
    score = min(35.0, max(0.0, score))
    return score, f"Lead time ({lead_time_days} days) comfortably meets deadline ({deadline_days} days) with {slack_days} days safety margin."


def calculate_capacity_score(
    quantity: int,
    monthly_capacity: int,
    min_order_qty: int,
    max_order_qty: int,
) -> Tuple[float, str]:
    """
    Computes capacity suitability score (0 - 30 points).
    """
    if monthly_capacity <= 0 or quantity > monthly_capacity:
        return 0.0, f"Order quantity ({quantity:,} units) exceeds monthly production capacity ({monthly_capacity:,} units)."

    utilization = quantity / monthly_capacity
    # Optimal utilization: 10% - 60% of shop monthly capacity
    if utilization <= 0.10:
        base_score = 22.0
    elif 0.10 < utilization <= 0.60:
        # Sweet spot: generous engagement without bottlenecking
        base_score = 26.0 + ((0.60 - abs(utilization - 0.35)) * 10.0)
    else:
        # High utilization: >60% of monthly capacity
        base_score = 18.0

    # Batch alignment check
    batch_adjustment = 0.0
    if min_order_qty <= quantity <= max_order_qty:
        batch_adjustment += 3.0
    elif quantity < min_order_qty:
        batch_adjustment -= 5.0
    elif quantity > max_order_qty:
        batch_adjustment -= 4.0

    final_score = round(min(30.0, max(0.0, base_score + batch_adjustment)), 1)
    msg = f"Order volume ({quantity:,} units) represents {utilization*100:.1f}% of monthly capacity ({monthly_capacity:,} units)."
    return final_score, msg


def calculate_certification_score(
    cert_status: str,
    total_certs_held: int,
    has_high_rigor_cert: bool,
    required_cert: Optional[str],
) -> Tuple[float, str]:
    """
    Computes certification quality score (0 - 20 points).
    """
    if required_cert:
        if cert_status == "VALID":
            base = 16.0
            # Bonus for holding multiple certifications
            if total_certs_held > 1:
                base += 4.0
            return round(min(20.0, base), 1), f"Verified valid {required_cert} certification with {total_certs_held} active standard(s)."
        elif cert_status == "UNVERIFIED":
            return 8.0, f"{required_cert} expiry is unverified; partial provisional score allocated."
        else:
            return 0.0, f"Required certification {required_cert} not satisfied."
    else:
        # Buyer did not mandate a specific certification; award score based on standards portfolio
        if total_certs_held >= 2:
            score = 17.0
        elif total_certs_held == 1:
            score = 13.0
        else:
            score = 5.0

        if has_high_rigor_cert:
            score += 3.0

        return round(min(20.0, score), 1), f"Holds {total_certs_held} active quality certification(s)."


def calculate_track_record_score(
    on_time_delivery_pct: float,
    export_experience_years: int,
) -> Tuple[float, str]:
    """
    Computes track record score (0 - 15 points):
    - On-Time Delivery % (clamped to 100%) -> max 8 points
    - Export experience (up to 25 yrs) -> max 7 points
    """
    clamped_otd = min(100.0, max(0.0, on_time_delivery_pct))
    otd_pts = (clamped_otd / 100.0) * 8.0

    export_pts = min(7.0, (export_experience_years / 25.0) * 7.0)

    total = round(min(15.0, otd_pts + export_pts), 1)
    msg = f"OTD: {clamped_otd:.1f}% ({otd_pts:.1f}/8 pts) | Export History: {export_experience_years} yrs ({export_pts:.1f}/7 pts)."
    return total, msg


def compute_match_score(
    lead_time_days: Optional[int],
    deadline_days: int,
    quantity: int,
    monthly_capacity: int,
    min_order_qty: int,
    max_order_qty: int,
    cert_status: str,
    total_certs_held: int,
    has_high_rigor_cert: bool,
    required_cert: Optional[str],
    on_time_delivery_pct: float,
    export_experience_years: int,
) -> Tuple[float, ScoreBreakdown, Dict[str, str]]:
    """
    Computes transparent composite score and returns detailed breakdown.
    """
    deliv_score, deliv_msg = calculate_delivery_score(lead_time_days, deadline_days)
    cap_score, cap_msg = calculate_capacity_score(quantity, monthly_capacity, min_order_qty, max_order_qty)
    cert_score, cert_msg = calculate_certification_score(
        cert_status, total_certs_held, has_high_rigor_cert, required_cert
    )
    track_score, track_msg = calculate_track_record_score(on_time_delivery_pct, export_experience_years)

    total = round(deliv_score + cap_score + cert_score + track_score, 1)
    total = min(100.0, max(0.0, total))

    breakdown = ScoreBreakdown(
        delivery_suitability=deliv_score,
        capacity_suitability=cap_score,
        certification_quality=cert_score,
        track_record=track_score,
        total_score=total,
    )

    explanations = {
        "delivery": deliv_msg,
        "capacity": cap_msg,
        "certification": cert_msg,
        "track_record": track_msg,
    }

    return total, breakdown, explanations
