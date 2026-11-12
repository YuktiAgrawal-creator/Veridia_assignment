"""
Veridia Match - Pydantic Schemas & Data Transfer Objects
"""
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class BuyerRequirement(BaseModel):
    material: str = Field(..., description="Target material (e.g. Aluminium, Stainless Steel)")
    process: str = Field(..., description="Target manufacturing process (e.g. CNC machining, Sheet Metal)")
    quantity: int = Field(..., ge=1, le=1000000, description="Required order volume in units")
    certification: Optional[str] = Field(None, description="Required quality standard (e.g. ISO 9001, AS9100)")
    delivery_deadline_days: int = Field(..., ge=1, le=365, description="Delivery deadline from order placement in days")
    destination_country: str = Field(..., min_length=2, description="Target import destination country")
    evaluation_date: Optional[str] = Field(
        None,
        description="Evaluation date for certification validity (YYYY-MM-DD). Defaults to request creation date.",
    )

    @field_validator("material", "process", "destination_country")
    @classmethod
    def strip_and_validate_nonempty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Field cannot be empty or blank")
        return s

    @field_validator("evaluation_date")
    @classmethod
    def validate_eval_date(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        v = v.strip()
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Invalid evaluation_date format '{v}'. Must be YYYY-MM-DD.")
        return v


class ScoreBreakdown(BaseModel):
    delivery_suitability: float = Field(..., description="Points from lead time slack (max 35)")
    capacity_suitability: float = Field(..., description="Points from volume & MOQ fit (max 30)")
    certification_quality: float = Field(..., description="Points from certified standards (max 20)")
    track_record: float = Field(..., description="Points from OTD % and export history (max 15)")
    total_score: float = Field(..., description="Total composite score out of 100")


class ManufacturerMatch(BaseModel):
    record_id: str
    manufacturer_id: str
    name: str
    country: str
    city: str
    state: str
    state_name: str
    full_address: str
    company_size: str
    status: str = Field(..., description="ELIGIBLE, NEEDS_VERIFICATION, or INELIGIBLE")
    match_score: float
    score_breakdown: ScoreBreakdown
    materials: List[str]
    processes: List[str]
    primary_process: str
    certifications: List[str]
    certification_expiry: Optional[str]
    last_audit_date: Optional[str]
    capacity_units_per_month: int
    min_order_qty: int
    max_order_qty: int
    lead_time_days: Optional[int]
    lead_time_weeks: Optional[float]
    export_experience_years: int
    on_time_delivery_pct: float
    delivery_rating: str
    contact_email: str
    website: str
    reasons: List[str]
    warnings: List[str]


class MatchResponse(BaseModel):
    request_id: str
    created_at: str
    evaluation_date: str
    requirements: BuyerRequirement
    total_scanned: int
    total_eligible: int
    total_needs_verification: int
    total_ineligible: int
    results: List[ManufacturerMatch]


class DataQualityCollision(BaseModel):
    manufacturer_id: str
    count: int
    records: List[Dict[str, Any]]


class DataQualityReport(BaseModel):
    total_records: int
    unique_ids: int
    id_collisions: List[DataQualityCollision]
    missing_lead_time_count: int
    missing_lead_time_ids: List[str]
    invalid_otd_pct_count: int
    invalid_otd_pct_records: List[Dict[str, Any]]
    materials_catalog: List[str]
    processes_catalog: List[str]
    certifications_catalog: List[str]
    cities_count: int
    states_count: int


class FilterOptionsResponse(BaseModel):
    materials: List[str]
    processes: List[str]
    certifications: List[str]
    popular_destinations: List[str]
    min_capacity: int
    max_capacity: int
    min_lead_time_days: int
    max_lead_time_days: int
