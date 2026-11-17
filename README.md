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

Progress is saved on this browser/device, not on GitHub or LeetCode. Export a backup before clearing browser data, switching devices, or using another browser. Import replaces the selected backup's scope after confirmation. There is no automatic cross-device sync. Public platform statistics never change your checkmarks. The original `daily-practice-kundan-v1` storage key, problem IDs and internal version-1 DSA format are unchanged. SQL uses `daily-practice-kundan-sql-v1`; problem activity uses `daily-practice-kundan-activity-v1`; courses use `daily-practice-kundan-courses-v1`. Version-3 exports include both sheets, problem activity, lecture checklists and archived course history. Original v1 backups restore DSA only. V2 backups restore both sheets and problem activity while preserving course records. V3 restores everything after validation and confirmation. Invalid stored data is retained rather than overwritten automatically.

## Activity calendar and ledger
Profile starts with a calendar reflecting current checkmarks, followed by stats. The ledger is last at the bottom, with an independent keyboard-accessible scroll region. It shows one calendar day at a time, defaults to today, and has Previous day / Next day / Today buttons and a date picker. Navigation includes empty days and crosses month/year boundaries; future days are disabled. Undated saved items have a separate button.

Unchecking any completion removes its displayed ledger entry and calendar contribution from the original completion day. Unchecking a lecture also removes its credited duration. Rechecking records the item on the new completion day, without accumulating duplicate credit. Selected revisit stars appear in the ledger only while selected and do not count as calendar completions. Raw past events remain in backups for compatibility, but the displayed ledger and totals are derived from current saved state. Filters cover DSA, SQL, System Design and Backend.

## Contests and course
The Contests tab (`#contests`) contains upcoming LeetCode and Codeforces contests and a Reload contests button. The course tab (`#courses`) embeds the user-selected [System Design Full Course by Coder Army](https://www.youtube.com/playlist?list=PLQEaRBV9gAFvzp6XhcNFpk1WdOcyVo9qT) and [Backend from first principles by Sriniously](https://www.youtube.com/watch?v=0Rwb4Xmlcwc&list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1). Their 40 and 31 public lessons, titles and durations were checked against the playlist pages on 17 November 2026 and stored in `course-data.js`. Each lecture has a completion checkbox and Play button. Checking it credits its full catalog duration, rounded up to a whole minute per lecture (41:20 becomes 42 minutes; exactly 41:00 stays 41 minutes). Unchecking immediately removes its ledger entry and credited minutes. No playback timer, IFrame tracking API, Web Lock or manual time-entry form runs. Playing a video does not change progress. Leaving the course tab unloads its embeds.

Previously saved automatic/manual watch events are retained in backups but are excluded from the displayed ledger, calendar and credited totals. Existing lecture checkmarks and their completion dates are preserved. This is self-reported completion credit, not measured watch time or YouTube account history.

## Profile, score and contests
LeetCode: **kundan_hero12**. Codeforces: **nonChalak** (user-confirmed). Public handles live in `profile-config.json`. No API secrets are needed. The Python updater reads LeetCode GraphQL and the official Codeforces API, publishing timestamped snapshots. LeetCode's undocumented schema may change. Each data source fails independently and retains its last successful snapshot; failed refreshes and snapshots older than 24 hours are labeled stale. Missing data is never displayed as zero. Contests are sorted by start time, exclude already-started events, and show the browser's time zone and official links.

The practice score continues to measure **DSA only**: `round(60 × completed/242 + 25 × topics-with-a-completion/22 + 15 × active-days/14)`. An active day has at least one still-completed DSA problem dated in the last 14 local calendar days, including today. Undoing completion removes its score contribution; the displayed ledger removes the unchecked completion. SQL progress is displayed separately. The score measures self-reported practice, not interview readiness or hiring probability. **No job guarantee.** The UI explains the components and limitations.

`python scripts/refresh_platforms.py` refreshes snapshots. The GitHub Actions workflow refreshes and deploys on main pushes, manual runs, and every six hours (schedules may be delayed or disabled by GitHub). An Actions cache retains last-good snapshots between scheduled deployments. Reload stats fetches the latest published snapshot, not the platform directly.

## Run
Serve this folder with any static HTTP server, e.g. `python -m http.server 8080`. No build or installation is required. Set GitHub Pages source to **GitHub Actions** for `.github/workflows/pages.yml`. The existing Pages URL and origin must remain unchanged to preserve browser progress. Only static application assets are uploaded.

## Validation
Run `npm ci`, `npm test`, and `python -m unittest discover -s scripts -p 'test_*.py'`. Node 24.15+ or 22.22.2+ supports the locked jsdom test dependency; runtime application assets need no packages or build. Tests cover legacy backups, isolated SQL state, switching sidebar and filters, activity recovery, completion/reopen/revisit history, day deduplication, leap years, v1/v2 backup restore, corrupted-storage protection, score bounds, contest expiry and platform failures. DOM integration tests execute the actual scripts against the page markup. The original DSA data is in `data.js`; SQL data is in `sql-data.js`. Progress logic is isolated in `progress.js`; multi-sheet and activity logic lives in `workspace.js`. The styling uses Google Fonts with local system-font fallbacks.

## Learning scope
These sheets cover major coding-interview data structures, algorithms and SQL. They are not exhaustive and do not replace system design, core CS or behavioral preparation. The DSA snapshot excludes accepted solutions, not attempted questions. SQL 50 includes all plan questions regardless of previously solved status. Problem difficulty may change on LeetCode.
