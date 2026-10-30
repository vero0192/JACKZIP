# Known boundaries and unverified gates

- Real iPhone Safari, Android hardware, desktop Safari, Add to Home Screen, virtual-keyboard behavior, and installed standalone safe areas require device verification. Chromium emulation is not a real-device pass.
- Firefox could not launch in this executor (sandbox/graphics startup errors); its application regression gate remains open.
- GitHub Pages needs its one-time Source setting changed to GitHub Actions by the repository owner; the connection was denied administration access.
- Live provider responses were spot-checked. Provider coverage, rate limits, uptime, and accuracy across all ZIPs are not guaranteed.
- The ACS dataset is not bundled for offline enrichment. The cached app/parser works offline; remote lookups can fail and be retried.
- ZIP-to-ZCTA resolution uses an exact same-number match in the pinned Census release. A full versioned crosswalk is not bundled. Missing ZCTAs remain unresolved.
- MAP is a coordinate plot of supplemental postal representative points. It does not render ZIP/ZCTA polygons, routing, building heights, or a 3D city.
- Direct files are TXT/CSV only, up to 5 MB. OCR/PDF-extracted text can be pasted; PDF/XLSX/image/OCR file decoding is not implemented.
- Ambiguous tokens and conflicting context require review. UI review lists show their documented first 150/200 entries; raw input and complete canonical records remain in memory. Canonical unresolved records are included in exports.
- VIP is a public visual preview. Private recognition/authentication is not implemented in this package.
- ZIP values are quoted strings in CSV bytes. Spreadsheet software may still infer numbers on import; import the ZIP column as text to preserve leading zeros.
- Delimited-file parsing is record-per-line; quoted fields containing embedded newlines need preprocessing.
