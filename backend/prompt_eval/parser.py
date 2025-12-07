"""
Parser utilities to normalize LLM analysis outputs (free-text or JSON)
into a common structured schema used by the metrics/report.

PEP8, typed, and resilient to minor output variations.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple


LEVEL_PATTERN = re.compile(r"\b(A1\+?|A2\+?|B1\+?|B2\+?|C1\+?|C2\+?)\b", re.IGNORECASE)
CODE_PATTERN = re.compile(r"\b([GVS])(\d{2})\b")


@dataclass
class ErrorItem:
    code: str
    pattern: Optional[str] = None
    occurrences: Optional[int] = None
    exemples: Optional[List[str]] = None


@dataclass
class ParsedOutput:
    # New JSON structure (prompt_v2)
    niveau_depart: Optional[str]
    niveau_actuel: Optional[str]
    nombre_textes: Optional[int]
    synthese_niveau_initial: Optional[str]
    synthese_progression: Optional[str]
    synthese_niveau_actuel: Optional[str]
    synthese_points_forts: Optional[str]
    synthese_points_ameliorer: Optional[str]
    synthese_recommandations: Optional[str]
    erreurs_grammaire: List[ErrorItem]
    erreurs_vocabulaire: List[ErrorItem]
    erreurs_style: List[ErrorItem]
    erreurs_persistantes: List[str]
    raw_text: str


def _normalize_level(token: str) -> str:
    t = token.upper().replace(" ", "")
    return t


def parse_json_like(text: str) -> Optional[ParsedOutput]:
    """Parse new JSON format from prompt_v2 structure."""
    try:
        data = json.loads(text)
    except Exception:
        return None

    def get_error_items(key: str) -> List[ErrorItem]:
        items: List[ErrorItem] = []
        # New structure: erreurs_recurrentes.grammaire/vocabulaire/style
        recurrentes = data.get("erreurs_recurrentes", {})
        arr = recurrentes.get(key, [])
        
        if isinstance(arr, list):
            for it in arr:
                if not isinstance(it, dict):
                    continue
                code = str(it.get("type") or "").upper()
                if not code:
                    continue
                pattern = it.get("pattern")
                occ = it.get("occurrences")
                ex = it.get("exemples") if isinstance(it.get("exemples"), list) else None
                items.append(ErrorItem(code=code, pattern=pattern, occurrences=occ, exemples=ex))
        return items

    # Extract conclusion_synthetique
    conclusion = data.get("conclusion_synthetique", {})
    evolution = conclusion.get("evolution_niveau", {})
    synthese = conclusion.get("synthese", {})
    
    niveau_depart = evolution.get("niveau_depart")
    niveau_actuel = evolution.get("niveau_actuel")
    nombre_textes = evolution.get("nombre_textes_analyses")
    
    if isinstance(niveau_depart, str):
        niveau_depart = _normalize_level(niveau_depart)
    if isinstance(niveau_actuel, str):
        niveau_actuel = _normalize_level(niveau_actuel)
    
    # Extract erreurs_persistantes (can be dict or empty list)
    persistantes_data = data.get("erreurs_persistantes", {})
    persistantes_list = []
    
    # Handle both dict and list formats (LLM might return empty [] instead of {})
    if isinstance(persistantes_data, dict):
        for category in ["grammaire", "vocabulaire", "style"]:
            cat_list = persistantes_data.get(category, [])
            if isinstance(cat_list, list):
                for item in cat_list:
                    if isinstance(item, dict):
                        code = item.get("type", "")
                        if code:  # Only add if code exists
                            persistantes_list.append(code.upper())
                    elif isinstance(item, str):
                        persistantes_list.append(item)
    elif isinstance(persistantes_data, list):
        # If it's a list, flatten it
        for item in persistantes_data:
            if isinstance(item, dict):
                code = item.get("type", "")
                if code:  # Only add if code exists
                    persistantes_list.append(code.upper())
            elif isinstance(item, str):
                persistantes_list.append(item)

    return ParsedOutput(
        niveau_depart=niveau_depart,
        niveau_actuel=niveau_actuel,
        nombre_textes=nombre_textes,
        synthese_niveau_initial=synthese.get("niveau_initial"),
        synthese_progression=synthese.get("progression_observee"),
        synthese_niveau_actuel=synthese.get("niveau_actuel_detail"),
        synthese_points_forts=synthese.get("points_forts"),
        synthese_points_ameliorer=synthese.get("points_a_ameliorer"),
        synthese_recommandations=synthese.get("recommandations"),
        erreurs_grammaire=get_error_items("grammaire"),
        erreurs_vocabulaire=get_error_items("vocabulaire"),
        erreurs_style=get_error_items("style"),
        erreurs_persistantes=persistantes_list,
        raw_text=text,
    )


def parse_output(text: str) -> ParsedOutput:
    """Parse JSON output from GPT-5 (prompt_v2 format only)."""
    json_parsed = parse_json_like(text)
    if json_parsed is not None:
        return json_parsed
    
    # Fallback: return empty structure if JSON parsing fails
    return ParsedOutput(
        niveau_depart=None,
        niveau_actuel=None,
        nombre_textes=None,
        synthese_niveau_initial=None,
        synthese_progression=None,
        synthese_niveau_actuel=None,
        synthese_points_forts=None,
        synthese_points_ameliorer=None,
        synthese_recommandations=None,
        erreurs_grammaire=[],
        erreurs_vocabulaire=[],
        erreurs_style=[],
        erreurs_persistantes=[],
        raw_text=text,
    )



