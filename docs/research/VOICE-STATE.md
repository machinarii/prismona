# Prismona — Voice State (speech emotion) research note

_Last updated: 2026-09-03_

Can a dictation tool like VoiceInk hand its recorded audio to an agent so the agent adapts its wording or TTS delivery to the user's emotional state? This note records the survey of research-backed speech-emotion-recognition (SER) repos, their licensing, the validity and regulatory constraints, a spike run over the author's own VoiceInk recordings, and the resulting **design position**: don't build on a categorical emotion label; if a state signal is ever added, it is within-person relative **arousal** from plain acoustics, on-device, never persisted, feeding the existing comportment/persona modulation as a transient input.

---

## 1. Framing: state, not trait; delivery, not content

Prismona models **stable traits** (Big Five + H, values, delegation and communication style) and modulates an agent's comportment from them (`lib/persona.ts`). A voice signal would be the **transient state** input to the same knobs — *trait × state → delivery*. The use case is the agent nudging its own output (sentence length, hedging, pace, TTS rate/pitch), not a claim about the person.

That framing matters for two reasons this note establishes: the science supports a continuous, low-dimensional signal far better than a categorical label, and the regulatory line (§5) is drawn around *inferring emotions about people*, which a soft, on-device, user-facing adaptation should stay well clear of.

## 2. Repos surveyed

