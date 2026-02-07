"""
CLI runner for prompt evaluation experiments:
 - Reasoning effort sweep (GPT-5 specific)

Saves 5x raw outputs per config and summary reports.
GPT-5 does not support temperature, top_p, seed, or response_format parameters.
Only reasoning_effort and max_tokens are configurable.
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import List, Optional, Sequence, Tuple, Dict, Any

from openai import APIConnectionError, APIStatusError

from ..clients import client_gpt_5
from .parser import parse_output, ParsedOutput
from .metrics import compute_agreements, compute_similarity
from .report import write_report


def _load_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_json(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _read_student_json(path: Path) -> str:
    # Return the full JSON as string to embed in the prompt
    return path.read_text(encoding="utf-8")


def _call_llm(
    system_prompt: str,
    student_json_text: str,
    *,
    model: str,
    reasoning_effort: Optional[str],
    max_tokens: Optional[int],
) -> Tuple[str, Dict[str, int]]:
    """
    Call GPT-5 with only supported parameters.
    
    Args:
        system_prompt: System prompt text
        student_json_text: Student data as JSON string
        model: Model identifier (gpt-5)
        reasoning_effort: One of 'minimal', 'low', 'medium', 'high' (GPT-5 specific)
        max_tokens: Maximum output tokens
        
    Returns:
        Tuple of (response_text, usage_dict)
    """
    client, _ = client_gpt_5()
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": student_json_text},
    ]
    kwargs = {
        "model": model,
        "messages": messages,
    }
    
    # GPT-5 supported parameters only
    if max_tokens is not None:
        kwargs["max_completion_tokens"] = max_tokens
    
    # TODO: When reasoning_effort API is finalized, uncomment:
    # if reasoning_effort is not None:
    #     kwargs["reasoning_effort"] = reasoning_effort

    resp = client.chat.completions.create(**kwargs)
    
    # GPT-5 with reasoning returns content in annotations or refusal field
    choice = resp.choices[0]
    text = choice.message.content or ""
    
    # If content is empty but reasoning_tokens exist, extract from annotations
    if not text and hasattr(choice.message, 'annotations') and choice.message.annotations:
        # Try to get content from annotations
        for annotation in choice.message.annotations:
            if hasattr(annotation, 'text'):
                text = annotation.text
                break
    
    # Fallback: check if refusal or other fields contain the response
    if not text and hasattr(choice.message, 'refusal') and choice.message.refusal:
        text = f"[REFUSAL]: {choice.message.refusal}"
    
    usage = {
        "prompt_tokens": getattr(getattr(resp, "usage", None), "prompt_tokens", None) or 0,
        "completion_tokens": getattr(getattr(resp, "usage", None), "completion_tokens", None) or 0,
        "total_tokens": getattr(getattr(resp, "usage", None), "total_tokens", None) or 0,
        "reasoning_tokens": getattr(getattr(getattr(resp, "usage", None), "completion_tokens_details", None), "reasoning_tokens", None) or 0,
    }
    
    # Warn if content is still empty despite tokens
    if not text and usage.get("completion_tokens", 0) > 0:
        text = f"[NO CONTENT] Reasoning used {usage.get('reasoning_tokens', 0)} tokens but no output generated. Try increasing --max-tokens."
    
    return text, usage


def _run_config(
    *,
    out_dir: Path,
    config_label: str,
    system_prompt: str,
    student_json_text: str,
    model: str,
    reasoning_effort: Optional[str],
    runs: int,
    max_tokens: Optional[int],
) -> None:
    """
    Run N completions with the same config and generate reports.
    
    Args:
        out_dir: Output directory for this config
        config_label: Label for this configuration
        system_prompt: System prompt text
        student_json_text: Student data
        model: Model identifier
        reasoning_effort: 'low', 'medium', or 'high'
        runs: Number of runs to execute
        max_tokens: Max completion tokens
    """
    raw_texts: List[str] = []
    parsed: List[ParsedOutput] = []
    usages: List[Dict[str, int]] = []
    notes: List[str] = []

    for i in range(runs):
        # Slight delay to avoid rate limits
        if i > 0:
            time.sleep(0.3)
        try:
            text, usage = _call_llm(
                system_prompt,
                student_json_text,
                model=model,
                reasoning_effort=reasoning_effort,
                max_tokens=max_tokens,
            )
        except (APIConnectionError, APIStatusError) as e:
            text = f"ERROR: {e}"
            usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            notes.append(f"Run {i+1} failed: {str(e)}")
        raw_texts.append(text)
        parsed.append(parse_output(text))
        usages.append(usage)

    agreements = compute_agreements(parsed)
    similarities = compute_similarity(parsed)

    write_report(
        out_dir,
        config_label,
        raw_texts,
        parsed,
        agreements,
        similarities,
        prompt_text=system_prompt,
        usages=usages,
        notes=notes,
    )


def main(argv: Optional[Sequence[str]] = None) -> None:
    """
    CLI for GPT-5 prompt evaluation.
    
    Supported experiment: reasoning-sweep (vary reasoning_effort: low/medium/high)
    GPT-5 does NOT support: temperature, top_p, seed, response_format
    """
    p = argparse.ArgumentParser(
        description="GPT-5 Prompt evaluation runner (reasoning_effort only)"
    )
    p.add_argument(
        "--experiment",
        choices=["reasoning-sweep"],
        required=True,
        help="Experiment type: reasoning-sweep"
    )
    p.add_argument(
        "--prompt",
        type=str,
        required=True,
        help="Path to system prompt .md file"
    )
    p.add_argument(
        "--student",
        type=str,
        required=True,
        help="Path to student JSON input"
    )
    p.add_argument("--runs", type=int, default=5, help="Number of runs per config")
    p.add_argument(
        "--max-tokens",
        type=int,
        default=20000,
        help="Max completion tokens (GPT-5 needs high limit for reasoning+output, default: 20000)"
    )
    p.add_argument(
        "--out",
        type=str,
        default="docs/prompt_evals",
        help="Output directory"
    )
    p.add_argument(
        "--model",
        type=str,
        default=None,
        help="Override model name (defaults to client_gpt_5 model)"
    )
    # Reasoning sweep specific
    p.add_argument(
        "--reasoning-efforts",
        type=str,
        nargs="*",
        default=["low", "medium", "high"],
        help="Reasoning effort levels: low, medium, high"
    )
    args = p.parse_args(argv)

    system_prompt_path = Path(args.prompt)
    system_prompt = _load_text(system_prompt_path)
    student_json_text = _read_student_json(Path(args.student))

    client, default_model = client_gpt_5()
    model = args.model or default_model

    base_out = Path(args.out)
    prompt_slug = system_prompt_path.stem

    if args.experiment == "reasoning-sweep":
        for effort in args.reasoning_efforts:
            if effort not in ["low", "medium", "high"]:
                print(f"Warning: skipping invalid reasoning_effort '{effort}'")
                continue
            label = f"reasoning-{effort}"
            out_dir = base_out / "reasoning-sweep" / prompt_slug / label
            _run_config(
                out_dir=out_dir,
                config_label=label,
                system_prompt=system_prompt,
                student_json_text=student_json_text,
                model=model,
                reasoning_effort=effort,
                runs=int(args.runs),
                max_tokens=args.max_tokens,
            )


if __name__ == "__main__":
    main()


