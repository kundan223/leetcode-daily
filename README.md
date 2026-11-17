# Daily Practice

A personal coding interview tracker for **kundan_hero12** with two independent sheets: 242 DSA problems across 22 topics (excluding the 258 solved IDs checked on 13 November 2026), and all 50 questions across 7 official topics from [LeetCode SQL 50](https://leetcode.com/studyplan/top-sql-50/), retrieved on 17 November 2026.

## Features
- Completion checkboxes with automatic local browser storage
- Overall percentage, per-topic progress, daily goal and today's count
- Search by ID, title, topic or concept; difficulty and completion filters
- Revisit stars, next-problem shortcut, direct LeetCode links
- JSON backup export/import and progress updates between tabs
- Responsive layout, keyboard controls and reduced-motion support
- DSA / SQL navigation that switches sidebar topics, question lists, goals, counts and filters
- A separate Profile tab with a yearly activity calendar and day-by-day ledger
- Dedicated Contests and System Design + Backend tabs

Progress is saved on this browser/device, not on GitHub or LeetCode. Export a backup before clearing browser data, switching devices, or using another browser. Import replaces the selected backup's scope after confirmation. There is no automatic cross-device sync. Public platform statistics are displayed separately and never change your roadmap checkmarks. The original `daily-practice-kundan-v1` storage key, problem IDs and internal version-1 DSA format are unchanged. SQL uses `daily-practice-kundan-sql-v1`; the ledger uses `daily-practice-kundan-activity-v1`. Export now creates a version-2 backup containing both sheets and activity. Original version-1 backups restore DSA only, even when SQL is selected, leaving SQL progress and existing history intact. Invalid stored data is retained rather than overwritten automatically.

## Activity calendar and ledger
Profile starts with a calendar of tracker completions, followed by platform stats and the practice score. The ledger is the last section at the bottom. Select a year, filter by sheet, or select a calendar day to filter its ledger entries. Each distinct problem counts once per local calendar day per sheet. Reopened problems retain their historical activity; repeated completion on one day does not inflate the calendar. Review/unreview events appear in the ledger but do not count as completed problems.

## Contests and course
The Contests tab (`#contests`) contains upcoming LeetCode and Codeforces contests and a Reload contests button. The sheet views no longer contain contest cards. The course tab (`#courses`) embeds the user-selected [System Design Full Course by Coder Army](https://www.youtube.com/playlist?list=PLQEaRBV9gAFvzp6XhcNFpk1WdOcyVo9qT) and [Backend from first principles by Sriniously](https://www.youtube.com/watch?v=0Rwb4Xmlcwc&list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1). Both have direct YouTube fallback links. Players load on the course tab and detach when leaving it, stopping hidden playback. Watch history belongs to YouTube; viewing lessons does not automatically update tracker completion or activity. No new progress format or storage key is introduced by these tabs.

Saved completion dates are recovered once per problem/date without changing existing progress. Entries without a date are listed under Date unknown. Prior activity that was never recorded cannot be reconstructed. New completions, reopening and revisit changes include a timestamp; recovered entries do not invent one. This is browser-local tracker history, not full LeetCode/Codeforces submission history. The ledger shows 20 date groups initially and offers Show more days without discarding stored history.

## Profile, score and contests
LeetCode: **kundan_hero12**. Codeforces: **nonChalak** (user-confirmed). Public handles live in `profile-config.json`. No API secrets are needed. The Python updater reads LeetCode GraphQL and the official Codeforces API, publishing timestamped snapshots. LeetCode's undocumented schema may change. Each data source fails independently and retains its last successful snapshot; failed refreshes and snapshots older than 24 hours are labeled stale. Missing data is never displayed as zero. Contests are sorted by start time, exclude already-started events, and show the browser's time zone and official links.

The practice score continues to measure **DSA only**: `round(60 × completed/242 + 25 × topics-with-a-completion/22 + 15 × active-days/14)`. An active day has at least one still-completed DSA problem dated in the last 14 local calendar days, including today. Undoing completion removes its score contribution; the activity ledger retains the action history. SQL progress is displayed separately. The score measures self-reported practice, not interview readiness or hiring probability. **No job guarantee.** The UI explains the components and limitations.

`python scripts/refresh_platforms.py` refreshes snapshots. The GitHub Actions workflow refreshes and deploys on main pushes, manual runs, and every six hours (schedules may be delayed or disabled by GitHub). An Actions cache retains last-good snapshots between scheduled deployments. Reload stats fetches the latest published snapshot, not the platform directly.

## Run
Serve this folder with any static HTTP server, e.g. `python -m http.server 8080`. No build or installation is required. Set GitHub Pages source to **GitHub Actions** for `.github/workflows/pages.yml`. The existing Pages URL and origin must remain unchanged to preserve browser progress. Only static application assets are uploaded.

## Validation
Run `npm ci`, `npm test`, and `python -m unittest discover -s scripts -p 'test_*.py'`. Node 24.15+ or 22.22.2+ supports the locked jsdom test dependency; runtime application assets need no packages or build. Tests cover legacy backups, isolated SQL state, switching sidebar and filters, activity recovery, completion/reopen/revisit history, day deduplication, leap years, v1/v2 backup restore, corrupted-storage protection, score bounds, contest expiry and platform failures. DOM integration tests execute the actual scripts against the page markup. The original DSA data is in `data.js`; SQL data is in `sql-data.js`. Progress logic is isolated in `progress.js`; multi-sheet and activity logic lives in `workspace.js`. The styling uses Google Fonts with local system-font fallbacks.

## Learning scope
These sheets cover major coding-interview data structures, algorithms and SQL. They are not exhaustive and do not replace system design, core CS or behavioral preparation. The DSA snapshot excludes accepted solutions, not attempted questions. SQL 50 includes all plan questions regardless of previously solved status. Problem difficulty may change on LeetCode.
