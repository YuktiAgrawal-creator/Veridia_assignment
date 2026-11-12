"""
Veridia Match - Test Suite Runner
Runs all unit and integration tests with detailed console reporting.
"""
import sys
import unittest

def main():
    print("=" * 70)
    print("VERIDIA MATCH - EXHAUSTIVE AUTOMATED TEST SUITE")
    print("=" * 70)
    
    loader = unittest.TestLoader()
    suite = loader.discover("backend/tests", pattern="test_*.py")
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 70)
    print(f"Tests Run: {result.testsRun}")
    print(f"Failures:  {len(result.failures)}")
    print(f"Errors:    {len(result.errors)}")
    print("=" * 70)
    
    if not result.wasSuccessful():
        sys.exit(1)
    else:
        print("ALL AUTOMATED TESTS PASSED SUCCESSFULLY!")
        sys.exit(0)

if __name__ == "__main__":
    main()
