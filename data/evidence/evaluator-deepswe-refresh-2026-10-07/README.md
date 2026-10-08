# DeepSWE refresh, 2026-10-07

Batch: `data/batches/evaluator-deepswe-refresh-2026-10-07.json`, built by
`build_batch.py <local replay database>` from `page.html`
(https://deepswe.datacurve.ai/, fetched 2026-10-07, board "updated September
22, 2026"; the Wayback copy in `archive.txt` is byte-identical).

Owner decision D6: rows already held with the same score are skipped; a changed
score supersedes the earlier row in the same series.

## Result: 4 rows

- New: GPT-5.6 Luna (max) 67, GPT-5.5 (xhigh) 67, Gemini 3.5 Flash (high) 36.
- Gemini 3.6 Flash (high) now 47; it supersedes the 49 that Google's model card
  attributed to Datacurve (result `00ef6704…`).
- Skipped: 15 unchanged rows from the 2026-09-22 snapshot; Gemini 3.8 Flash 74
  and Muse Spark 1.2 55, which the developers already quote from this board.

Note for review: the board is held under version `1.1`, while Meta's report
files the same Muse Spark 1.2 run under `1.1 — mini-swe-agent`. Which harness the
public board uses is not stated on the page, so nothing is moved.

## Checks

Local replay database: dry-run 4 VALID, commit 4 VALID, second commit 4
SKIPPED.
