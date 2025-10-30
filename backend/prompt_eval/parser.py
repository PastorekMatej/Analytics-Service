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
    level_from: Optional[str]
    level_to: Optional[str]
    resume: Optional[str]
    tendances: List[str]
    erreurs_grammaire: List[ErrorItem]
    erreurs_vocabulaire: List[ErrorItem]
    erreurs_style: List[ErrorItem]
    erreurs_persistantes: List[str]
    raw_text: str


def _normalize_level(token: str) -> str:
    t = token.upper().replace(" ", "")
    return t


def parse_json_like(text: str) -> Optional[ParsedOutput]:
    try:
        data = json.loads(text)
    except Exception:
        return None

    def get_error_items(key: str) -> List[ErrorItem]:
        items: List[ErrorItem] = []
        arr = (
            (((data.get("erreurs") or {}).get(key)) if isinstance(data.get("erreurs"), dict) else None)
            or data.get(key)
            or []
        )
        if isinstance(arr, list):
            for it in arr:
                if not isinstance(it, dict):
                    # attempt to coerce from string like "G07: Mauvais emploi ..."
                    if isinstance(it, str):
                        m = CODE_PATTERN.search(it)
                        code = m.group(0) if m else None
                        if code:
                            items.append(ErrorItem(code=code))
                    continue
                code = str(it.get("code") or "").upper()
                if not code:
                    # try to infer from pattern text
                    m = CODE_PATTERN.search(" ".join([str(v) for v in it.values()]))
                    code = m.group(0) if m else ""
                if not code:
                    continue
                pattern = it.get("pattern")
                occ = it.get("occurrences")
                ex = it.get("exemples") if isinstance(it.get("exemples"), list) else None
                items.append(ErrorItem(code=code, pattern=pattern, occurrences=occ, exemples=ex))
        return items

    evo = data.get("evolution_globale") or data.get("evolution") or {}
    level_from = evo.get("level_from") if isinstance(evo, dict) else None
    level_to = evo.get("level_to") if isinstance(evo, dict) else None
    resume = evo.get("resume") if isinstance(evo, dict) else None

    if isinstance(level_from, str):
        level_from = _normalize_level(level_from)
    if isinstance(level_to, str):
        level_to = _normalize_level(level_to)

    tendances = data.get("tendances") if isinstance(data.get("tendances"), list) else []
    erreurs_persistantes = (
        data.get("erreurs_persistantes") if isinstance(data.get("erreurs_persistantes"), list) else []
    )

    return ParsedOutput(
        level_from=level_from,
        level_to=level_to,
        resume=resume if isinstance(resume, str) else None,
        tendances=[str(t) for t in tendances],
        erreurs_grammaire=get_error_items("grammaire"),
        erreurs_vocabulaire=get_error_items("vocabulaire"),
        erreurs_style=get_error_items("style"),
        erreurs_persistantes=[str(e) for e in erreurs_persistantes],
        raw_text=text,
    )


def parse_free_text(text: str) -> ParsedOutput:
    # Levels: look for two levels; fallback to single level
    levels = [m.group(0) for m in LEVEL_PATTERN.finditer(text)]
    level_from: Optional[str] = _normalize_level(levels[0]) if levels else None
    level_to: Optional[str] = _normalize_level(levels[1]) if len(levels) > 1 else (level_from if level_from else None)

    # Resume: naive extraction around "résumé" label if present
    resume: Optional[str] = None
    resume_match = re.search(r"(?i)résumé\s*:\s*(.+?)(?:\n\s*\n|\n\s*\w+\s*:)", text, re.DOTALL)
    if resume_match:
        resume = resume_match.group(1).strip()

    # Tendances: capture lines under TENDANCES D’ÉVOLUTION
    tendances: List[str] = []
    tend_match = re.search(r"(?i)TENDANCES[\s\S]*?\n(.*?)\n\s*\n", text)
    if tend_match:
        lines = [ln.strip(" -\t") for ln in tend_match.group(1).splitlines() if ln.strip()]
        tendances = lines

    # Error codes by category via proximity heuristics
    def extract_codes_for(section_label: str) -> List[ErrorItem]:
        pat = re.compile(section_label + r"[\s\S]*?(?=\n\s*[A-ZÉ]|\Z)", re.IGNORECASE)
        m = pat.search(text)
        if not m:
            # try more permissive
            segment = text
        else:
            segment = m.group(0)
        codes = [f"{g}{n}" for g, n in CODE_PATTERN.findall(segment)]
        # de-duplicate preserving order
        seen = set()
        out: List[ErrorItem] = []
        for c in codes:
            if c not in seen:
                seen.add(c)
                out.append(ErrorItem(code=c))
        return out

    err_g = extract_codes_for(r"GRAMMAIRE")
    err_v = extract_codes_for(r"VOCABULAIRE")
    err_s = extract_codes_for(r"STYLE")

    # Erreurs persistantes – capture as lines in the section
    persist: List[str] = []
    persist_match = re.search(r"(?i)ERREURS_PERSISTANTES\s*:\s*([\s\S]+)$", text)
    if persist_match:
        lines = [ln.strip(" -\t") for ln in persist_match.group(1).splitlines() if ln.strip()]
        persist = lines[:20]

    return ParsedOutput(
        level_from=level_from,
        level_to=level_to,
        resume=resume,
        tendances=tendances,
        erreurs_grammaire=err_g,
        erreurs_vocabulaire=err_v,
        erreurs_style=err_s,
        erreurs_persistantes=persist,
        raw_text=text,
    )


def parse_output(text: str) -> ParsedOutput:
    json_parsed = parse_json_like(text)
    if json_parsed is not None:
        return json_parsed
    return parse_free_text(text)


