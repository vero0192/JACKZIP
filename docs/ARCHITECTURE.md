# Architecture

The local parser preserves source occurrences separately from unique ZIP candidates. Only geographic identifiers are requested from providers.

Modules:
- `parser.js`: source structure, candidates, exclusions, review, occurrences.
- `commands.js`: deterministic result selection and stable ordering.
- `request.js`: string-only ZIP contract, cancellation, timeouts, cleanup.
- `location.js`: supplemental GeoNames postal labels and representative coordinates.
- `census.js`: pinned 2024 ACS B19013 estimate/MOE adapter; mixed-batch missing geography isolation.
- `app.js`: canonical results, states, selectors, pages, review, dialogs, exports, and presentation.
- `geo-map.js`: current-page postal point plot with keyboard-accessible Dossier links.
- `motion.js`: bounded effects, result reveal, STACK observation.
- `export.js`: canonical CSV/TXT formatting and download.
- `sw.js`: scoped, versioned shell cache and safe legacy cache migration.

One canonical dataset drives all views. Commands reuse results while source is unchanged. Source edits invalidate old results and exports immediately. The visible command selection is paged for rendering; exports retain the full selection and canonical unresolved rows.

ZIP strings, leading zeros, ZIP+4 representations, duplicate occurrence IDs, source line numbers, missing data, context conflicts, and data vintage remain explicit. Postal validity, ZCTA match, ACS availability, context, and lookup status are separate fields.

Provider failures do not erase pasted input. Cancellation aborts pending work, and run IDs reject stale progress callbacks. No raw source is persisted or included in provider requests.
