# Daily Practice

A personal coding interview tracker for **kundan_hero12**. 242 unique LeetCode problems across 22 topics, excluding the 258 solved IDs checked on 13 November 2026.

## Features
- Completion checkboxes with automatic local browser storage
- Overall percentage, per-topic progress, daily goal and today's count
- Search by ID, title, topic or concept; difficulty and completion filters
- Revisit stars, next-problem shortcut, direct LeetCode links
- JSON backup export/import and progress updates between tabs
- Responsive layout, keyboard controls and reduced-motion support

Progress is saved on this browser/device, not on GitHub or LeetCode. Export a backup before clearing browser data, switching devices, or using another browser. Import replaces the current local progress after confirmation. There is no automatic cross-device sync and no LeetCode integration.

## Run
Serve this folder with any static HTTP server, e.g. `python -m http.server 8080`. No build or installation is required. Set GitHub Pages to deploy from `main`, `/ (root)`.

## Validation
Run `node test.cjs`. The original source data is in `data.js`. Progress logic is isolated in `progress.js`. The styling uses Google Fonts with local system-font fallbacks.

## Learning scope
This sheet covers major coding-interview data structures and algorithms. It is not exhaustive and does not replace system design, SQL, core CS or behavioral preparation. The snapshot excludes accepted solutions, not attempted questions. Problem difficulty may change on LeetCode.
