import unittest
from unittest.mock import patch
import refresh_platforms as refresh

class RefreshTests(unittest.TestCase):
    def test_failure_preserves_last_good_data(self):
        snapshot = {'leetcode': {'data': {'solved': 42}, 'updatedAt': 'old'}}
        def fail():
            raise ValueError('Unavailable')
        refresh.refresh(snapshot, 'leetcode', fail, 'new')
        self.assertEqual(snapshot['leetcode']['data']['solved'], 42)
        self.assertEqual(snapshot['leetcode']['updatedAt'], 'old')
        self.assertTrue(snapshot['leetcode']['error'])

    def test_success_replaces_error(self):
        snapshot = {'leetcode': {'error': 'failed'}}
        refresh.refresh(snapshot, 'leetcode', lambda: {'solved': 0}, 'new')
        self.assertIsNone(snapshot['leetcode']['error'])
        self.assertEqual(snapshot['leetcode']['data']['solved'], 0)

    @patch.object(refresh, 'graphql')
    def test_unrated_user(self, query):
        query.return_value = {'matchedUser': {'profile': {'ranking': 10}, 'submitStatsGlobal': {'acSubmissionNum': [{'difficulty': d, 'count': 0} for d in ['All', 'Easy', 'Medium', 'Hard']]}}, 'userContestRanking': None}
        self.assertIsNone(refresh.leetcode_profile('example')['rating'])

    @patch.object(refresh, 'cf')
    def test_contests(self, api):
        api.return_value = [{'id': 1, 'name': 'Future', 'phase': 'BEFORE', 'startTimeSeconds': 9999999999, 'durationSeconds': 7200}, {'phase': 'FINISHED'}, {'phase': 'BEFORE', 'startTimeSeconds': 1}]
        self.assertEqual(len(refresh.codeforces_contests()), 1)
