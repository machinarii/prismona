# @prismona/codec

Encode and decode PRSM share codes — consent-carried personality profiles (Big Five reported with Emotional Stability, plus HEXACO Honesty-Humility) from [Prismona](https://prismona.vercel.app). Dependency-free; decodes entirely offline.

```ts
import { decodeShareCode, zToPercentile } from "@prismona/codec";

const p = decodeShareCode("PRSM-…");
if (p) console.log(`Openness: ${zToPercentile(p.z.O)}th percentile (${p.tier}, ${p.date})`);
```

See `SPEC.md` for the byte layout and the consumer obligations (no screening, no verdicts, context-bound consent).
