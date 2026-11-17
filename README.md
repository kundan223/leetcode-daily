# Daily Practice

A personal coding interview tracker for **kundan_hero12**. 242 unique LeetCode problems across 22 topics, excluding the 258 solved IDs checked on 13 November 2026.

## Features
- Completion checkboxes with automatic local browser storage
- Overall percentage, per-topic progress, daily goal and today's count
- Search by ID, title, topic or concept; difficulty and completion filters
- Revisit stars, next-problem shortcut, direct LeetCode links
- JSON backup export/import and progress updates between tabs
- Responsive layout, keyboard controls and reduced-motion support

Progress is saved on this browser/device, not on GitHub or LeetCode. Export a backup before clearing browser data, switching devices, or using another browser. Import replaces the current local progress after confirmation. There is no automatic cross-device sync. Public platform statistics are displayed separately and never change your roadmap checkmarks. The original `daily-practice-kundan-v1` storage key, problem IDs and version-1 backup format are unchanged.

## Profile, score and contests
LeetCode: **kundan_hero12**. Codeforces: **nonChalak** (user-confirmed). Public handles live in `profile-config.json`. No API secrets are needed. The Python updater reads LeetCode GraphQL and the official Codeforces API, publishing timestamped snapshots. LeetCode's undocumented schema may change. Each data source fails independently and retains its last successful snapshot; failed refreshes and snapshots older than 24 hours are labeled stale. Missing data is never displayed as zero. Contests are sorted by start time, exclude already-started events, and show the browser's time zone and official links.

The practice score is `round(60 × completed/242 + 25 × topics-with-a-completion/22 + 15 × active-days/14)`. An active day has at least one still-completed roadmap problem dated in the last 14 local calendar days, including today. Undoing completion removes its contribution. It measures self-reported practice, not interview readiness or hiring probability. **No job guarantee.** The UI explains the components and limitations.

`python scripts/refresh_platforms.py` refreshes snapshots. The GitHub Actions workflow refreshes and deploys on main pushes, manual runs, and every six hours (schedules may be delayed or disabled by GitHub). An Actions cache retains last-good snapshots between scheduled deployments. Reload stats fetches the latest published snapshot, not the platform directly.

## Run
Serve this folder with any static HTTP server, e.g. `python -m http.server 8080`. No build or installation is required. Set GitHub Pages source to **GitHub Actions** for `.github/workflows/pages.yml`. The existing Pages URL and origin must remain unchanged to preserve browser progress. Only static application assets are uploaded.

## Validation
Run `node test.cjs`, `node test-insights.cjs`, `node test-profile.cjs`, and `python -m unittest discover -s scripts -p 'test_*.py'`. Tests cover legacy backups, completion/revisit behavior, score bounds and date boundaries, contest expiry, profile failure states, escaping, unrated users and last-good snapshot retention. The original source data is in `data.js`. Progress logic is isolated in `progress.js`. The styling uses Google Fonts with local system-font fallbacks.

## Learning scope
This sheet covers major coding-interview data structures and algorithms. It is not exhaustive and does not replace system design, SQL, core CS or behavioral preparation. The snapshot excludes accepted solutions, not attempted questions. Problem difficulty may change on LeetCode.
