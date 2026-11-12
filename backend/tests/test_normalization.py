"""
Unit tests for data normalization and synonym mapping
"""
import unittest
from backend.app.data.cleaner import (
    normalize_material,
    normalize_process,
    normalize_certification,
    normalize_string,
)


class TestNormalization(unittest.TestCase):
    def test_material_synonyms(self):
        # Aluminium variants
        mat, err = normalize_material("ALUMINUM")
        self.assertIsNone(err)
        self.assertEqual(mat, "aluminium")

        mat, err = normalize_material("  Aluminium  ")
        self.assertIsNone(err)
        self.assertEqual(mat, "aluminium")

        # Stainless Steel variants
        mat, err = normalize_material("SS")
        self.assertIsNone(err)
        self.assertEqual(mat, "stainless steel")

        mat, err = normalize_material("stainless")
        self.assertIsNone(err)
        self.assertEqual(mat, "stainless steel")

        # Carbon / Mild steel
        mat, err = normalize_material("carbon steel")
        self.assertIsNone(err)
        self.assertEqual(mat, "mild steel")

        # Nylon / PA
        mat, err = normalize_material("polyamide")
        self.assertIsNone(err)
        self.assertEqual(mat, "nylon")

        # Invalid material
        mat, err = normalize_material("unobtainium")
        self.assertIsNotNone(err)
        self.assertIsNone(mat)

    def test_process_synonyms(self):
        # CNC Machining mapping to CNC milling and CNC turning
        procs, err = normalize_process("CNC Machining")
        self.assertIsNone(err)
        self.assertIn("CNC milling", procs)
        self.assertIn("CNC turning", procs)

        # CNC-Machining hyphenated
        procs, err = normalize_process("cnc-machining")
        self.assertIsNone(err)
        self.assertIn("CNC milling", procs)

        # Lathe / turning
        procs, err = normalize_process("lathe")
        self.assertIsNone(err)
        self.assertEqual(procs, ["CNC turning"])

        # Sheet metal
        procs, err = normalize_process("Sheet Metal Fabrication")
        self.assertIsNone(err)
        self.assertEqual(procs, ["sheet metal"])

        # Injection molding (US spelling)
        procs, err = normalize_process("injection molding")
        self.assertIsNone(err)
        self.assertEqual(procs, ["injection moulding"])

        # Invalid process
        procs, err = normalize_process("teleportation")
        self.assertIsNotNone(err)
        self.assertEqual(len(procs), 0)

    def test_certification_synonyms(self):
        cert, err = normalize_certification("ISO9001")
        self.assertIsNone(err)
        self.assertEqual(cert, "ISO 9001")

        cert, err = normalize_certification("iso-9001")
        self.assertIsNone(err)
        self.assertEqual(cert, "ISO 9001")

        cert, err = normalize_certification("IATF16949")
        self.assertIsNone(err)
        self.assertEqual(cert, "IATF 16949")

        cert, err = normalize_certification("AS9100D")
        self.assertIsNone(err)
        self.assertEqual(cert, "AS9100")

        # None / Optional handling
        cert, err = normalize_certification(None)
        self.assertIsNone(err)
        self.assertIsNone(cert)

        cert, err = normalize_certification("none")
        self.assertIsNone(err)
        self.assertIsNone(cert)


if __name__ == "__main__":
    unittest.main()
