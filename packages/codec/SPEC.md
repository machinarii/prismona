# PRSM share-code specification (v1)

A Prismona share code is a consent-carried bearer token for a personality profile. The holder of a code can decode it; possession is the grant. It carries **no name, no identity, no individual answers** — six quantized trait scores and minimal metadata.

## Format

```
PRSM-<base64url of 12 bytes>      → 21 characters total
```

Base64url alphabet: `A–Z a–z 0–9 - _` (RFC 4648 §5, unpadded).

## Byte layout

| Byte | Field | Encoding |
|---|---|---|
| 0 | version | `1` |
| 1 | tier | `0` = quick (Mini-IPIP + H, 26 items), `1` = full (IPIP-NEO-120 + H, 126 items) |
| 2–3 | date | big-endian uint16, days since 2020-01-01 UTC |
| 4–9 | z-scores | one byte each, order **O, C, E, A, ES, H**: `round(z × 20)` clamped to ±63, offset by +128 (0.05 z resolution, ±3.15 range) |
| 10 | consistency | 0–100 person-fit index |
| 11 | checksum | sum of bytes 0–10, mod 256 |

`ES` is Emotional Stability — Neuroticism reversed. Decoders MUST reject codes whose version byte ≠ 1, length ≠ 12 bytes, or checksum mismatches.

## Semantics for consumers

- z-scores are vs **provisional adult norms** (see prismona.vercel.app/method); convert to percentiles with the standard normal CDF.
- Tier implies reliability: rebuild ±1 SEM bands with α = .88 (full) / .70 (quick) per domain, α = .76 for H.
- These are self-report estimates with modest effect sizes. Do not use codes for screening, hiring, or any verdict on a person; a code shared in one context is not consent for another.

## Reference implementation

`@prismona/codec` (this package) — dependency-free TypeScript, parity-tested against the production implementation at prismona.vercel.app.
