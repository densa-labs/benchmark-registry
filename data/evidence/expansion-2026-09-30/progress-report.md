# Expansion pass — published partial pass

Closed out at user request on2026-10-03; further audits deferred. All57 qualifying models have recorded discoveries. Published290 new results across39 models. Fully closed audits:27;30 remain open.29 models have exhaustively inspected sources, including the two Inkling sources whose metadata mapping remains open. The original exhaustive completion gate has NOT been met.

Canonical results: staging636→927; production636→926. Sitemap: staging820→949; production820→946.19 new benchmark families,28 versions,20 metrics; evaluator inventory is detailed in cohort snapshots. No canonical corrections. Public D1 reads remain0 in verified requests.

Latest cohort25 adds Inkling-Small CharXiv reasoning77.4% without tools and81.3% with Python, effort0.99. Both environments passed atomic ingestion, incremental publication, public QA, two replay skips and zero-write no-op materialization. Inkling source ledger reconciles132 records:2 new+18 identical+4 conflicts+108 unresolved. All remaining records have explicit reasons. Global source-visible totals remain incomplete for deferred audits.

See [HANDOVER.md](HANDOVER.md) and progress-report.json for publication evidence and remaining work.

| Registry No. | Model | Release date | Before results | Official source | Visible results | Added | Existing | Unresolved | After results | Exhaustive source inspection | All safely mappable processed |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---|---|
| 20013 | Claude Sonnet 5 | 2026-06-30 | 2 | [Official source](https://www-cdn.anthropic.com/283ef97c476cf442c91d9a37d5b214242a55bb92/Claude%20Sonnet%205%20System%20Card.pdf) | Deferred audit | 14 | Deferred | Deferred | 16 | NO | NO |
| 40001 | Grok 4.5 | 2026-07-16 | 2 | [Official source](https://cursor.com/resources/grok-4-5-model-card.pdf) | 55 | 1 | 0 | 40 | 3 | YES | YES |
| 10013 | GPT-6 Luna | 2026-09-22 | 1 | [Official source](https://openai.com/index/introducing-gpt-6-sol-and-luna/) | Deferred audit | 14 | Deferred | Deferred | 15 | NO | NO |
| 10009 | GPT-5.6 Luna | 2026-07-09 | 7 | [Official source](https://deploymentsafety.openai.com/gpt-5-6) | Deferred audit | 15 | Deferred | Deferred | 22 | NO | NO |
| 10010 | GPT-5.6 Sol | 2026-07-09 | 9 | [Official source](https://deploymentsafety.openai.com/gpt-5-6) | Deferred audit | 14 | Deferred | Deferred | 23 | NO | NO |
| 10011 | GPT-5.6 Terra | 2026-07-09 | 7 | [Official source](https://deploymentsafety.openai.com/gpt-5-6) | Deferred audit | 0 | Deferred | Deferred | 7 | NO | NO |
| 80002 | Muse Spark 1.1 | 2026-07-09 | 11 | [Official source](https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2) | Deferred audit | 0 | Deferred | Deferred | 11 | NO | NO |
| 160001 | Inkling | 2026-07-15 | 9 | [Official source](https://thinkingmachines.ai/model-card/inkling/) | 76 | 3 | 10 | 62 | 12 | YES | NO |
| 120003 | Kimi K3 | 2026-07-16 | 11 | [Official source](https://huggingface.co/moonshotai/Kimi-K3) | 121 | 5 | 8 | 104 | 16 | NO | NO |
| 30007 | Gemini 3.6 Flash | 2026-07-21 | 5 | [Official source](https://deepmind.google/models/model-cards/gemini-3-6-flash/) | 24 | 2 | 4 | 17 | 7 | YES | YES |
| 20014 | Claude Opus 5 | 2026-07-24 | 3 | [Official source](https://www-cdn.anthropic.com/ceaf5c7ff2783855203fde8208ec311252dced5b/Claude%20Opus%205%20System%20Card.pdf) | Deferred audit | 30 | Deferred | 329 | 33 | YES | YES |
| 160002 | Inkling-Small | 2026-07-30 | 9 | [Official source](https://thinkingmachines.ai/model-card/inkling-small/) | 56 | 2 | 8 | 46 | 11 | YES | NO |
| 130008 | Qwen3.8-Max | 2026-08-02 | 7 | [Official source](https://qwen.ai/blog?id=qwen3.8) | Deferred audit | 8 | Deferred | 121 | 15 | NO | NO |
| 80003 | Muse Spark 1.2 | 2026-08-05 | 9 | [Official source](https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2) | Deferred audit | 1 | Deferred | Deferred | 10 | YES | NO |
| 80004 | Muse Glimmer 30B | 2026-08-10 | 8 | [Official source](https://research.meta.ai/blog/introducing-muse-glimmer-open-agentic-model) | Deferred audit | 3 | Deferred | Deferred | 11 | NO | NO |
| 40002 | Grok 4.6 | 2026-08-12 | 4 | [Official source](https://media.x.ai/v1/website/card-4p6-4cd2dc57.pdf) | 52 | 1 | 1 | 45 | 5 | YES | YES |
| 70003 | MAI-Thinking-1 | 2026-08-12 | 6 | [Official source](https://microsoft.ai/pdf/mai-thinking-1.pdf) | Deferred audit | 1 | Deferred | Deferred | 7 | NO | NO |
| 30010 | Gemini 3.7 Flash | 2026-08-13 | 6 | [Official source](https://deepmind.google/models/model-cards/gemini-3-7-flash/) | 41 | 2 | 5 | 34 | 8 | YES | YES |
| 150005 | GLM-5.3 | 2026-08-14 | 7 | [Official source](https://z.ai/blog/glm-5.3) | Deferred audit | 0 | Deferred | Deferred | 7 | NO | NO |
| 150006 | GLM-5.3-Flash | 2026-08-26 | 6 | [Official source](https://z.ai/blog/glm-5.3-flash) | Deferred audit | 0 | Deferred | Deferred | 6 | NO | NO |
| 20004 | Claude Fable 5.1 | 2026-09-01 | 9 | [Official source](https://www-cdn.anthropic.com/0339e6a7c5c7b87f5c07798616dc32c215d14235/Claude%20Fable%205.1%20&%20Claude%20Mythos%205.1%20System%20Card.pdf) | Deferred audit | 20 | Deferred | 180 | 29 | YES | YES |
| 30004 | Gemini 3.8 Flash | 2026-09-02 | 8 | [Official source](https://deepmind.google/models/model-cards/gemini-3-8-flash/) | 15 | 0 | 6 | 7 | 8 | YES | YES |
| 80005 | Muse Spark 1.3 | 2026-09-02 | 9 | [Official source](https://research.meta.ai/blog/introducing-muse-spark-1-3) | Deferred audit | 0 | Deferred | Deferred | 9 | YES | NO |
| 10005 | GPT-6 Astra | 2026-09-03 | 8 | [Official source](https://openai.com/index/introducing-gpt-6-sol-and-luna/) | Deferred audit | 13 | Deferred | Deferred | 21 | NO | NO |
| 40003 | Grok 4.7 | 2026-09-21 | 3 | [Official source](https://media.x.ai/v1/website/card4p7-3a96f40b.pdf) | 43 | 1 | 1 | 36 | 4 | YES | YES |
| 10014 | GPT-6 Sol | 2026-09-22 | 3 | [Official source](https://openai.com/index/introducing-gpt-6-sol-and-luna/) | Deferred audit | 12 | Deferred | Deferred | 15 | NO | NO |
| 20015 | Claude Opus 5.5 | 2026-09-22 | 5 | [Official source](https://cursor.com/cursorbench) | Deferred audit | 16 | Deferred | Deferred | 21 | NO | NO |
| 20016 | Claude Sonnet 5.5 | 2026-09-28 | 14 | [Official source](https://www.anthropic.com/claude-sonnet-5-5-system-card) | Deferred audit | 15 | Deferred | 128 | 29 | YES | YES |
| 10015 | GPT-6.1 Sol | 2026-09-29 | 25 | [Official source](https://deploymentsafety.openai.com/gpt-6-1-sol) | Deferred audit | 3 | Deferred | Deferred | 28 | NO | NO |
| 80001 | Muse Spark | 2026-04-08 | 2 | [Official source](https://ai.meta.com/static-resource/muse-spark-eval-methodology) | Deferred audit | 23 | Deferred | 513 | 25 | NO | NO |
| 20012 | Claude Fable 5 | 2026-06-09 | 2 | [Official source](https://www-cdn.anthropic.com/57a52ea7d8f0e54e8a542e908266086df425cdf5/Claude%20Fable%205%20&%20Claude%20Mythos%205%20System%20Card.pdf) | 132 | 3 | Deferred | 127 | 5 | YES | YES |
| 130004 | Qwen3.6-Plus | 2026-04-02 | 11 | [Official source](https://qwen.ai/blog?id=qwen3.6) | 69 | 4 | Deferred | 56 | 15 | YES | YES |
| 35001 | Gemma 4 26B A4B Instruct | 2026-04-02 | 8 | [Official source](https://arxiv.org/pdf/2607.02770v2) | 39 | 0 | 8 | 29 | 8 | YES | YES |
| 35002 | Gemma 4 31B Instruct | 2026-04-02 | 8 | [Official source](https://arxiv.org/pdf/2607.02770v2) | 39 | 0 | 8 | 29 | 8 | YES | YES |
| 35003 | Gemma 4 E2B Instruct | 2026-04-02 | 8 | [Official source](https://arxiv.org/pdf/2607.02770v2) | 56 | 0 | 8 | 44 | 8 | YES | YES |
| 35004 | Gemma 4 E4B Instruct | 2026-04-02 | 8 | [Official source](https://arxiv.org/pdf/2607.02770v2) | 57 | 0 | 8 | 45 | 8 | YES | YES |
| 150003 | GLM-5.1 | 2026-04-07 | 7 | [Official source](https://huggingface.co/zai-org/GLM-5.1) | Deferred audit | 0 | Deferred | Deferred | 7 | NO | NO |
| 20010 | Claude Opus 4.7 | 2026-04-16 | 8 | [Official source](https://anthropic.com/claude-opus-4-7-system-card) | 407 | 10 | 7 | 382 | 18 | YES | YES |
| 130005 | Qwen3.6-35B-A3B | 2026-04-17 | 8 | [Official source](https://huggingface.co/Qwen/Qwen3.6-35B-A3B) | Deferred audit | 3 | Deferred | Deferred | 11 | NO | NO |
| 120002 | Kimi K2.6 | 2026-04-20 | 12 | [Official source](https://huggingface.co/moonshotai/Kimi-K2.6) | Deferred audit | 5 | Deferred | Deferred | 17 | NO | NO |
| 10008 | GPT-5.5 | 2026-04-23 | 10 | [Official source](https://deploymentsafety.openai.com/gpt-5-6) | Deferred audit | 0 | Deferred | Deferred | 10 | NO | NO |
| 110001 | DeepSeek-V4-Flash | 2026-04-24 | 10 | [Official source](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash) | Deferred audit | 17 | Deferred | 44 | 27 | YES | YES |
| 110002 | DeepSeek-V4-Pro | 2026-04-24 | 10 | [Official source](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro) | Deferred audit | 17 | Deferred | 277 | 27 | YES | YES |
| 50004 | Composer 2.5 | 2026-05-18 | 4 | [Official source](https://cursor.com/blog/composer-2-5) | Deferred audit | 2 | Deferred | 5 | 6 | YES | YES |
| 30006 | Gemini 3.5 Flash | 2026-05-19 | 8 | [Official source](https://deepmind.google/models/model-cards/gemini-3-5-flash/) | 18 | 1 | 3 | 11 | 9 | YES | YES |
| 130006 | Qwen3.7-Max | 2026-05-20 | 8 | [Official source](https://qwen.ai/blog?id=qwen3.7) | 74 | 2 | 7 | 65 | 10 | YES | YES |
| 90005 | Mistral Medium 3.5 | 2026-05-22 | 7 | [Official source](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B) | Deferred audit | 1 | Deferred | 2 | 8 | NO | NO |
| 20011 | Claude Opus 4.8 | 2026-05-28 | 10 | [Official source](https://www-cdn.anthropic.com/0f0c97ad20d8005706296bd92aa1c27c6b2f4f61/Claude%20Opus%204.8%20System%20Card.pdf) | Deferred audit | 0 | Deferred | Deferred | 10 | NO | NO |
| 140003 | MiniMax M3 | 2026-06-01 | 5 | [Official source](https://www.minimax.io/blog/minimax-m3) | 67 | 2 | 5 | 58 | 7 | YES | YES |
| 70002 | MAI-Code-1-Flash | 2026-06-02 | 4 | [Official source](https://microsoft.ai/news/introducingmai-code-1-flash/) | Deferred audit | 1 | Deferred | Deferred | 5 | NO | NO |
| 130007 | Qwen3.7-Plus | 2026-06-03 | 12 | [Official source](https://qwen.ai/blog?id=qwen3.7-plus) | 78 | 2 | 11 | 65 | 14 | YES | YES |
| 35005 | Gemma 4 12B Instruct | 2026-06-03 | 8 | [Official source](https://arxiv.org/pdf/2607.02770v2) | 53 | 1 | 8 | 44 | 9 | NO | NO |
| 60003 | NVIDIA Nemotron 3 Ultra 550B-A55B | 2026-06-04 | 7 | [Official source](https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-NVFP4) | 101 | 0 | 0 | 95 | 7 | YES | YES |
| 150004 | GLM-5.2 | 2026-06-16 | 8 | [Official source](https://huggingface.co/zai-org/GLM-5.2) | Deferred audit | 0 | Deferred | Deferred | 8 | NO | NO |
| 130001 | Qwen3-Max-Instruct | 2025-09-24 | 1 | [Official source](https://qwen.ai/blog?id=241398b9cd6353de490b0f82806c7848c5d2777d) | 5 | 0 | 1 | 4 | 1 | YES | YES |
| 20005 | Claude Sonnet 4.5 | 2025-09-29 | 2 | [Official source](https://www.anthropic.com/news/claude-sonnet-4-5) | Deferred audit | 0 | Deferred | Deferred | 2 | NO | NO |
| 90001 | Mistral Large 3 | 2025-12-02 | 1 | [Official source](https://huggingface.co/mistralai/Mistral-Large-3-675B-Instruct-2512) | Deferred audit | 0 | Deferred | Deferred | 1 | NO | NO |
