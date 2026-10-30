# JACKZIP 5.1.0

[Pages URL](https://vero0192.github.io/JACKZIP/) · [Verification and deployment](https://github.com/vero0192/JACKZIP/actions) · [Release evidence](docs/VERIFICATION.md)

DROP THE MESS. JAX HUNTS THE ZIPs.

JACKZIP accepts pasted text and TXT/CSV files, finds intended U.S. ZIP candidates using structure and context, preserves source occurrences and leading zeros, and requests supplemental postal labels and 2024 ACS 5-Year ZCTA median household income.

STACK is the mobile results experience. Table, Chart, a postal point map, and ZIP Dossier use the same canonical results. Fifty rows are displayed per page; pagination does not truncate exports.

## Run

No production build or runtime package installation is required. Serve this repository over HTTP:

```bash
python3 -m http.server 8080
```

Open http://localhost:8080/. Use HTTPS for deployment. ES modules and the PWA require an HTTP/HTTPS origin, not a file opened directly from a ZIP.

## Verify

Node 22 or newer:

```bash
npm ci
npm test
npx playwright install chromium
npm run test:browser
```

The browser suite serves the app at a repository subpath, uses clearly synthetic network fixtures, checks interactions and accessibility, and exercises an offline shell and cache migration. Test output is written to `test-results/`. Chromium installation on Linux may require `npx playwright install --with-deps chromium`.

For Firefox, install it with `npx playwright install firefox` and run `QA_BROWSER=firefox QA_OUTPUT=test-results/firefox npm run test:browser`. A separate real-provider smoke check runs against the deployed HTTPS site with `npm run test:live -- https://vero0192.github.io/JACKZIP/`; it is intentionally separate from deterministic CI.

See `docs/VERIFICATION.md` for the checks actually executed and the remaining real-device gates. This is a repository release candidate; the filename is not certification of every browser or device.

## Use

1. Paste a ZIP list, mixed location text, or a table; or choose a TXT/CSV file.
2. Choose a deterministic command such as `rank all`, `top 500`, `lowest`, `above 100k`, or `compare 03076 10001`.
3. Run analysis. Network lookup can be cancelled; successful parsing remains in the source.
4. Inspect ranked and unresolved records. Review conflicts before use.
5. Change commands without repeating lookups for unchanged source. Use Retry Failed for failed lookups; clear and re-enter source for a fresh full lookup.
6. Explore STACK, Table, Chart, Map, or Dossier. CSV/TXT include all command-selected ranked rows and canonical unresolved records. Copy uses the same rows. Parser-only review items remain in the separate review queue.

The default empty command selects the highest-income result, preserving the V5 behavior. Use Rank All to explore every ranked result.

## Data and privacy

- ZIP values stay strings. Source text is not stored by default.
- Only necessary ZIP/ZCTA identifiers are sent to providers.
- Postal labels/coordinates: GeoNames via Zippopotam.us. These are supplemental, not authoritative USPS validation.
- Income/MOE: U.S. Census Bureau 2024 ACS 5-Year B19013 via Census Reporter, pinned to `acs2024_5yr`. Missing values remain missing.
- ZCTAs are Census statistical areas, not postal ZIP boundaries. This build requests the same-number ZCTA and reports no match; it does not silently substitute a neighboring geography.
- Income is an area-level statistic, never an individual's income.
- The point map shows provider coordinates for the displayed results. It does not show ZIP polygons, precise delivery locations, or the user's location.
- The PWA caches the shell, fonts, art, and parser. Live enrichment requires a network connection.
- VIP is a public cosmetic presentation toggle. Private client-recognition credentials and authentication are not shipped.

## GitHub Pages

Set Settings → Pages → Source to **GitHub Actions**. The included workflow verifies Node, browser, accessibility, and offline behavior, builds a dedicated site artifact with `npm run build:pages`, and deploys successful `main` builds. Pull requests are verified without deploying. Asset URLs, manifest scope, and service-worker registration are relative and support repository subpaths.

See `DEPLOY_GITHUB.md` and `docs/RELEASE_CHECKLIST.md`.

## Assets

Space Grotesk and IBM Plex Mono are bundled with their licenses in `assets/fonts/`. Current JAX art is `assets/jax/jax-current.png`; JZ STAR has matching vector and raster app icons. Generated art is presentation only; actual results are rendered as HTML text from application state.
