# ACS Data Contract

## Locked production vintage

- Dataset: **2024 ACS 5-Year**
- Detailed table: **B19013**
- Metric: Median Household Income in the Past 12 Months (2024 inflation-adjusted dollars)
- Estimate: `B19013_001E`
- Margin of error: `B19013_001M`
- Statistical geography: Census ZCTA

## Runtime source mode in v5

`census.js` requests only required ZIP/ZCTA identifiers through Census Reporter and pins the release to `acs2024_5yr`. If a returned release disagrees, the adapter fails rather than silently mixing vintages.

Census Reporter is the transport/relay. U.S. Census Bureau ACS is the statistical source.

## Truthfulness

A USPS ZIP and a Census ZCTA are related but distinct. A ZIP without a matching ZCTA stays visible. Missing/special values are unavailable, never `$0`. Area-level median household income must never be described as an individual's income.

## Offline boundary

This package does not bundle the full official 2024 B19013 ZCTA data pack. Therefore ACS enrichment is network-dependent. The preferred future static architecture is a versioned, reproducible local Census pack generated from official files.
