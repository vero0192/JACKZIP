# JACKZIP 5.1.0 verification — 2026-10-30

Status: tested repository release candidate. Automated verification is complete for Chromium. Hardware and manual assistive-technology checks remain open. Hosting evidence will be added after deployment.

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

The repository includes verification-gated GitHub Actions deployment and a dedicated static artifact builder. A successful upload is not proof of a successful Pages deployment. Deployment and live-origin evidence are pending at this checkpoint.

## Not executed / not claimed

- Physical iPhone/iPad/Android hardware
- iOS Safari keyboard, clipboard, or downloads
- Add to Home Screen and installed standalone safe areas on hardware
- Desktop Safari
- Comprehensive manual screen-reader testing
- Full national ZIP/ZCTA coverage certification
- Secure VIP authentication

Machine-readable Chromium and accessibility evidence is committed in `docs/browser-report.json` and `docs/accessibility-report.json`. Remaining sign-off gates are in `RELEASE_CHECKLIST.md`.
