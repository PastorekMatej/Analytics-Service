"""
Report generation: writes summary.md and summary.json with variance header.
GPT-5 specific: reports reasoning_effort and token usage.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Sequence

from .parser import ParsedOutput


def _top_header_lines(agreements: dict, similarities: dict, usage_totals: Dict[str, int], usage_means: Dict[str, float]) -> List[str]:
    n = agreements.get("total_runs", 0)
    def line(label: str, key: str) -> str:
        return f"{label}: {agreements.get(key, 0)}/{n}"

    lines = [
        line("ÉVOLUTION_GLOBALE", "evolution_globale"),
        line("Erreurs GRAMMAIRE", "grammaire"),
        line("Erreurs VOCABULAIRE", "vocabulaire"),
        line("Erreurs STYLE", "style"),
        line("Erreurs PERSISTANTES", "persistantes"),
    ]
    sim = similarities.get("resume_mean_similarity")
    if sim is not None:
        lines.append(f"Résumé similarity (moyenne): {sim:.1f}/100")
    # Tokens
    total = usage_totals.get("total_tokens", 0)
    pt = usage_totals.get("prompt_tokens", 0)
    ct = usage_totals.get("completion_tokens", 0)
    lines.append(f"Tokens totaux: {total} (prompt: {pt}, completion: {ct})")
    mt = usage_means.get("total_tokens", 0.0)
    mpt = usage_means.get("prompt_tokens", 0.0)
    mct = usage_means.get("completion_tokens", 0.0)
    lines.append(f"Tokens moyens/run: {mt:.1f} (prompt: {mpt:.1f}, completion: {mct:.1f})")
    return lines


def write_report(
    out_dir: Path,
    config_label: str,
    raw_texts: Sequence[str],
    parsed_outputs: Sequence[ParsedOutput],
    agreements: Dict,
    similarities: Dict,
    prompt_text: str,
    usages: Sequence[Dict[str, int]],
    notes: Sequence[str] | None = None,
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    runs_dir = out_dir / "runs"
    summary_dir = out_dir / "summary"
    prompt_dir = out_dir / "prompt"

    runs_dir.mkdir(parents=True, exist_ok=True)
    summary_dir.mkdir(parents=True, exist_ok=True)
    prompt_dir.mkdir(parents=True, exist_ok=True)

    # Write prompt used
    (prompt_dir / "prompt.md").write_text(prompt_text, encoding="utf-8")

    # Write raw runs
    for idx, text in enumerate(raw_texts, start=1):
        filename = runs_dir / f"run_{idx:02d}.txt"
        if not text or text.strip() == "":
            text = f"[EMPTY RESPONSE - Run {idx}]"
        filename.write_text(text, encoding="utf-8")

    # Aggregate usage
    totals = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
    for u in usages:
        totals["prompt_tokens"] += int(u.get("prompt_tokens", 0))
        totals["completion_tokens"] += int(u.get("completion_tokens", 0))
        totals["total_tokens"] += int(u.get("total_tokens", 0))
    runs_n = max(1, len(usages))
    means = {
        "prompt_tokens": totals["prompt_tokens"] / runs_n,
        "completion_tokens": totals["completion_tokens"] / runs_n,
        "total_tokens": totals["total_tokens"] / runs_n,
    }

    # Summary JSON
    summary = {
        "config": config_label,
        "agreements": agreements,
        "similarities": similarities,
        "usage_totals": totals,
        "usage_means": means,
        "notes": list(notes or []),
    }
    (summary_dir / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # Summary MD with header
    header_lines = _top_header_lines(agreements, similarities, totals, means)
    md = "\n".join(header_lines)
    if notes:
        md += "\n" + "\n".join([f"Note: {n}" for n in notes])
    md += "\n\n" + "\n".join(
        [
            f"- Run {i+1}: total={usages[i].get('total_tokens', 0)}, prompt={usages[i].get('prompt_tokens', 0)}, completion={usages[i].get('completion_tokens', 0)}"
            for i in range(len(raw_texts))
        ]
    )
    (summary_dir / "summary.md").write_text(md, encoding="utf-8")


