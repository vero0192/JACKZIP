# JACKZIP Changelog

## v5.1.0 candidate hardening — 2026-10-30

- Honor explicit ZIP columns in CSV/TSV/pipe/semicolon tables, including quoted headers, commas, and escaped quotes; exclude other numeric fields.
- Keep source state evidence on its own record to avoid false conflicts from adjacent rows.
- Align copy commands with canonical unresolved-record handling in the Copy button and exports.
- Add three browser regressions and parser cases for column isolation, independent state context, and source lineage.
- Build a dedicated static Pages artifact and deploy only after CI verification succeeds.
- Add selectable browser engines and a separate live HTTPS/provider/offline smoke check.

## v5.1.0 — 2026-10-28

- Correct missing ACS/MOE handling and reject missing/mismatched release IDs.
- Isolate unknown Census geographies from otherwise valid lookup batches.
- Enforce string ZIP inputs and match postal responses to the requested ZIP.
- Bound request lifetimes; reject stale callbacks, results, exports, and file-read races.
- Reuse canonical data when commands change; remove the hidden Top 100 cap.
- Add current-page postal point map, workspace navigation, and Dossier links for unresolved records.
- Add 50-row pagination while retaining complete command-selected exports.
- Preserve missing values, MOE, statuses, lineage, and spreadsheet formula safety in exports.
- Remove embedded private VIP access values; ship an explicit cosmetic public preview.
- Integrate current JAX art, angular JZ STAR icons, local licensed fonts, mobile spacing and contrast repairs.
- Stop completed scans, clean interrupted effects, and honor reduced motion in CSS and scrolling.
- Scope service-worker caches and verify upgrade, offline shell, and unrelated-cache preservation.
- Add meaningful browser, accessibility, adapter, and export regression checks plus CI verification.
- Document real-device and deployed-origin gates without marking them passed.

## v5.0.0 — 2026-10-27

- Locked public identity to JACKZIP / JAX / JZ STAR / JZ GRID.
- Replaced legacy underscore branding in public surfaces.
- Added deterministic vector brand, character, high-resolution raster assets, PWA icons, and VIP star variant.
- Upgraded ingestion precedence for ranges, ZIP+4, foreign 5+3 postals, placeholders, long-number exclusions, URL/copyright review, conflict warnings, duplicates, OCR review, and explicit short-ZIP normalization.
- Added canonical Stack / Table / Chart rendering, review/unresolved queues, ZIP dossier, synchronized copy/export behavior, and immersive mobile Stack mode.
- Pinned ACS relay behavior to 2024 ACS 5-Year B19013 and rejects release drift.
- Integrated VIP presentation mode without changing parser/data/ranking/export behavior.
- Updated manifest/service worker for relative GitHub Pages deployment and truthful offline shell behavior.
- Expanded automated parser/static/export regression tests and documentation.
