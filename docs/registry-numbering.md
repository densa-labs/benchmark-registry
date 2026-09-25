# Benchmark Registry v2 — Frozen Registry Numbering

**Status:** Frozen

Registry No. = namespace prefix + zero-padded three-digit assigned sequence.

Initial assignment is chronological. After publication begins, assignment is
append-only so that public identifiers remain immutable; the exact rule is below.

Examples:

```text
10 + 006  = 10006
110 + 001 = 110001
00 + 001  = 00001
```

Store Registry Nos. as text.

The sequence component is exactly three decimal digits in the inclusive range
`001`–`999`. `000` is invalid. Prefixes are registered digit strings and retain
leading zeroes. A Registry No. is valid only when it can be split using an
allocated namespace prefix and a valid three-digit sequence; it must not be
parsed as an integer.

## Namespace allocation

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
100 = reserved; intentionally unallocated
110 = DeepSeek
120 = Moonshot AI
130 = Alibaba
140 = MiniMax
150 = Z.ai
160 = Thinking Machines
170 = SSI
```

## Rules

- Before the first public number in a namespace is published, sequence is
  chronological release order within that namespace.
- `release_at` is the earliest official public availability established by an
  acceptable primary source. Store its precision separately as `date` or
  `timestamp`. Timestamps are normalized to UTC. Date-only releases on the same
  date are treated as tied; agents must not infer an unpublished time of day.
- Marketing model numbers do not dictate Registry sequence.
- Models without marketing numbers use the same chronological rule.
- Tied releases are ordered by Unicode case-folded canonical model name, then by
  normalized primary-source URL from `data-contract.md` as the final deterministic
  fallback.
- Reasoning level is result metadata and is never a numbering input.
- Public Registry Nos. are immutable once published.
- Do not reuse old Registry Nos.
- After any number in a namespace is public, every newly assigned model uses the
  next highest unused sequence. A late-discovered historical release is appended
  and records `sequence_exception_reason = late_backfill`; it does not cause
  renumbering. A corrected release date likewise never changes a published number.
- Stealth `00` records may later redirect to confirmed permanent records.
- A stealth redirect preserves the old Registry No. permanently, targets one
  confirmed model, and may not form a chain or cycle. Model-page requests for the
  old number return a permanent redirect; API detail requests return the target
  model plus `redirected_from`.
- Namespace `00` is used only by models with `status = stealth`; stealth status
  is invalid outside namespace `00`. A redirect source is a `00` stealth model and
  its target is a non-stealth model outside `00`.
- Subnamespaces may be used for genuinely distinct model families only after an
  explicit prefix is added to the allocation table. A subnamespace is a normal
  namespace row with an optional `parent_namespace_id`; prefixes are never
  derived implicitly.
- Namespace identity and legal corporate ownership are separate concepts.
- Each namespace has one or more explicitly authorized companies through
  `namespace_companies`. A company may use multiple namespaces. Model ingestion
  must reject a company/namespace pair absent from that mapping.
- A standalone AI unit may be explicitly authorized in the former provider's
  existing namespace. Correcting a published model's provider to that unit
  leaves its namespace, sequence, and Registry No. unchanged.
- Prefix `100` is reserved, is not seeded as an active namespace, and must be
  rejected for model assignment.
- When a namespace reaches sequence `999`, assignment stops until an explicit new
  namespace or subnamespace allocation is approved. Sequences never expand past
  three digits.

## Model identity

A new Registry No. represents a distinct model release, not merely a new name.
An official rename, dated API alias, or endpoint alias that resolves to the same
released artifact remains an alias of the existing model. A separately released
artifact, checkpoint, or provider-declared model version receives a new Registry
No. Preview and deprecated states do not by themselves create or remove identity.
If primary sources do not establish whether two names are the same released
artifact, stop for review before assigning a number.