| Repo | Backing | Output | License | Verdict |
|---|---|---|---|---|
| [FunAudioLLM/SenseVoice](https://github.com/FunAudioLLM/SenseVoice) (9.2k★) | FunAudioLLM paper (Alibaba, 2024), 400k h training | ASR **+** 7 emotion labels + audio events in one pass | MIT code; model license permits commercial use | **Best fit for a VoiceInk-style integration.** Whisper-class ASR that emits an emotion token beside the transcript; ONNX export; [sherpa-onnx](https://k2-fsa.github.io/sherpa/onnx/sense-voice/pretrained.html) exposes the emotion result in its Swift API. |
| [ddlBoJack/emotion2vec](https://github.com/ddlBoJack/emotion2vec) (1.2k★) | ACL 2024 Findings — self-supervised SER foundation model | 9 classes; `+large` trained on 42.5k h pseudo-labeled | MIT code; **model weights under a custom license — read before shipping** | Strongest dedicated SER model. Python/FunASR; heavy to embed in a Mac app. |
| [audeering/w2v2-how-to](https://github.com/audeering/w2v2-how-to) (559★) | Wagner et al., *IEEE TPAMI* 2023 — the field's reference paper | **Continuous arousal / dominance / valence** 0–1 | **CC BY-NC-SA 4.0 — non-commercial.** Commercial via audEERING devAIce | Best science; trained on naturalistic podcast speech (MSP-Podcast). Can't ship it. Use as an evaluation yardstick only. |
| [audeering/opensmile](https://github.com/audeering/opensmile) (847★) | eGeMAPS (Eyben et al. 2016) standardized acoustic feature set | Interpretable features: pitch, loudness, jitter, rate | **Non-commercial** open-source build | Same wall. Reference for *which* features matter. |
| [speechbrain/emotion-recognition-wav2vec2-IEMOCAP](https://huggingface.co/speechbrain/emotion-recognition-wav2vec2-IEMOCAP) | SpeechBrain | 4 classes | Apache-2.0 | Permissive but trained on IEMOCAP alone (10 actors, elicited). Falls apart on real dictation. |
| [abikaki/awesome-speech-emotion-recognition](https://github.com/abikaki/awesome-speech-emotion-recognition) | curated list | — | — | Index of everything else. |

**Licensing summary.** The two best-validated *dimensional* tools (audEERING's model, openSMILE) are non-commercial. The commercially usable options (SenseVoice, SpeechBrain) are *categorical*. That gap is one reason the design position below avoids depending on any SER model.

## 3. The valence gap — the finding that shapes the design

Wagner et al. 2023 is titled *"Dawn of the transformer era in speech emotion recognition: closing the valence gap."* For two decades acoustics predicted **arousal** (calm ↔ activated) well and **valence** (negative ↔ positive) poorly. Transformers closed that gap — and the authors attribute it to *implicit linguistic information* learned during fine-tuning, not to new acoustic evidence.

A dictation tool already has the linguistic information: the transcript. So the principled split is

- **arousal from audio** — energy, pitch range, speech rate; what voice genuinely carries;
- **valence from text** — the transcript, which the agent already reads.

This degrades gracefully. Misjudge arousal and the agent is slightly too brisk or too gentle. Misjudge "angry" vs "sad" and it responds to the wrong emotion entirely.

## 4. Validity

The SER literature's own cross-corpus results: models [trained on one dataset routinely fail on another](https://arxiv.org/abs/2207.02104); most benchmarks use [acted speech that "rarely generalises to natural speech"](https://arxiv.org/pdf/2512.23435) — the *theatricality gap*. Barrett et al. 2019 (*Psychological Science in the Public Interest*, [link](https://journals.sagepub.com/doi/full/10.1177/1529100619832930)) made the broader argument that emotion cannot be reliably read off expressive behaviour given cultural and individual variability. The spike in §6 reproduces the gap on the author's own data.

## 5. EU AI Act, Article 5(1)(f)

In force since 2 February 2025: AI systems that **infer emotions of a natural person in workplace or education contexts** are prohibited, with medical/safety exceptions only, and fines up to 7% of global turnover ([FPF analysis](https://fpf.org/blog/red-lines-under-eu-ai-act-unpacking-the-prohibition-of-emotion-recognition-in-the-workplace-and-education-institutions/)). "Workplace" is read broadly. A personal dictation tool adapting its own tone on the user's own machine is arguably outside the spirit, but many people dictate at work and the ban does not turn on whether the inference is used against them.

Consequences for Prismona: any such feature is **opt-in**, the inference **never leaves the device**, no label is ever stored or shown as a fact about the user, and it stays out of `/team`, delegation, and every other surface that describes someone to a third party. This is a stricter application of the PRD's existing no-screening / no-verdict rule.

## 6. Spike: the author's own VoiceInk dictation (2026-09-02)

**Setup.** VoiceInk (GPL-3, `Beingpax/VoiceInk`, whisper.cpp/Parakeet, fully local) keeps every recording in `~/Library/Application Support/com.prakashjoshipax.VoiceInk/Recordings/` and a SwiftData history store linking each to its transcript, timestamp, duration and target app (Power Mode). A throwaway harness at `~/voice-state-spike/` (outside this repo) runs every clip through SenseVoiceSmall via sherpa-onnx (emotion token), Praat/parselmouth (intensity, F0 spread, speech rate → corpus-relative `arousal_z`), and VADER on the transcript (valence). Read-only; nothing leaves the machine.

**Corpus.** 124 files; 74 were aborted recordings (41 under 1.5 s, 33 four-kilobyte WAV header stubs). **50 real utterances, 4.8 min of speech, 8 Apr → 25 Jun 2026**, dominated by app-testing phrases ("Hello.", "Test, test, test."). No clip carried a target app (Power Mode was off).

**Results.**

1. **The categorical model had nothing to say.** SenseVoice returned `UNKNOWN` ×38 and `NEUTRAL` ×12 — zero happy/sad/angry/fearful/surprised. Worse, its two answers split on *recording conditions*, not affect: UNKNOWN clips averaged 47 dB and 0.85 words/s, NEUTRAL clips 60 dB and 2.07 words/s. "Unknown" means *too quiet or too sparse to decide*.
2. **Text valence was flat.** VADER ranged −0.03 to +0.27 on everything but one 86-second clip. Dictated instructions carry no sentiment signal; "Create a web app for laundry delivery" scoring +0.27 is lexicon noise.
3. **Only the acoustic arousal proxy varied** (z −1.2 … +1.7), with face validity at the extremes: a 24-second energetic mini-essay and a crisp command at the top, "Hello." tests and "Oh, yeah." at the bottom. Sample too small and too test-dominated to say more.

**Interpretation.** This is the acted-vs-natural gap of §4 in the author's own voice: calm dictation to a computer resembles none of the classes a categorical SER model was trained on.

## 7. Design position

- **No categorical SER label as an input to anything.** It was empty on real data, not just suspect in principle. SenseVoice's value, if it is ever adopted, is as an ASR engine whose emotion token gets *logged*, not acted on.
- **If a state signal ships, it is within-person relative arousal from plain acoustics** — intensity, F0 spread, rate against a rolling personal baseline. No ML model, no license exposure, on-device in microseconds. Valence, if needed, comes from the agent already reading the transcript.
- **Continuous, smoothed, forgotten.** Two dimensions, exponentially averaged over recent utterances, acted on as a trend, never persisted, never surfaced as a label.
- **Small nudges to delivery, not content.** High arousal + negative valence → shorter, calmer, fewer options. Low arousal → warmer, more scaffolding. These map onto the existing comportment knobs in `lib/persona.ts`; a future `agent_persona` / comportment MCP call could accept an optional `state` parameter carrying nothing more than two floats.
- **Not decided yet.** The spike establishes that the shortcut doesn't exist; it does not establish that the arousal proxy is useful. The harness re-runs weekly (launchd, cached per clip) as real dictation accrues. The decision point is whether, after a few weeks of normal use with a VoiceInk default Mode set, the top and bottom arousal clips sound different to the person who spoke them.

## 8. Integration sketch (if it ever proceeds)

VoiceInk already links every recording to transcript, timestamp and target app, so an integration is a **folder watcher**, not a fork: watch `Recordings/`, compute the two floats per new clip, keep a rolling baseline in memory, expose the current state to the agent through the local MCP server (`packages/mcp`) as a read-only, optional, opt-in tool. Audio never leaves the machine; the web app never sees it.

---

### Sources

SenseVoice · [repo](https://github.com/FunAudioLLM/SenseVoice) · [sherpa-onnx models](https://k2-fsa.github.io/sherpa/onnx/sense-voice/pretrained.html) · [FunAudioLLM paper](https://arxiv.org/abs/2407.04051)
emotion2vec · [repo](https://github.com/ddlBoJack/emotion2vec) · [emotion2vec+ large](https://huggingface.co/emotion2vec/emotion2vec_plus_large)
audEERING · [w2v2-how-to](https://github.com/audeering/w2v2-how-to) · [Wagner et al. 2023](https://arxiv.org/abs/2203.07378) · [openSMILE](https://github.com/audeering/opensmile)
SpeechBrain · [IEMOCAP model](https://huggingface.co/speechbrain/emotion-recognition-wav2vec2-IEMOCAP)
Validity · [cross-corpus study](https://arxiv.org/abs/2207.02104) · [Distilled HuBERT cross-corpus](https://arxiv.org/pdf/2512.23435) · [Barrett et al. 2019](https://journals.sagepub.com/doi/full/10.1177/1529100619832930)
Regulation · [FPF on Art. 5(1)(f)](https://fpf.org/blog/red-lines-under-eu-ai-act-unpacking-the-prohibition-of-emotion-recognition-in-the-workplace-and-education-institutions/)
VoiceInk · [repo](https://github.com/Beingpax/VoiceInk) · [docs: Modes](https://tryvoiceink.com/docs/modes) · [docs: history cleanup](https://tryvoiceink.com/docs/transcription-history)
