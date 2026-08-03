#!/usr/bin/env python3
"""Deterministic structural checks for seo-coach and its runtime package."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path, PurePosixPath


RUNTIME_DIRS = {"agents", "references", "assets", "adapters", "hooks"}
RUNTIME_ROOT_FILES = {"SKILL.md", "FAILSAFE.md"}
PUBLIC_RUNTIME_EXCLUDES = {"hooks/test_router.py"}
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
    "public-source-privacy-firewall",
    "public-basic-strategy-is-teachable",
    "kd-is-third-party-estimate",
    "ga4-no-query-engagement-attribution",
    "baseline-before-first-change",
    "cta-earned-and-low-frequency",
    "earned-referral-ask",
    "ai-no-introspection-diagnosis",
    "learner-transfer-multiturn",
    "competency-state-diff",
    "writing-a1-coached-not-ghostwritten",
    "writing-hard-gates-not-ai-score",
    "writing-a3-requires-variation",
    "writing-a4-unprompted-capstone",
    "writing-portfolio-state-diff",
    "writing-public-basics-firewall",
}


def runtime_files(skill_dir: Path) -> dict[str, bytes]:
    files: dict[str, bytes] = {
        name: (skill_dir / name).read_bytes()
        for name in sorted(RUNTIME_ROOT_FILES)
        if (skill_dir / name).is_file()
    }
    for dirname in sorted(RUNTIME_DIRS):
        root = skill_dir / dirname
        if not root.exists():
            continue
        for path in sorted(p for p in root.rglob("*") if p.is_file()):
            rel = path.relative_to(skill_dir).as_posix()
            if (
                "__pycache__/" in rel
                or rel.endswith(".pyc")
                or rel in PUBLIC_RUNTIME_EXCLUDES
            ):
                continue
            files[rel] = path.read_bytes()
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
    for required in (
        "FAILSAFE.md",
        "references/52-public-source-policy.md",
        "references/53-zero-to-first-result-apprenticeship.md",
        "references/54-four-article-writing-apprenticeship.md",
    ):
        if not (skill_dir / required).is_file():
            errors.append(f"required 2.0 runtime file is missing: {required}")

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
        "references/13-ai-search.md": [
            "目前不要期待有完整獨立的 AI Overview 報表",
            "AI 通常會很誠實地告訴你",
        ],
        "references/09-keyword-basics.md": [
            "新網站建議從 KD < 30",
            "有一定權威的網站可以挑戰 KD 30-60",
        ],
        "references/48-practice-reading-drills.md": ["收錄數 0 = Google 根本不認識它"],
        "references/50-ga4-coaching-track.md": [
            "差 10–20% 正常",
            "差 10–20% 是常態",
            "超過 30% 才值得排查",
        ],
        "references/23-ga4-basics.md": [
            "不一致比例通常在 10-20%",
            "超過 30% 才需要排查",
        ],
        "references/12-scenarios.md": [
            "Google 正在收集的行為資料會被你一改全歸零",
            "它偶爾會把你的新頁暫時抬上去",
        ],
        "references/34-darkseoking-threads.md": [
            "完整 SYSTEM_INSTRUCTION",
            "App SYSTEM_INSTRUCTION",
            "AK 提供原文",
            "AK 提供的 prompt / repo",
        ],
        "references/42-case-library.md": ["待 AK 填入真實案例", "AK 提供真實案例"],
        "references/44-beginner-faq.md": ["Threads 留言/私訊"],
    }
    for rel, stale_phrases in checks.items():
        body = (skill_dir / rel).read_text(encoding="utf-8")
        for phrase in stale_phrases:
            if phrase in body:
                errors.append(f"stale claim remains in {rel}: {phrase}")

    all_runtime = runtime_files(skill_dir)
    joined = "\n".join(
        data.decode("utf-8", errors="ignore")
        for rel, data in all_runtime.items()
        if rel == "SKILL.md" or rel.startswith("references/")
    )
    for pattern, label in (
        (r"(?i)\bD:\\SEO\\", "private D:\\SEO path"),
        (r"(?i)\bC:\\Users\\USER\\", "real local user path"),
        (r"(?i)(?:api[_-]?key|password|secret|token)\s*[:=]\s*[A-Za-z0-9_./+-]{12,}", "possible credential"),
        (r"(?i)[A-Z0-9._%+-]+@(?!example\.com\b)(?!.*gserviceaccount\.com\b)[A-Z0-9.-]+\.[A-Z]{2,}", "non-placeholder email"),
    ):
        if re.search(pattern, joined):
            errors.append(f"privacy firewall found {label}")

    knowledge_text = "\n".join(
        path.read_text(encoding="utf-8", errors="ignore")
        for path in (skill_dir / "references").glob("*.md")
        if path.name not in {
            "00-boundaries.md",
            "42-case-library.md",
            "44-beginner-faq.md",
            "52-public-source-policy.md",
        }
    )
    for pattern, label in (
        (r"完整\s+SYSTEM_INSTRUCTION", "a reproduced private system instruction"),
        (r"AK\s*提供原文", "AK-provided private source text"),
        (r"AK\s*提供的\s*prompt", "AK-provided private prompt"),
        (r"待\s*AK\s*填入真實案例", "future private client-case ingestion"),
    ):
        if re.search(pattern, knowledge_text, re.I):
            errors.append(f"privacy firewall found {label}")

    for pattern, label in (
        (r"\bKoray\b|Tuğberk|HolisticSEO", "named deep semantic framework source"),
        (r"seo-content-master", "cross-skill semantic dependency"),
        (r"Page Semantic Contract|Semantic Content Network", "deep semantic contract"),
        (r"Source Context|Central Entity|Central Search Intent", "deep semantic source model"),
        (r"\bEAV\b|Entity Role Ledger|Proposition Ledger", "deep entity-proposition model"),
        (r"Cost[- ]of[- ]Retrieval|Task Equivalence|Query Allocation Granularity", "deep retrieval framework"),
        (r"Information Gain|retrieval readiness|Visual Semantics", "advanced semantic evaluation model"),
        (r"candidate testing|representative document|augmented quer(?:y|ies)|passage targets?", "advanced retrieval or ranking model"),
        (r"\bK2\b|contentEffort|Pixels.?Letters.?Bytes", "specialized semantic signature"),
    ):
        if re.search(pattern, knowledge_text, re.I):
            errors.append(f"public beginner boundary found {label}")

    source_registry = skill_dir / "references" / "public-personal-sources.json"
    if not source_registry.is_file():
        errors.append("public personal-source hash registry is missing")
    else:
        try:
            registry = json.loads(source_registry.read_text(encoding="utf-8"))
            for rel, expected_hash in registry.get("file_sha256", {}).items():
                path = skill_dir / PurePosixPath(rel)
                actual_hash = hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else ""
                if actual_hash != expected_hash:
                    errors.append(f"public personal-source hash drift: {rel}")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"public personal-source registry cannot be parsed: {exc}")
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
