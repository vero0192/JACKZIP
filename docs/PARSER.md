# Universal Ingestion Parser

JAX is aggressive at understanding and conservative at confirming.

## Ordering

1. Capture immutable source text.
2. Detect rough structure (plain lists, delimited rows, address-like text, stacked blocks, ranges, mixed text).
3. Detect whole-token special cases before generic ZIP5:
   - 5+5 ranges
   - foreign 5+3 postal tokens
   - ZIP+4
   - OCR O/0 review candidates
   - long numeric identifiers / numeric noise
4. Generate bounded ZIP candidates.
5. Evaluate positive and negative context.
6. Preserve review/invalid/non-U.S./range queues.
7. Aggregate occurrences into unique ZIP results without deleting lineage.

## Delimited records

An explicit ZIP/postal-code header limits candidate extraction to that column. CSV, TSV, pipe, and semicolon rows support quoted cells, quoted delimiters, and escaped quotes. Other numeric columns are excluded. Source line numbers, raw rows, and original ZIP representations remain intact. State evidence in a record takes priority over nearby text; delimited records never inherit state from their neighbors.

## Conservative normalization

Three/four-digit leading-zero normalization is allowed only when explicit ZIP labeling and state context support it. Original text and the reason are preserved. OCR substitutions such as `O3076` are review-only and never auto-fixed.

## Known architectural boundary

This v5 parser is substantially safer than the V4 baseline, but it is still a browser-side heuristic parser, not a complete postal database. Geographic truth is established downstream where supported; source context is not silently rewritten.
