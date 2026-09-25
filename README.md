<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/Benchmark-Registry-Logo-Full-White.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/Benchmark-Registry-Logo-Full-Dark.png">
  <img alt="Benchmark Registry" src="assets/Benchmark-Registry-Logo-Full-Dark.png">
</picture>

# Benchmark Registry

**A project of [Densa Labs](https://densa-labs.github.io).**<br>
[Benchmark Registry](https://benchmarkregistry.org) puts AI models and their benchmark results in one place.<br> It solves a simple but felt problem: finding benchmark results scattered across different models, benchmarks, companies, and evaluators.

## What is Benchmark Registry?

Benchmark Registry is a structured, updating registry of AI models and their benchmark results.

It tracks:

- **Models and model families**
- **Benchmark versions and metrics**
- **Reasoning/effort variants**
- **Evaluators**
- **Sources and reported dates**
- **Companies and model developers**

Benchmark results are sourced from primary sources:

- **Official benchmark or evaluator results**<br>
- **Official model developer system cards, blogs, or technical reports**

## Registry numbers

Models receive stable Registry numbers based on their provider namespace and the order in which they are added to the Registry. ***(Ex. 10006 GPT-5.3-Codex)***

### Namespace allocation

```text
00  = Stealth models
10  = OpenAI
15  = OpenAI OSS
20  = Anthropic
30  = Google DeepMind
35  = Google Gemma
40  = SpaceXAI
50  = Cursor
60  = NVIDIA
70  = Microsoft AI
80  = Meta AI
90  = Mistral
100 = intentionally unused
110 = DeepSeek AI
120 = Moonshot AI
130 = Alibaba (Tongyi Lab)
140 = MiniMax
150 = Z.ai
160 = Thinking Machines
170 = SSI*
```

**SSI is a reserved namespace. As of September 2026, SSI has not publicly released any models.*

## License

Code is licensed under [Apache License 2.0](LICENSE).
