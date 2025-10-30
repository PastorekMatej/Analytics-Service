"""
Metrics for agreement and qualitative similarity across multiple runs.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Optional, Sequence, Tuple

from rapidfuzz.fuzz import token_set_ratio

from .parser import ParsedOutput


def _codes(items) -> List[str]:
    return [it.code for it in items if getattr(it, "code", None)]


def modal_agreement_count(sets: List[Tuple[str, ...]]) -> int:
    """Return how many entries equal the most frequent set (exact match)."""
    if not sets:
        return 0
    counts = {}
    for s in sets:
        counts[s] = counts.get(s, 0) + 1
    return max(counts.values())


def compute_agreements(outputs: Sequence[ParsedOutput]) -> dict:
    """Compute X/5 style agreement counts for each section.

    - evolution_global: exact match on (level_from, level_to)
    - grammaire/vocabulaire/style: exact match on the SET of codes present
    - persistantes: not scored as X/5; we can estimate by exact list match
    """
    n = len(outputs)
    if n == 0:
        return {}

    # Evolution agreement
    evo_pairs = [
        (o.level_from or "", o.level_to or "") for o in outputs
    ]
    evo_agree = modal_agreement_count([tuple(p) for p in evo_pairs])

    # Error code set agreements
    g_sets = [tuple(sorted(set(_codes(o.erreurs_grammaire)))) for o in outputs]
    v_sets = [tuple(sorted(set(_codes(o.erreurs_vocabulaire)))) for o in outputs]
    s_sets = [tuple(sorted(set(_codes(o.erreurs_style)))) for o in outputs]
    g_agree = modal_agreement_count(g_sets)
    v_agree = modal_agreement_count(v_sets)
    s_agree = modal_agreement_count(s_sets)

    # Persistantes agreement (optional)
    p_sets = [tuple(sorted(set(o.erreurs_persistantes))) for o in outputs]
    p_agree = modal_agreement_count(p_sets)

    return {
        "evolution_globale": evo_agree,
        "grammaire": g_agree,
        "vocabulaire": v_agree,
        "style": s_agree,
        "persistantes": p_agree,
        "total_runs": n,
    }


def compute_similarity(outputs: Sequence[ParsedOutput]) -> dict:
    """Compute mean similarity for narrative fields like resume."""
    resumes = [o.resume.strip() for o in outputs if o.resume and o.resume.strip()]
    if len(resumes) < 2:
        return {"resume_mean_similarity": None}
    # pairwise token_set_ratio average
    scores: List[float] = []
    for i in range(len(resumes)):
        for j in range(i + 1, len(resumes)):
            scores.append(float(token_set_ratio(resumes[i], resumes[j])))
    mean_score = sum(scores) / len(scores) if scores else None
    return {"resume_mean_similarity": mean_score}


