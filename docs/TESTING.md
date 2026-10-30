# Verification commands

`npm test` runs parser, command, ACS adapter, postal adapter, export, request-lifetime, coordinate, and static-package checks.

`npm run test:browser` uses Playwright Chromium at a repository subpath. It tests representative widths, the synthetic input-to-results flow, view synchronization, Dossier, copy/export contracts, pagination, interrupted effects, reduced motion, command reuse, cancellation, retry, cosmetic VIP, automated accessibility, and PWA offline/update behavior.

Browser dependencies are development-only. Install with `npm ci` and `npx playwright install chromium`. Results and inspection images are written under `test-results/` and are excluded from the repository ZIP.

Browser provider fixtures are synthetic. They are never loaded into the production app by default. Deliberately aborted requests in failure tests can produce expected browser network messages; uncaught application exceptions fail the suite.

`docs/VERIFICATION.md` records what actually ran. Never mark hardware or browser coverage passed merely because a Chromium test passed.

## Additional browser and live checks

`QA_BROWSER=firefox QA_OUTPUT=test-results/firefox npm run test:browser` runs the same deterministic suite in Playwright Firefox after `npx playwright install firefox`. `CHROMIUM_PATH` can select an installed Chromium binary. Browser reports name the engine and version; headless desktop verification is not physical-device certification.

`npm run test:live -- https://vero0192.github.io/JACKZIP/` makes real provider requests for `03076` and `10001` on the deployed HTTPS origin and checks downloads, map coordinates, leading zeros, duplicates, and the offline shell/parser. Results and a screenshot are written to `test-results/live/`. Provider availability can cause this check to fail; it does not use synthetic responses or run automatically on every commit.
