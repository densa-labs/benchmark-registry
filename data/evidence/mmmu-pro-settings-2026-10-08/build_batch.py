#!/usr/bin/env python3
"""Build the MMMU-Pro score-setting batch from a local replay database.

Every live MMMU-Pro result is labelled with the setting its source states
(README.md lists the exact wording). The rule for a result is chosen by its
primary source URL; a result whose source has no rule stops the build.

Usage: build_batch.py <local replay database>
"""
import json
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUTPUT = ROOT / "data" / "batches" / "mmmu-pro-settings-2026-10-08.json"
CHECKED = "2026-10-08T04:55:00Z"
PAPER = "https://arxiv.org/abs/2409.02813"

SETTINGS = [
    ("mmmu-pro-overall", "Overall (Standard 10 options + Vision)",
     ("The average of the Standard setting with augmented options (usually 10) and the "
      "Vision-only input setting. The paper defines this as the overall MMMU-Pro score "
      "(Section 3.1; Table 1).")),
    ("mmmu-pro-standard-10", "Standard (10 options)",
     "The Standard setting with augmented options (usually 10) only."),
    ("mmmu-pro-vision", "Vision",
     ("The Vision-only input setting only: each question and its options are embedded in "
      "a screenshot or photo.")),
    ("mmmu-pro-standard-4", "Standard (4 options)",
     ("The Standard setting without augmented options (usually 4). The paper reports it "
      "only for comparison; it is not part of the overall score.")),
    ("mmmu-pro-not-stated", "Not stated",
     "The source reports an MMMU-Pro score without saying which setting it covers."),
]

GEMINI = "https://deepmind.google/models/evals-methodology/"
SONNET_4_6 = "https://www-cdn.anthropic.com/78073f739564e986ff3e28522761a7a0b4484f84.pdf"
MUSE_SPARK = "https://ai.meta.com/static-resource/muse-spark-eval-methodology"
NOT_STATED = "mmmu-pro-not-stated"

# Primary source URL -> (setting, source that states it). None as the source
# means the result's own primary source, which was read and does not state a
# setting.
RULES = {
    SONNET_4_6: ("mmmu-pro-overall", SONNET_4_6),
    "https://blog.google/products-and-platforms/products/gemini/gemini-3/":
        ("mmmu-pro-overall", GEMINI + "gemini-3-pro"),
    "https://blog.google/products-and-platforms/products/gemini/gemini-3-flash/":
        ("mmmu-pro-overall", GEMINI + "gemini-3-flash"),
    "https://deepmind.google/models/model-cards/gemini-3-1-pro/":
        ("mmmu-pro-overall", GEMINI + "gemini-3-1-pro"),
    "https://deepmind.google/models/model-cards/gemini-3-5-flash/":
        ("mmmu-pro-overall", GEMINI + "gemini-3-5-flash"),
    MUSE_SPARK: ("mmmu-pro-standard-10", MUSE_SPARK),
    "https://www.vals.ai/benchmarks/mmmu": ("mmmu-pro-standard-4", "https://www.vals.ai/benchmarks/mmmu"),
    "https://www.mercor.com/apex/oss-benchmarks/oss-mmmu-pro-leaderboard/": (NOT_STATED, None),
    "https://openai.com/index/introducing-gpt-5-2/": (NOT_STATED, None),
    "https://openai.com/index/introducing-gpt-5-4/": (NOT_STATED, None),
    "https://openai.com/index/introducing-gpt-5-5/": (NOT_STATED, None),
    "https://openai.com/index/gpt-5-6/": (NOT_STATED, None),
    "https://huggingface.co/moonshotai/Kimi-K2.5": (NOT_STATED, None),
    "https://huggingface.co/moonshotai/Kimi-K2.6": (NOT_STATED, None),
    "https://huggingface.co/moonshotai/Kimi-K3": (NOT_STATED, None),
    "https://huggingface.co/Qwen/Qwen3.6-35B-A3B": (NOT_STATED, None),
    "https://huggingface.co/mistralai/Mistral-Small-4-119B-2603": (NOT_STATED, None),
}


def main() -> int:
    connection = sqlite3.connect(sys.argv[1])
    rows = connection.execute(
        """SELECT r.result_key, r.primary_source_url
        FROM results r
        JOIN benchmark_versions bv ON bv.id = r.benchmark_version_id
        JOIN benchmarks b ON b.id = bv.benchmark_id
        WHERE b.slug = 'mmmu-pro' AND r.retracted_at IS NULL
        ORDER BY r.result_key"""
    ).fetchall()
    unmatched = sorted({url for _, url in rows if url not in RULES})
    if unmatched:
        raise SystemExit(f"no setting rule for: {unmatched}")
    records = [
        {"operation": "score_setting", "record": {
            "benchmark_slug": "mmmu-pro", "key": key, "label": label, "definition": definition,
            "source_url": PAPER, "source_checked_at": CHECKED,
        }}
        for key, label, definition in SETTINGS
    ]
    for result_key, url in rows:
        setting, source = RULES[url]
        records.append({"operation": "result_score_setting", "record": {
            "result_key": result_key, "setting_key": setting,
            "source_url": source or url, "source_checked_at": CHECKED,
        }})
    OUTPUT.write_text(json.dumps({"records": records}, indent=2, ensure_ascii=False) + "\n")
    counts: dict[str, int] = {}
    for item in records[len(SETTINGS):]:
        counts[item["record"]["setting_key"]] = counts.get(item["record"]["setting_key"], 0) + 1
    print(json.dumps({"results": len(rows), "by_setting": counts}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
