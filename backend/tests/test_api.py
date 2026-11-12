"""
API Endpoint and Schema Validation Unit Tests
Directly invokes API handlers and verifies Pydantic schema validation.
"""
import unittest
from backend.app.api.routes import (
    health_check,
    get_manufacturer_stats,
    get_filter_options,
    execute_matching,
    get_match_results,
    get_data_quality,
    parse_rfq,
    NLPParseRequest,
)
from backend.app.models.schemas import BuyerRequirement
from fastapi import HTTPException
from pydantic import ValidationError


class TestAPIEndpoints(unittest.TestCase):
    def test_health_endpoint(self):
        data = health_check()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["total_manufacturers_loaded"], 1000)

    def test_stats_endpoint(self):
        data = get_manufacturer_stats()
        self.assertEqual(data["total_manufacturers"], 1000)
        self.assertIn("verified_certification_count", data)
        self.assertIn("complete_records_count", data)
        self.assertGreater(data["complete_records_count"], 900)

    def test_filters_endpoint(self):
        data = get_filter_options()
        self.assertIn("aluminium", data.materials)
        self.assertIn("CNC milling", data.processes)
        self.assertIn("ISO 9001", data.certifications)

    def test_data_quality_endpoint(self):
        report = get_data_quality()
        self.assertEqual(report.total_records, 1000)
        self.assertEqual(report.missing_lead_time_count, 10)
        self.assertEqual(report.invalid_otd_pct_count, 10)
        self.assertEqual(len(report.id_collisions), 10)

    def test_match_post_and_get(self):
        req = BuyerRequirement(
            material="Aluminium",
            process="CNC machining",
            quantity=1000,
            certification="ISO 9001",
            delivery_deadline_days=42,
            destination_country="United States",
        )
        match_resp = execute_matching(req)
        self.assertIsNotNone(match_resp.request_id)
        self.assertGreater(match_resp.total_eligible, 0)

        # GET by request_id
        retrieved = get_match_results(match_resp.request_id)
        self.assertEqual(retrieved.request_id, match_resp.request_id)
        self.assertEqual(retrieved.requirements.material, "Aluminium")

    def test_match_non_existent_id_raises_404(self):
        with self.assertRaises(HTTPException) as cm:
            get_match_results("non-existent-uuid-12345")
        self.assertEqual(cm.exception.status_code, 404)

    def test_invalid_input_validation(self):
        # Negative quantity must raise Pydantic ValidationError
        with self.assertRaises(ValidationError):
            BuyerRequirement(
                material="Aluminium",
                process="CNC machining",
                quantity=-500,
                delivery_deadline_days=42,
                destination_country="United States",
            )

        # Empty material
        with self.assertRaises(ValidationError):
            BuyerRequirement(
                material="   ",
                process="CNC machining",
                quantity=500,
                delivery_deadline_days=42,
                destination_country="United States",
            )

    def test_ai_parse_rfq_endpoint(self):
        req = NLPParseRequest(
            rfq_text="Looking for 2500 units of titanium CNC turning components certified with AS9100 within 60 days to Germany"
        )
        resp = parse_rfq(req)
        self.assertEqual(resp["status"], "success")
        parsed = resp["parsed_requirements"]
        self.assertEqual(parsed["material"], "titanium")
        self.assertEqual(parsed["process"], "CNC turning")
        self.assertEqual(parsed["quantity"], 2500)
        self.assertEqual(parsed["certification"], "AS9100")
        self.assertEqual(parsed["delivery_deadline_days"], 60)
        self.assertEqual(parsed["destination_country"], "Germany")


if __name__ == "__main__":
    unittest.main()
