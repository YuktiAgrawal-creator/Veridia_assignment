"""
Unit tests for certification expiry evaluation logic
"""
import unittest
from datetime import date
from backend.app.engine.expiry import (
    evaluate_certification_validity,
    CertStatus,
)


class TestCertificationExpiry(unittest.TestCase):
    def setUp(self):
        self.manufacturer_certs = ["ISO 9001", "AS9100"]

    def test_cert_valid_on_evaluation_date(self):
        # Evaluation date prior to expiry
        eval_date = date(2027, 1, 15)
        status, msg = evaluate_certification_validity(
            manufacturer_certs=self.manufacturer_certs,
            required_cert="ISO 9001",
            raw_expiry_date="2028-06-30",
            raw_audit_date="2026-05-10",
            evaluation_date=eval_date,
        )
        self.assertEqual(status, CertStatus.VALID)
        self.assertIn("valid on evaluation date 2027-01-15", msg)

    def test_cert_expired_before_evaluation_date(self):
        # Evaluation date occurs AFTER expiry
        eval_date = date(2028, 7, 1)
        status, msg = evaluate_certification_validity(
            manufacturer_certs=self.manufacturer_certs,
            required_cert="ISO 9001",
            raw_expiry_date="2028-06-30",
            raw_audit_date="2026-05-10",
            evaluation_date=eval_date,
        )
        self.assertEqual(status, CertStatus.EXPIRED)
        self.assertIn("expired on 2028-06-30", msg)

    def test_cert_expiring_exactly_on_evaluation_date(self):
        # Boundary condition: evaluation date equals expiry date
        eval_date = date(2028, 6, 30)
        status, msg = evaluate_certification_validity(
            manufacturer_certs=self.manufacturer_certs,
            required_cert="ISO 9001",
            raw_expiry_date="2028-06-30",
            raw_audit_date="2026-05-10",
            evaluation_date=eval_date,
        )
        # Should be VALID through the end of expiry day
        self.assertEqual(status, CertStatus.VALID)

    def test_missing_expiry_date(self):
        eval_date = date(2027, 1, 15)
        status, msg = evaluate_certification_validity(
            manufacturer_certs=self.manufacturer_certs,
            required_cert="ISO 9001",
            raw_expiry_date=None,
            raw_audit_date="2026-05-10",
            evaluation_date=eval_date,
        )
        self.assertEqual(status, CertStatus.UNVERIFIED)
        self.assertIn("missing or malformed", msg)

    def test_invalid_expiry_date(self):
        eval_date = date(2027, 1, 15)
        status, msg = evaluate_certification_validity(
            manufacturer_certs=self.manufacturer_certs,
            required_cert="ISO 9001",
            raw_expiry_date="NOT_A_DATE",
            raw_audit_date="2026-05-10",
            evaluation_date=eval_date,
        )
        self.assertEqual(status, CertStatus.UNVERIFIED)
        self.assertIn("missing or malformed", msg)

    def test_manufacturer_not_holding_required_cert(self):
        eval_date = date(2027, 1, 15)
        status, msg = evaluate_certification_validity(
            manufacturer_certs=self.manufacturer_certs,  # has ISO 9001, AS9100
            required_cert="IATF 16949",
            raw_expiry_date="2028-06-30",
            raw_audit_date="2026-05-10",
            evaluation_date=eval_date,
        )
        self.assertEqual(status, CertStatus.NOT_HELD)


if __name__ == "__main__":
    unittest.main()
