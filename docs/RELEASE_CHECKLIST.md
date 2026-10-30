# Release gate

Completed evidence is recorded in VERIFICATION.md. Unticked items below are not claimed as passed.

## Executed locally

- [x] Node regression suites
- [x] JavaScript syntax checks
- [x] Chromium workflow and responsive checks
- [x] Automated accessibility across eight app surfaces
- [x] Cancellation, stale callbacks, retry, and source preservation
- [x] Missing ACS/MOE, unknown geography, and pinned-release rejection
- [x] Canonical view agreement and CSV/TXT contracts
- [x] Pagination with complete exports
- [x] Offline shell/parser at repository subpath
- [x] Upgrade from a legacy worker fixture, with cache cleanup and unrelated-cache preservation
- [x] Local asset references and public credential cleanup
- [x] Live postal and ACS endpoint spot checks
- [x] Explicit ZIP-column isolation and independent source-state regressions
- [x] Dedicated Pages artifact with complete local assets and no test/dependency files
- [x] Verification-gated GitHub Actions deployment workflow

## Still required for public production sign-off

- [ ] Real iPhone Safari: paste, keyboard, menus, STACK, CSV/TXT downloads
- [ ] iPhone Add to Home Screen: safe areas, offline shell, update/reopen
- [ ] Real Android Chrome and installed PWA
- [ ] Desktop Safari
- [ ] Headless desktop Firefox regression suite
- [ ] Actual GitHub Pages deployment URL and HTTPS
- [ ] Live-provider behavior on that deployed origin
- [ ] Screen-reader/device accessibility review beyond automated scanning

No known failing check may be relabeled as a pass. Automated Chromium emulation does not replace hardware tests.
