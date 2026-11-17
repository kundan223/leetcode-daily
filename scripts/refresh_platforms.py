"""Public platform snapshots; failed requests preserve the last successful data."""
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]

def request(url, body=None):
    headers = {'User-Agent': 'DailyPractice/1.0', 'Content-Type': 'application/json'}
    req = Request(url, data=json.dumps(body).encode() if body else None, headers=headers)
    with urlopen(req, timeout=30) as response:
        value = json.load(response)
    if value.get('errors'):
        raise ValueError('Platform returned GraphQL errors')
    return value

def graphql(query):
    return request('https://leetcode.com/graphql/', {'query': query})['data']

def cf(method, **params):
    result = request('https://codeforces.com/api/' + method + '?' + urlencode(params))
    if result.get('status') != 'OK':
        raise ValueError('Codeforces request failed')
    return result['result']

def leetcode_profile(handle):
    data = graphql('query { matchedUser(username: %s) { profile { ranking } submitStatsGlobal { acSubmissionNum { difficulty count } } } userContestRanking(username: %s) { rating attendedContestsCount } }' % (json.dumps(handle), json.dumps(handle)))
    user = data['matchedUser']
    counts = {item['difficulty']: item['count'] for item in user['submitStatsGlobal']['acSubmissionNum']}
    ranking = data.get('userContestRanking') or {}
    return dict(solved=counts['All'], easy=counts['Easy'], medium=counts['Medium'], hard=counts['Hard'], ranking=user['profile']['ranking'], rating=ranking.get('rating'), contests=ranking.get('attendedContestsCount', 0))

def leetcode_contests():
    contests = graphql('query { topTwoContests { title titleSlug startTime duration } }')['topTwoContests']
    return [dict(title=c['title'], slug=c['titleSlug'], startTime=c['startTime'], duration=c['duration']) for c in contests if c['startTime'] > time.time()]

def codeforces_profile(handle):
    user = cf('user.info', handles=handle)[0]
    time.sleep(2.1)
    ratings = cf('user.rating', handle=handle)
    return dict(rating=user.get('rating'), maxRating=user.get('maxRating'), rank=user.get('rank'), contests=len(ratings))

def codeforces_contests():
    return [dict(id=c['id'], title=c['name'], startTime=c['startTimeSeconds'], duration=c['durationSeconds']) for c in cf('contest.list', gym='false') if c['phase'] == 'BEFORE' and c.get('startTimeSeconds', 0) > time.time()]

def refresh(snapshot, key, loader, stamp):
    try:
        snapshot[key] = dict(data=loader(), updatedAt=stamp, error=None)
    except Exception as exc:
        snapshot.setdefault(key, dict(data=None, updatedAt=None))['error'] = 'Platform refresh failed'
        print(f'{key}: refresh failed ({type(exc).__name__}); retained previous snapshot')

def main():
    handles = json.loads((ROOT / 'profile-config.json').read_text())
    path = ROOT / 'platform-data.json'
    snapshot = json.loads(path.read_text()) if path.exists() else {}
    previous = snapshot.get('handles', {})
    for platform in ['leetcode', 'codeforces']:
        if previous.get(platform) != handles.get(platform):
            snapshot.pop(platform, None)
    snapshot['handles'] = handles
    stamp = datetime.now(timezone.utc).isoformat()
    refresh(snapshot, 'leetcode', lambda: leetcode_profile(handles['leetcode']), stamp)
    refresh(snapshot, 'leetcodeContests', leetcode_contests, stamp)
    if handles.get('codeforces'):
        refresh(snapshot, 'codeforces', lambda: codeforces_profile(handles['codeforces']), stamp)
        time.sleep(2.1)
    else:
        snapshot['codeforces'] = dict(data=None, updatedAt=None, error=None)
    refresh(snapshot, 'codeforcesContests', codeforces_contests, stamp)
    path.write_text(json.dumps(snapshot, indent=2) + '\n', encoding='utf-8')

if __name__ == '__main__':
    main()
