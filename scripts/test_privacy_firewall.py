#!/usr/bin/env python3
"""Prove the validator rejects representative private-material leaks."""

from __future__ import annotations

import shutil
import tempfile
from pathlib import Path

from validate_skill import validate_source


ROOT = Path(__file__).resolve().parent.parent
FIXTURES = {
    "private-path": "\nD:\\SEO\\CLIENT-SECRET\\notes.md\n",
    "private-email": "\nowner-real@private-company.net\n",
    "credential": "\napi_key = ABCDEFGHIJKLMNOPQRSTUVWXYZ123456\n",
    "unpublished-prompt": "\n完整 SYSTEM_INSTRUCTION\nAK 提供原文\n",
    "deep-semantic-framework": "\nPage Semantic Contract\nCentral Entity\n",
}


def main() -> int:
    failures: list[str] = []
    for name, payload in FIXTURES.items():
        with tempfile.TemporaryDirectory(prefix=f"seo-coach-{name}-") as tmp:
            copy = Path(tmp) / "seo-coach"
            shutil.copytree(ROOT, copy, ignore=shutil.ignore_patterns("__pycache__", "runs"))
            target = copy / "references" / "leak-fixture.md"
            target.write_text(payload, encoding="utf-8")
            errors = validate_source(copy, require_evals=True)
            if not errors:
                failures.append(name)
    if failures:
        print(f"FAIL: privacy fixtures escaped: {', '.join(failures)}")
        return 1
    print(f"PASS: {len(FIXTURES)} privacy leak fixtures rejected")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
