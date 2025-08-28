# Payment History UI (Static App)

A modern, responsive payment history UI with filtering, sorting, pagination, CSV export, and dark mode. Built with vanilla HTML/CSS/JS.

## Quick start

Serve the folder and open in a browser:

```bash
cd /workspace
python3 -m http.server 8000
# Open http://localhost:8000
```

## Features

- Filters: search, date range, status, method, page size
- Sort: click table headers, keyboard accessible
- Pagination: prev/next with live page indicator
- CSV export: exports the visible dataset (after filters)
- Summary stats: totals by status with live updates
- Dark mode: toggle with persistence (localStorage)

## Notes

- Sample data (250 rows) is generated locally for demo purposes in `app.js`.
- Currency formatting uses the browser locale and USD by default.

## ejobindia demo dashboard UI

This is a lightweight, responsive web UI demo for a modernized ejobindia dashboard.

### Run locally
- Open `index.html` directly in your browser, or
- Serve the folder with a static server:

```bash
python3 -m http.server 8080
# Then visit http://localhost:8080
```

### Features
- Redesigned hero header with brand, search, and user chip
- Responsive quick grid of cards with icons
- Light/dark theme toggle (persists)
- Accessible menu dialog and keyboard shortcuts

### Files
- `index.html`: markup
- `styles.css`: styles and theming (dark by default)
- `app.js`: theme, menu, and small UX enhancements