# Gemini 4 Argon score ingestion exception

The user requested immediate publication of Gemini 4 Argon and the 19 benchmark scores in the attached screenshot. Google DeepMind's five-page official evaluation report reproduces every score.

After the single-metric contract restriction was explained, the user explicitly instructed: “no do the scores idc about the contract”. This authorizes this batch to select the specific metrics shown in Google's table even when benchmark authors define additional metrics. It does not authorize fabricated values, unofficial evidence, direct production SQL writes, or guessed model identity.

The batch preserves one selected metric per stored version and needs no schema, frontend, Worker, or routing change. Existing versions retain their metadata. New source-defined evaluation configurations/snapshots use the publication date of Google's release documentation, September 30, 2026; that date does not assert the original dataset's release date. Explicit author release dates are used for Vals Index 2.1 and CWE-bench 1. The supplied scores retain Google's displayed rounding and percent scale.

The override is limited to this Gemini 4 Argon ingestion batch. The global contracts and prior expansion pass remain unchanged. Other metrics and competitors in author tables are outside this request.
