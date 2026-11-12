"""
Veridia Match - REST API Endpoints
"""
import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.app.config import (
    CANONICAL_MATERIALS,
    CANONICAL_PROCESSES,
    CANONICAL_CERTIFICATIONS,
    POPULAR_DESTINATIONS,
)
from backend.app.data.loader import DatasetStore
from backend.app.models.schemas import (
    BuyerRequirement,
    MatchResponse,
    DataQualityReport,
    FilterOptionsResponse,
)
from backend.app.services.match_service import MatchService
from backend.app.engine.nlp_parser import parse_natural_language_rfq

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Matchmaking"])
match_service = MatchService()


class NLPParseRequest(BaseModel):
    rfq_text: str = Field(..., min_length=3, description="Free text description of manufacturing need")


@router.get("/health", summary="Health Check")
def health_check() -> Dict[str, Any]:
    store = DatasetStore.get_instance()
    return {
        "status": "healthy",
        "service": "Veridia Match API",
        "version": "1.0.0",
        "total_manufacturers_loaded": len(store.get_all_records()),
    }


@router.get("/manufacturers/stats", summary="Manufacturer Dataset Aggregate Statistics")
def get_manufacturer_stats() -> Dict[str, Any]:
    store = DatasetStore.get_instance()
    records = store.get_all_records()

    verified_cert_count = sum(
        1 for r in records if r.get("certifications") and len(r["certifications"]) > 0
    )
    complete_record_count = sum(
        1
        for r in records
        if r.get("lead_time_days") is not None
        and 0 <= r.get("on_time_delivery_pct", 0) <= 100.0
        and r.get("capacity_units_per_month", 0) > 0
    )

    process_distribution = {}
    material_distribution = {}
    for r in records:
        for p in r.get("processes", []):
            process_distribution[p] = process_distribution.get(p, 0) + 1
        for m in r.get("materials", []):
            material_distribution[m] = material_distribution.get(m, 0) + 1

    return {
        "total_manufacturers": len(records),
        "verified_certification_count": verified_cert_count,
        "complete_records_count": complete_record_count,
        "incomplete_records_count": len(records) - complete_record_count,
        "available_capabilities": {
            "processes": process_distribution,
            "materials": material_distribution,
        },
        "clusters": {
            "states_count": 10,
            "cities_count": 16,
        },
    }


@router.get("/manufacturers/filters", response_model=FilterOptionsResponse, summary="Available Requirement Filters")
def get_filter_options() -> FilterOptionsResponse:
    store = DatasetStore.get_instance()
    qr = store.get_quality_report()

    return FilterOptionsResponse(
        materials=qr.get("materials_catalog", CANONICAL_MATERIALS),
        processes=qr.get("processes_catalog", CANONICAL_PROCESSES),
        certifications=["ISO 9001", "AS9100", "IATF 16949", "ISO 13485", "ISO 14001"],
        popular_destinations=POPULAR_DESTINATIONS,
        min_capacity=1500,
        max_capacity=40000,
        min_lead_time_days=14,
        max_lead_time_days=98,
    )


@router.post("/match", response_model=MatchResponse, status_code=status.HTTP_201_CREATED, summary="Execute Matchmaking")
def execute_matching(requirements: BuyerRequirement) -> MatchResponse:
    try:
        response = match_service.execute_match(requirements)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Error running match engine: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while executing the matchmaking algorithm. Please check input parameters.",
        )


@router.get("/match/{request_id}", response_model=MatchResponse, summary="Retrieve Match Results by Request ID")
def get_match_results(request_id: str) -> MatchResponse:
    result = match_service.get_match_by_id(request_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match request '{request_id}' not found.",
        )
    return result


@router.get("/match/recent/all", summary="Get Recent Matching Requests")
def get_recent_matches(limit: int = Query(default=6, ge=1, le=20)) -> List[Dict[str, Any]]:
    return match_service.get_recent_requests(limit=limit)


@router.get("/data-quality", response_model=DataQualityReport, summary="Get Data Quality Insights & Audits")
def get_data_quality() -> DataQualityReport:
    store = DatasetStore.get_instance()
    report = store.get_quality_report()
    return DataQualityReport(**report)


@router.post("/ai/parse-rfq", summary="Parse Natural Language RFQ into Structured Requirements")
def parse_rfq(payload: NLPParseRequest) -> Dict[str, Any]:
    structured = parse_natural_language_rfq(payload.rfq_text)
    return {
        "status": "success",
        "parsed_requirements": structured,
        "mode": "deterministic_nlp_rule_parser",
    }
