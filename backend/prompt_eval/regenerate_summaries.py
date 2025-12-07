"""
Regenerate summary reports from existing run files.
This script re-parses existing runs and recalculates metrics.

Usage:
    python -m prompt_eval.regenerate_summaries
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

from .parser import parse_output, ParsedOutput
from .metrics import compute_agreements, compute_similarity
from .report import write_report


def regenerate_report(eval_dir: Path) -> None:
    """
    Regenerate summary for a single evaluation directory.
    
    Args:
        eval_dir: Path to evaluation directory (e.g., prompt_v2/reasoning-high/)
    """
    runs_dir = eval_dir / "runs"
    prompt_dir = eval_dir / "prompt"
    
    if not runs_dir.exists():
        print(f"⚠️  No runs directory found in {eval_dir}")
        return
    
    # Read all run files
    run_files = sorted(runs_dir.glob("run_*.txt"))
    if not run_files:
        print(f"⚠️  No run files found in {runs_dir}")
        return
    
    print(f"📁 Processing {eval_dir.name}: {len(run_files)} runs")
    
    # Parse runs
    raw_texts: List[str] = []
    parsed: List[ParsedOutput] = []
    usages: List[Dict[str, int]] = []
    
    for run_file in run_files:
        text = run_file.read_text(encoding="utf-8")
        raw_texts.append(text)
        parsed.append(parse_output(text))
        
        # Try to extract usage from JSON if present
        usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
        try:
            data = json.loads(text)
            if "usage" in data:
                usage = data["usage"]
        except Exception:
            pass
        usages.append(usage)
    
    # Load existing summary to get usage data
    summary_file = eval_dir / "summary" / "summary.json"
    if summary_file.exists():
        try:
            existing_summary = json.loads(summary_file.read_text(encoding="utf-8"))
            # Use existing usage data if we couldn't extract from runs
            if "usage_totals" in existing_summary:
                totals = existing_summary["usage_totals"]
                runs_n = len(raw_texts)
                # Recalculate per-run usage
                usages = []
                for i in range(runs_n):
                    usages.append({
                        "prompt_tokens": totals["prompt_tokens"] // runs_n,
                        "completion_tokens": totals["completion_tokens"] // runs_n,
                        "total_tokens": totals["total_tokens"] // runs_n,
                    })
                # Adjust last one to account for rounding
                if runs_n > 0:
                    usages[-1]["prompt_tokens"] += totals["prompt_tokens"] % runs_n
                    usages[-1]["completion_tokens"] += (
                        totals["completion_tokens"] % runs_n
                    )
                    usages[-1]["total_tokens"] += totals["total_tokens"] % runs_n
        except Exception as e:
            print(f"   ⚠️  Could not load existing summary: {e}")
    
    # Recalculate metrics with updated parser/metrics
    agreements = compute_agreements(parsed)
    similarities = compute_similarity(parsed)
    
    # Load prompt
    prompt_file = prompt_dir / "prompt.md"
    prompt_text = ""
    if prompt_file.exists():
        prompt_text = prompt_file.read_text(encoding="utf-8")
    
    # Get config label from path
    config_label = eval_dir.name
    
    # Write updated report
    write_report(
        eval_dir,
        config_label,
        raw_texts,
        parsed,
        agreements,
        similarities,
        prompt_text=prompt_text,
        usages=usages,
        notes=[],
    )
    
    persistantes = agreements.get("persistantes", 0)
    total = agreements.get("total_runs", 0)
    print(f"   ✅ Updated - Erreurs PERSISTANTES: {persistantes}/{total}")


def main() -> None:
    """Regenerate all summaries in the reasoning-sweep directory."""
    base_dir = (
        Path(__file__).parent.parent.parent
        / "docs"
        / "prompt_evals"
        / "reasoning-sweep"
    )
    
    if not base_dir.exists():
        print(f"❌ Directory not found: {base_dir}")
        return
    
    print("🔄 Regenerating summary reports with updated metrics...\n")
    
    # Find all evaluation directories
    eval_dirs = []
    for prompt_dir in sorted(base_dir.glob("prompt_v*")):
        for reasoning_dir in sorted(prompt_dir.glob("reasoning-*")):
            if (reasoning_dir / "runs").exists():
                eval_dirs.append(reasoning_dir)
    
    if not eval_dirs:
        print("❌ No evaluation directories found")
        return
    
    # Process each one
    for eval_dir in eval_dirs:
        regenerate_report(eval_dir)
    
    print(f"\n✅ Successfully regenerated {len(eval_dirs)} reports!")


if __name__ == "__main__":
    main()










