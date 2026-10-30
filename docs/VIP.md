# VIP presentation

The public repository ships an optional cosmetic VIP mode. It changes the visual presentation only. It does not authenticate an identity or protect data.

Earlier V5 code embedded private client-recognition values. Those values and the public username/password form have been removed. No private credential hash or reversible encoding is substituted.

The public toggle never changes parsing, Census values, ranking, unresolved records, exports, or provider requests. It does not persist a password or raw input. Private authenticated client recognition would require a separate trusted service and is not part of this static release.
