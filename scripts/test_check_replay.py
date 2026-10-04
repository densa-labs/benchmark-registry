import unittest

from check_replay import compare


class CompareTests(unittest.TestCase):
    def test_matching_replay_has_no_problems(self):
        self.assertEqual(compare({"results": 2}, {"results": 2}, {"a", "b"}, {"a", "b"}), [])

    def test_count_and_result_key_differences_are_reported(self):
        problems = compare({"results": 2}, {"results": 3}, {"a", "x"}, {"a", "b"})
        self.assertEqual(problems[0], "results: replay 2, expected 3")
        self.assertIn("only in replay: 1", problems[1])
        self.assertIn("only in production: 1", problems[2])


if __name__ == "__main__":
    unittest.main()
