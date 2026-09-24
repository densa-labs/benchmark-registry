<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/Benchmark-Registry-Logo-Full-White.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/Benchmark-Registry-Logo-Full-Dark.png">
  <img alt="Benchmark Registry" src="assets/Benchmark-Registry-Logo-Full-Dark.png">
</picture>

# Benchmark Registry

**A project of [Densa Labs](https://densa-labs.github.io).**<br>
[Benchmark Registry](https://benchmarkregistry.org) puts your favorite models' benchmark results in one place. It solves a simple but felt problem: finding benchmark results scattered across different models, benchmarks, companies, and evaluators.

## What is Benchmark Registry?

Benchmark Registry is a structured, updating registry of AI models and their benchmark results.

It tracks:

- **Models and model families**
- **Benchmark versions and metrics**
- **Reasoning/effort variants**
- **Evaluators**
- **Sources and reported dates**
- **Companies and model developers**

## Data sources

Benchmark results are sourced from primary sources:

**1. Official benchmark or evaluator results**<br>
**2. Official model developer system cards, model cards, technical reports, or evaluation pages**

## Registry numbers

Models receive stable Registry numbers based on their provider namespace and chronological release order.

Examples:

```text
10006   OpenAI GPT-6 Astra
20004   Anthropic Claude Opus 4.6
110001  DeepSeek Coder
```

### Namespace allocation

```text
00  = Stealth models
10  = OpenAI
15  = OpenAI OSS
20  = Anthropic
30  = Google
35  = Google Gemma
40  = SpaceXAI
50  = Cursor
60  = NVIDIA
70  = Microsoft
80  = Meta
90  = Mistral
100 = intentionally unused
110 = DeepSeek
120 = Moonshot AI
130 = Alibaba
140 = MiniMax
150 = Z.ai
160 = Thinking Machines
170 = SSI
```

## Status

Benchmark Registry v2 is currently in development.

## License

Code is licensed under [Apache License 2.0](LICENSE).<br>
Benchmark Registry data licensed under [ODC-By 1.0](DATA_LICENSE).
