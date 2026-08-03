#!/usr/bin/env python3
"""Pipe-test seo_coach_router.py the way both runtimes call it.

    python hooks/test_router.py

Exits non-zero on the first mismatch so it can gate a release.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile

ROUTER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seo_coach_router.py")

SHOULD_FIRE = [
    "我是 SEO 新手，想學怎麼看 Search Console",
    "我 GA4 打開一堆東西完全看不懂",
    "我的網站流量掉了怎麼辦？",
    "robots.txt 到底要怎麼寫才不會擋到 Google",
    "幫我看一下我的網站有沒有被收錄",
    "canonical 是什麼意思",
    "seo 要怎麼開始學",
    "教我 SEO",
    "learn SEO from scratch",
    "why is my site not ranking on google",
    "關鍵字要怎麼看？我是新手完全不懂",
    "SEO 健檢一下我的網站",
]

SHOULD_NOT_FIRE = [
    "幫我把這個 React component 重構成 hooks",
    "寫一篇關於手沖咖啡的文章",
    "我下個月要去 Seoul 玩，幫我排行程",
    "El museo de arte moderno",
    "把這份 CSV 轉成 JSON",
    "git rebase 衝突怎麼解",
    "幫我改一下這段 Python 的錯誤處理",
    "Seoul 的天氣怎麼樣",
]


def run(payload: dict) -> str:
    proc = subprocess.run(
        [sys.executable, ROUTER],
        input=json.dumps(payload, ensure_ascii=False),
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    assert proc.returncode == 0, f"router exited {proc.returncode}: {proc.stderr}"
    return proc.stdout.strip()


def fired(out: str, event: str) -> bool:
    if not out:
        return False
    data = json.loads(out)
    return data["hookSpecificOutput"]["hookEventName"] == event and bool(
        data["hookSpecificOutput"]["additionalContext"]
    )


def main() -> int:
    failures = []

    for prompt in SHOULD_FIRE:
        out = run({"hook_event_name": "UserPromptSubmit", "prompt": prompt, "cwd": "."})
        if not fired(out, "UserPromptSubmit"):
            failures.append(f"MISS (should fire): {prompt}")

    for prompt in SHOULD_NOT_FIRE:
        out = run({"hook_event_name": "UserPromptSubmit", "prompt": prompt, "cwd": "."})
        if fired(out, "UserPromptSubmit"):
            failures.append(f"FALSE POSITIVE: {prompt}")

    with tempfile.TemporaryDirectory() as plain:
        out = run({"hook_event_name": "SessionStart", "cwd": plain})
        if fired(out, "SessionStart"):
            failures.append("FALSE POSITIVE: SessionStart in a plain folder")

        coaching = os.path.join(plain, "coaching")
        os.mkdir(coaching)
        with open(os.path.join(coaching, "seo-progress.md"), "w", encoding="utf-8") as fh:
            fh.write("# SEO Coach 進度存檔\n")
        out = run({"hook_event_name": "SessionStart", "cwd": coaching})
        if not fired(out, "SessionStart"):
            failures.append("MISS: SessionStart in a folder with seo-progress.md")

    # Malformed / hostile input must never break the prompt.
    for bad in ["", "not json", "{}", '{"hook_event_name":"UserPromptSubmit"}']:
        proc = subprocess.run(
            [sys.executable, ROUTER], input=bad, capture_output=True, text=True, encoding="utf-8"
        )
        if proc.returncode != 0 or proc.stdout.strip():
            failures.append(f"fail-open broken for input {bad!r}: rc={proc.returncode}")

    if failures:
        for line in failures:
            print(f"FAIL: {line}")
        print(f"\n{len(failures)} failure(s)")
        return 1

    total = len(SHOULD_FIRE) + len(SHOULD_NOT_FIRE) + 2 + 4
    print(f"PASS: {total} router cases")
    return 0


if __name__ == "__main__":
    sys.exit(main())
