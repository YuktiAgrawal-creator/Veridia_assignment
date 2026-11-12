"""
Unit tests for Two-Stage Matching Engine
"""
import unittest
from datetime import date
from backend.app.data.loader import DatasetStore
from backend.app.engine.matcher import MatchEngine
from backend.app.models.schemas import BuyerRequirement


class TestMatchingEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.store = DatasetStore.get_instance()
        cls.records = cls.store.get_all_records()
        cls.engine = MatchEngine(cls.records)

    def test_correct_material_matching(self):
        req = BuyerRequirement(
            material="titanium",
            process="CNC milling",
            quantity=1000,
            certification=None,
            delivery_deadline_days=90,
            destination_country="United States",
        )
        matches, counts = self.engine.evaluate_match(req, date(2027, 1, 1), include_ineligible=False)
        self.assertGreater(len(matches), 0)
        for m in matches:
            # Each match must explicitly support titanium
            self.assertIn("titanium", [mat.lower() for mat in m.materials])

    def test_correct_process_matching_with_synonym(self):
        # "CNC machining" should match CNC milling or CNC turning
        req = BuyerRequirement(
            material="aluminium",
            process="CNC machining",
            quantity=500,
            certification="ISO 9001",
            delivery_deadline_days=60,
            destination_country="Germany",
        )
        matches, counts = self.engine.evaluate_match(req, date(2027, 1, 1), include_ineligible=False)
        self.assertGreater(len(matches), 0)
        for m in matches:
            procs_lower = [p.lower() for p in m.processes]
            has_cnc = "cnc milling" in procs_lower or "cnc turning" in procs_lower
            self.assertTrue(has_cnc, f"Manufacturer {m.name} does not have CNC process: {m.processes}")

    def test_insufficient_capacity_disqualification(self):
        # Max capacity in dataset is 40,000 units. A request for 50,000 should disqualify all
        req = BuyerRequirement(
            material="aluminium",
            process="CNC milling",
            quantity=50000,
            certification=None,
            delivery_deadline_days=90,
            destination_country="United States",
        )
        matches, counts = self.engine.evaluate_match(req, date(2027, 1, 1), include_ineligible=False)
        # All records should be disqualified due to capacity
        self.assertEqual(len(matches), 0)
        self.assertGreater(counts["ineligible"], 0)

    def test_delivery_deadline_filtering(self):
        # Tight deadline: 15 days (only lead times <= 15 days should qualify)
        req = BuyerRequirement(
            material="aluminium",
            process="CNC milling",
            quantity=500,
            certification=None,
            delivery_deadline_days=15,
            destination_country="United States",
        )
        matches, counts = self.engine.evaluate_match(req, date(2027, 1, 1), include_ineligible=False)
        for m in matches:
            if m.status == "ELIGIBLE":
                self.assertIsNotNone(m.lead_time_days)
                self.assertLessEqual(m.lead_time_days, 15)

    def test_missing_lead_time_yields_needs_verification(self):
        # Specifically test with one of the records having missing lead time (e.g. VM1150)
        rec = next(r for r in self.records if r["manufacturer_id"] == "VM1150")
        self.assertIsNone(rec["lead_time_days"])

        engine = MatchEngine([rec])
        req = BuyerRequirement(
            material=rec["materials"][0],
            process=rec["processes"][0],
            quantity=100,
            certification=None,
            delivery_deadline_days=60,
            destination_country="United States",
        )
        matches, counts = engine.evaluate_match(req, date(2027, 1, 1), include_ineligible=False)
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0].status, "NEEDS_VERIFICATION")
        self.assertTrue(any("Lead time" in w or "turnaround" in w for w in matches[0].warnings))

    def test_empty_results_for_impossible_combination(self):
        # In this dataset, ABS is never combined with welding or impossible combo
        # Or require an expiry date in 2050 (all certs expire by 2029)
        req = BuyerRequirement(
            material="ABS",
            process="injection moulding",
            quantity=1000,
            certification="ISO 9001",
            delivery_deadline_days=60,
            destination_country="Japan",
            evaluation_date="2035-01-01",  # Far future evaluation date: all certificates expired!
        )
        matches, counts = self.engine.evaluate_match(req, date(2035, 1, 1), include_ineligible=False)
        # All certs are expired by 2035
        self.assertEqual(len(matches), 0)
        self.assertGreater(counts["ineligible"], 0)

    def test_duplicate_manufacturer_ids_preserved(self):
        # Both distinct manufacturers with ID 'VM1092' should be in the dataset with distinct record_ids
        vm1092_recs = [r for r in self.records if r["manufacturer_id"] == "VM1092"]
        self.assertEqual(len(vm1092_recs), 2)
        self.assertNotEqual(vm1092_recs[0]["name"], vm1092_recs[1]["name"])
        self.assertNotEqual(vm1092_recs[0]["record_id"], vm1092_recs[1]["record_id"])


if __name__ == "__main__":
    unittest.main()
