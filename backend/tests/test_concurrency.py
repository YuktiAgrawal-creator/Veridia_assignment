"""
Unit and integration tests for Multiple Buyer Concurrency & Request Isolation
"""
import unittest
import threading
import concurrent.futures
from backend.app.models.schemas import BuyerRequirement
from backend.app.services.match_service import MatchService


class TestConcurrencyAndIsolation(unittest.TestCase):
    def setUp(self):
        self.service = MatchService()

    def test_simultaneous_buyers_a_and_b(self):
        """
        Tests the exact concurrency scenario from specification:
        BUYER A:
        - Aluminium
        - CNC machining
        - 1,000 units
        - ISO 9001
        - 42 days
        
        BUYER B:
        - Stainless steel
        - Sheet metal
        - 1,500 units
        - ISO 9001
        - 42 days
        """
        buyer_a_req = BuyerRequirement(
            material="Aluminium",
            process="CNC machining",
            quantity=1000,
            certification="ISO 9001",
            delivery_deadline_days=42,
            destination_country="United States",
        )

        buyer_b_req = BuyerRequirement(
            material="Stainless steel",
            process="Sheet metal",
            quantity=1500,
            certification="ISO 9001",
            delivery_deadline_days=42,
            destination_country="Germany",
        )

        results = {}

        def run_buyer(name, req):
            res = self.service.execute_match(req)
            results[name] = res

        # Run both simultaneously using ThreadPoolExecutor
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            fut_a = executor.submit(run_buyer, "buyer_a", buyer_a_req)
            fut_b = executor.submit(run_buyer, "buyer_b", buyer_b_req)
            concurrent.futures.wait([fut_a, fut_b])

        res_a = results["buyer_a"]
        res_b = results["buyer_b"]

        # 1. Unique Request IDs
        self.assertIsNotNone(res_a.request_id)
        self.assertIsNotNone(res_b.request_id)
        self.assertNotEqual(res_a.request_id, res_b.request_id)

        # 2. Buyer A's original requirements preserved
        self.assertEqual(res_a.requirements.material, "Aluminium")
        self.assertEqual(res_a.requirements.process, "CNC machining")
        self.assertEqual(res_a.requirements.quantity, 1000)

        # 3. Buyer B's original requirements preserved
        self.assertEqual(res_b.requirements.material, "Stainless steel")
        self.assertEqual(res_b.requirements.process, "Sheet metal")
        self.assertEqual(res_b.requirements.quantity, 1500)

        # 4. Result sets are independent and specific to requirements
        self.assertGreater(len(res_a.results), 0)
        self.assertGreater(len(res_b.results), 0)

        for m in res_a.results:
            self.assertIn("aluminium", [mat.lower() for mat in m.materials])

        for m in res_b.results:
            self.assertIn("stainless steel", [mat.lower() for mat in m.materials])
            self.assertIn("sheet metal", [p.lower() for p in m.processes])

    def test_request_isolation_and_saved_retrieval(self):
        """
        Verifies that retrieving a saved request produces the exact frozen results
        and evaluation date, independent of future calendar days.
        """
        req = BuyerRequirement(
            material="copper",
            process="welding",
            quantity=500,
            certification="AS9100",
            delivery_deadline_days=50,
            destination_country="United Kingdom",
            evaluation_date="2027-04-01",  # Fixed evaluation date
        )

        created = self.service.execute_match(req)
        retrieved = self.service.get_match_by_id(created.request_id)

        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.request_id, created.request_id)
        self.assertEqual(retrieved.evaluation_date, "2027-04-01")
        self.assertEqual(retrieved.total_eligible, created.total_eligible)
        self.assertEqual(len(retrieved.results), len(created.results))
        if len(retrieved.results) > 0:
            self.assertEqual(retrieved.results[0].manufacturer_id, created.results[0].manufacturer_id)
            self.assertEqual(retrieved.results[0].match_score, created.results[0].match_score)


if __name__ == "__main__":
    unittest.main()
