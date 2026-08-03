#!/usr/bin/env python3
"""Deterministic structural checks for seo-coach and its runtime package."""

from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from pathlib import Path, PurePosixPath


RUNTIME_DIRS = {"agents", "references", "scripts", "assets", "adapters", "hooks"}
REQUIRED_EVALS = {
    "direct-help-bypass",
    "site-operator-evidence-guard",
    "sitemap-no-false-causality",
    "goal-path-exit-condition",
    "gsc-2026-ai-report",
    "faq-rich-result-retired",
    "no-unobserved-live-claim",
    "ga4-one-pointing-card",
    "ga4-api-only-when-earned",
    "ga4-gsc-gap-is-not-a-defect",
    "ga4-api-does-not-replace-learning",
    "ga4-proactive-translate-and-log",
    "ga4-log-only-observed-numbers",
}


def runtime_files(skill_dir: Path) -> dict[str, bytes]:
    files: dict[str, bytes] = {"SKILL.md": (skill_dir / "SKILL.md").read_bytes()}
    for dirname in sorted(RUNTIME_DIRS):
        root = skill_dir / dirname
        if not root.exists():
            continue
        for path in sorted(p for p in root.rglob("*") if p.is_file()):
            files[path.relative_to(skill_dir).as_posix()] = path.read_bytes()
    return files


def validate_source(skill_dir: Path, require_evals: bool = False) -> list[str]:
    errors: list[str] = []
    skill_file = skill_dir / "SKILL.md"
    if not skill_file.is_file():
        return ["SKILL.md is missing"]

    text = skill_file.read_text(encoding="utf-8")
    match = re.match(r"\A---\s*\n(.*?)\n---\s*\n", text, re.S)
    if not match:
        errors.append("SKILL.md frontmatter is missing or malformed")
    else:
        keys = set(re.findall(r"^([A-Za-z0-9_-]+):", match.group(1), re.M))
        if keys != {"name", "description"}:
            errors.append(f"frontmatter keys must be name + description only; found {sorted(keys)}")
    if "Current version:" not in text:
        errors.append("Current version must appear in SKILL.md body")

    for rel in sorted(set(re.findall(r"`(references/[A-Za-z0-9._/-]+\.md)`", text))):
        if not (skill_dir / PurePosixPath(rel)).is_file():
            errors.append(f"referenced file is missing: {rel}")

    eval_path = skill_dir / "evals" / "evals.json"
    if require_evals and eval_path.is_file():
        try:
            data = json.loads(eval_path.read_text(encoding="utf-8"))
        except Exception as exc:  # noqa: BLE001 - validator should report all parse failures
            errors.append(f"evals.json cannot be parsed: {exc}")
            data = {"evals": []}

        evals = data.get("evals", [])
        ids = [item.get("id") for item in evals]
        if len(ids) != len(set(ids)):
            errors.append("eval IDs must be unique")
        missing = REQUIRED_EVALS - set(ids)
        if missing:
            errors.append(f"required changed-surface evals missing: {sorted(missing)}")
        rubric_path = skill_dir / "evals" / "rubric.md"
        rubric = rubric_path.read_text(encoding="utf-8") if rubric_path.is_file() else ""
        undefined: set[str] = set()
        for item in evals:
            if not item.get("prompt") or not item.get("expected_output"):
                errors.append(f"eval {item.get('id')} lacks prompt or expected_output")
            for assertion in item.get("assertions", []):
                if not assertion.get("name") or not assertion.get("description"):
                    errors.append(f"eval {item.get('id')} has an incomplete assertion")
                elif rubric and f"`{assertion['name']}`" not in rubric:
                    undefined.add(assertion["name"])
        if not rubric:
            errors.append("evals/rubric.md is required for source validation")
        if undefined:
            errors.append(
                "assertions with no rubric definition (judged from taste, not spec): "
                f"{sorted(undefined)}"
            )
    elif require_evals:
        errors.append("evals/evals.json is required for source validation")

    checks = {
        "references/40-chinese-seo-specifics.md": ["25-30 個中文字", "75-80 個中文字"],
        "references/03-technical-seo.md": ["| FAQPage | FAQ 頁面 | 展開問答 |"],
        "references/13-ai-search.md": ["目前不要期待有完整獨立的 AI Overview 報表"],
    }
    for rel, stale_phrases in checks.items():
        body = (skill_dir / rel).read_text(encoding="utf-8")
        for phrase in stale_phrases:
            if phrase in body:
                errors.append(f"stale claim remains in {rel}: {phrase}")
    return errors


def validate_package(skill_dir: Path, package: Path) -> list[str]:
    errors: list[str] = []
    expected = runtime_files(skill_dir)
    prefix = f"{skill_dir.name}/"
    try:
        with zipfile.ZipFile(package) as archive:
            actual = {
                name[len(prefix) :]: archive.read(name)
                for name in archive.namelist()
                if not name.endswith("/") and name.startswith(prefix)
            }
    except Exception as exc:  # noqa: BLE001
        return [f"package cannot be read: {exc}"]

    for rel in sorted(set(expected) - set(actual)):
        errors.append(f"package missing runtime file: {rel}")
    for rel in sorted(set(actual) - set(expected)):
        errors.append(f"package contains non-runtime or stale file: {rel}")
    for rel in sorted(set(expected) & set(actual)):
        if expected[rel] != actual[rel]:
            errors.append(f"package content differs: {rel}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("skill_dir", type=Path)
    parser.add_argument("--package", type=Path)
    parser.add_argument("--require-evals", action="store_true")
    args = parser.parse_args()
    skill_dir = args.skill_dir.resolve()

    errors = validate_source(skill_dir, require_evals=args.require_evals)
    if args.package:
        errors.extend(validate_package(skill_dir, args.package.resolve()))
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print(f"PASS: {skill_dir.name} source validation")
    if args.package:
        print(f"PASS: package parity ({len(runtime_files(skill_dir))} runtime files)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
