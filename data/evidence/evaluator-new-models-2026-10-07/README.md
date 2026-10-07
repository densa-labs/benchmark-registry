# Models added for the evaluator-source round, 2026-10-07

Batch: `data/batches/evaluator-new-models-2026-10-07.json` (manifest order 42,
before the evaluator batches that use these models). Owner decision D1: add
models found on evaluator boards. These 14 appear on several boards and have a
dated primary release source, checked on 2026-10-07:

| Registry No. | Model | Released | Source |
|---|---|---|---|
| 10016 | GPT-4.1 mini | 2025-04-14 | openai.com/index/gpt-4-1/ ("launching three new models in the API: GPT‑4.1, GPT‑4.1 mini, and GPT‑4.1 nano") |
| 10017 | GPT-4.1 nano | 2025-04-14 | same |
| 10018 | GPT-5 | 2025-08-07 | openai.com/index/introducing-gpt-5-for-developers/ ("available now in the API platform in three sizes: gpt-5, gpt-5-mini, and gpt-5-nano") |
| 10019 | GPT-5 mini | 2025-08-07 | same |
| 10020 | GPT-5 nano | 2025-08-07 | same |
| 10021 | GPT-5.4 mini | 2026-03-17 | openai.com/index/introducing-gpt-5-4-mini-and-nano/ |
| 10022 | GPT-5.4 nano | 2026-03-17 | same |
| 20017 | Claude Opus 4.1 | 2025-08-05 | anthropic.com/news/claude-opus-4-1 (datePublished) |
| 40004 | Grok 4 | 2025-07-09 | x.ai/news/grok-4 |
| 110003 | DeepSeek-V3.2 | 2025-12-01 | api-docs.deepseek.com/news/news251201 |
| 140004 | MiniMax M2 | 2025-10-27 | minimax.io/news/minimax-m2 (datePublished) |
| 150007 | GLM-4.5 | 2025-07-28 | z.ai/blog/glm-4.5 ("two new GLM family members: GLM-4.5 and GLM-4.5-Air") |
| 150008 | GLM-4.5-Air | 2025-07-28 | same |
| 150009 | GLM-4.6 | 2025-09-30 | z.ai/blog/glm-4.6 |

Numbering (registry-numbering.md): each namespace already has public numbers,
so the new models take the next free sequences with `late_backfill`, in release
order; same-day releases are ordered by case-folded name. Aliases are the API
identifiers named on the source pages.

Not added yet (identity or date not settled from a primary source): GPT-5.1
(ChatGPT 2025-11-12 vs API 2025-11-13), Kimi K2 Thinking (no date on the
announcement page), dated builds such as DeepSeek V4 Pro 0813 and Qwen3.8-Max-0902,
dated Gemini 2.5 previews, GPT-4o snapshots, o1, Grok 4 Fast / 4.1 Fast / 4.2 /
4.3, Gemini 3.1 / 3.5 Flash-Lite, Kimi K2 / K2.7 Code, MiniMax M2.1, Qwen3-Coder,
Llama 4, and models from companies not yet in the Registry (Xiaomi, Poolside,
StepFun, Tencent, Ant, Inception, Cohere, Amazon).
