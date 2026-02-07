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
    """Compute X/5 style agreement counts for each section (prompt_v2 format).

    - niveau_evolution: exact match on (niveau_depart, niveau_actuel)
    - grammaire/vocabulaire/style: exact match on the SET of codes present
    - persistantes: exact match on the SET of error codes present
    """
    n = len(outputs)
    if n == 0:
        return {}

    # Niveau evolution agreement (replaces evolution_globale)
    niveau_pairs = [
        (o.niveau_depart or "", o.niveau_actuel or "") for o in outputs
    ]
    niveau_agree = modal_agreement_count([tuple(p) for p in niveau_pairs])

    # Error code set agreements
    g_sets = [tuple(sorted(set(_codes(o.erreurs_grammaire)))) for o in outputs]
    v_sets = [tuple(sorted(set(_codes(o.erreurs_vocabulaire)))) for o in outputs]
    s_sets = [tuple(sorted(set(_codes(o.erreurs_style)))) for o in outputs]
    g_agree = modal_agreement_count(g_sets)
    v_agree = modal_agreement_count(v_sets)
    s_agree = modal_agreement_count(s_sets)

    # Persistantes agreement
    p_sets = [tuple(sorted(set(o.erreurs_persistantes))) for o in outputs]
    p_agree = modal_agreement_count(p_sets)

    return {
        "niveau_evolution": niveau_agree,
        "grammaire": g_agree,
        "vocabulaire": v_agree,
        "style": s_agree,
        "persistantes": p_agree,
        "total_runs": n,
    }


def compute_similarity(outputs: Sequence[ParsedOutput]) -> dict:
    """Compute mean similarity for narrative synthese fields (prompt_v2 format)."""
    # Compare synthese_niveau_initial + synthese_progression + synthese_niveau_actuel
    syntheses = []
    for o in outputs:
        parts = []
        if o.synthese_niveau_initial:
            parts.append(o.synthese_niveau_initial)
        if o.synthese_progression:
            parts.append(o.synthese_progression)
        if o.synthese_niveau_actuel:
            parts.append(o.synthese_niveau_actuel)
        if parts:
            syntheses.append(" ".join(parts))
    
    if len(syntheses) < 2:
        return {"synthese_mean_similarity": None}
    
    # pairwise token_set_ratio average
    scores: List[float] = []
    for i in range(len(syntheses)):
        for j in range(i + 1, len(syntheses)):
            scores.append(float(token_set_ratio(syntheses[i], syntheses[j])))
    mean_score = sum(scores) / len(scores) if scores else None
    return {"synthese_mean_similarity": mean_score}



