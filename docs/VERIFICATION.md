# JACKZIP 5.1.0 verification — 2026-10-30

Status: tested repository release candidate. Automated verification is complete for Chromium. Hardware and manual assistive-technology checks remain open. GitHub CI verification and Pages deployment passed. The deployed HTTPS app passed all 11 live-browser checks.

## Executed and passed in this continuation

- Reproducible `npm ci` with the supplied dependency lockfile; Node 24.19.0 (CI targets Node 22).
- Eight Node suites: parser, commands, ACS adapter, postal adapter, exports, request lifetime, map coordinates, static package.
- 55 Chromium browser checks (Chromium 154.0.8037.57), using synthetic provider fixtures.
- Document widths: 320, 360, 375, 390, 393, 414, 430, 768, and 1440 pixels; small-mobile result and STACK checks.
- Input → analysis → ranked results; leading zeros, duplicate counts, missing income, visible context conflicts, source preservation, cancellation, Retry Failed, and stale-export prevention.
- Commands reuse canonical data; Table, Chart, Map, Dossier, and STACK agree with canonical results. Pagination renders 50 rows while CSV includes all 125 fixture results.
- Three added browser checks: quoted CSV column isolation, independent CSV state context, and copy-command inclusion of canonical unresolved records.
- Added parser regressions for quoted headers, embedded commas/escaped quotes, CSV/TSV/pipe/semicolon tables, missing ZIP cells, numeric non-ZIP fields, leading-zero normalization, source-line lineage, and adjacent record states.
- axe-core WCAG A/AA checks across Map, Table, Chart, result list, Settings, VIP, immersive STACK, and Dossier: zero violations in tested states.
- Service-worker upgrade, obsolete-cache cleanup, unrelated-cache retention, repository-subpath offline shell, and offline local parser.
- All displayed images load; zero uncaught application errors. Desktop home and mobile result screenshots were inspected.
- Pages artifact contains all HTML/service-worker resources and excludes dependencies, tests, documentation, and Git metadata.
- Parser stress spot check: 5,000 unique ZIPs and 5,000 occurrences preserved in approximately 729 ms on this executor. This is not a public speed claim.

The deliberate request aborts in failure fixtures produce expected browser network messages.

## Bugs fixed

Explicit ZIP headers now restrict extraction to the ZIP column, so five-digit order numbers are not looked up as geography. Quoted CSV cells are decoded, source lineage is preserved, and each record supplies its own state evidence instead of inheriting a neighboring state. Copy commands now use the same selected/unresolved rows as Copy and exports.

## Live endpoint spot checks

Actual HTTPS requests on 2026-10-30 returned:

- Census Reporter `acs2024_5yr` / B19013 / ZCTA `03076`: matching 2024 release, estimate, and MOE.
- Zippopotam.us `/us/03076`: ZIP `03076`, Pelham, NH, and coordinates.

These are endpoint spot checks, not a deployed-browser CORS pass or nationwide coverage certification. The separate `npm run test:live` check tests the deployed HTTPS origin.

## Deployment

The full application was pushed to `vero0192/JACKZIP` in commit `4a591a87cbb2758e43d2f4e980955d572d5b2d7f`. [GitHub Actions run 41005946312](https://github.com/vero0192/JACKZIP/actions/runs/41005946312) passed its verification job on Node 22: clean dependency install, eight Node suites, all 55 Chromium/browser checks, site build, and both artifact uploads.

The initial deployment attempt failed because Pages was not enabled. After the owner selected GitHub Actions as the Pages source, [attempt 2](https://github.com/vero0192/JACKZIP/actions/runs/41005946312/attempts/2) completed successfully, including verification and deployment. The site is live at **https://vero0192.github.io/JACKZIP/** with HTTPS enforced and application revision `8c23859da380`.

The deployed-origin Chromium smoke check passed all 11 checks with real network responses: HTTP 200, mobile document width, postal/ACS enrichment for `03076` and `10001`, leading zeros and duplicate lineage, no geography conflicts, CSV and TXT downloads, two map coordinates, offline shell, offline parser, and zero uncaught browser errors. Both postal requests and the pinned Census request returned HTTP 200. There were zero failed requests.

Deployed HTML, app/parser/worker modules, and build metadata match the verified repository byte for byte. Repository documentation is excluded from the deployed site artifact (the documentation path returned HTTP 404). The live mobile screenshot was inspected. This remains desktop Chromium verification with a mobile viewport, not a physical-device pass.

Machine-readable evidence is in `docs/ci-report.json` and `docs/live-report.json`.

## Not executed / not claimed

- Physical iPhone/iPad/Android hardware
- iOS Safari keyboard, clipboard, or downloads
- Add to Home Screen and installed standalone safe areas on hardware
- Desktop Safari
- Firefox: downloaded successfully, but launch attempts timed out in this executor with sandbox/graphics errors before the app loaded; this is not a Firefox application pass
- Comprehensive manual screen-reader testing
- Full national ZIP/ZCTA coverage certification
- Secure VIP authentication

Machine-readable Chromium and accessibility evidence is committed in `docs/browser-report.json` and `docs/accessibility-report.json`. Remaining sign-off gates are in `RELEASE_CHECKLIST.md`.
