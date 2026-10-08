"""Shared helpers for reading leaderboard pages saved in this folder."""
import html
import re


def page_text(path):
    text = re.sub(r"<script.*?</script>|<style.*?</style>", "", path.read_text(errors="ignore"), flags=re.DOTALL)
    return " | ".join(line.strip() for line in html.unescape(re.sub(r"<[^>]+>", "\n", text)).split("\n")
                      if line.strip())


def surge_rows(path):
    text = page_text(path)
    table = text[text.index("Leaderboard | 1 |"):]
    return re.findall(r"\| 1 \| ([^|]+) \| ([^|]+) \| ([\d.]+) \| %", table)
