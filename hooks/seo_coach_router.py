#!/usr/bin/env python3
"""seo-coach auto-summon router.

One script, two runtimes. Claude Code and Codex send the same hook payload on
stdin and accept the same JSON on stdout, so this file is the single source of
truth for both:

    stdin  {"hook_event_name": "UserPromptSubmit"|"SessionStart",
            "prompt": "...", "cwd": "..."}
    stdout {"hookSpecificOutput": {"hookEventName": "...",
                                   "additionalContext": "..."}}

Behaviour
    SessionStart      fires only inside a coaching folder (seo-progress.md /
                      seo-actions.md / seo-ga4-log.md present) or the skill repo.
    UserPromptSubmit  fires when the prompt looks like beginner-facing SEO
                      coaching, in any project.

Fail-open by design: any unexpected input, missing key, or exception exits 0
with no output. A router that breaks the user's prompt is worse than a router
that misses one.
"""

from __future__ import annotations

import json
import os
import re
import sys

# ---------------------------------------------------------------- triggers

# Bare "seo" needs latin word boundaries or it matches Seoul, Seoud, museo...
SEO = r"(?<![a-z])seo(?![a-z])"

# Coaching intent on its own is enough — these are already SEO-shaped asks that
# a beginner brings.
STRONG = re.compile(
    rf"({SEO}\s*(陪跑|教學|入門|學習|新手|健檢|coach|audit)"
    rf"|學\s*{SEO}|{SEO}\s*怎麼(學|開始|做起)"
    rf"|(帶我|教我).*{SEO}|{SEO}.*(不會|看不懂|不懂)|我是.*{SEO}.*新手"
    r"|robots\.txt|sitemap\.xml|canonical|noindex|core web vitals"
    r"|search console|(?<![a-z])gsc(?![a-z])|(?<![a-z])ga4(?![a-z])|google analytics"
    r"|site:\s*\S|收錄|索引|自然搜尋|自然流量|排名掉|流量掉|流量下降|網站健檢"
    rf"|learn {SEO}|{SEO} for beginners|{SEO} basics|why is my site not ranking)",
    re.I,
)

# Weak SEO context — only fires when paired with a beginner/help signal.
SEO_CTX = re.compile(
    rf"({SEO}|搜尋引擎|google\s*搜尋|關鍵字|關鍵詞|排名|網站流量|meta description"
    r"|title\s*tag|外鏈|反向連結|backlink|structured data|結構化資料"
    r"|my (site|website).*(google|search|rank))",
    re.I,
)
BEGINNER = re.compile(
    r"(新手|入門|初學|不懂|不會|看不懂|怎麼看|怎麼開始|從哪(開始|下手)|第一步"
    r"|教我|帶我|一步一步|逐步|該做什麼|要怎麼辦|幫我檢查|幫我看|健檢|自己做"
    r"|beginner|step by step|walk me through|where do i start|how do i check)",
    re.I,
)

# Files that mark a folder as an active coaching session.
SESSION_FILES = ("seo-progress.md", "seo-actions.md", "seo-ga4-log.md")

CONTEXT = (
    "[seo-coach router] 這是新手向的 SEO 陪跑任務。回答前先用 Skill tool 載入 "
    "seo-coach，並依它的規則走：一輪只教 1 個概念、只推進 1 個檢查、回應 2-4 段；"
    "先取得一項可驗證的證據再下判斷，沒有實際抓取或用戶回報就不要宣稱「我看過」；"
    "不要一次交付完整 audit 報告、roadmap 或競品分析。"
    "GA4 相關問題走指路卡（references/50-ga4-coaching-track.md），一輪一張。"
    "若這個請求其實更適合另一個更專門的 SEO 技能（整站 audit、語意內容、GEO、"
    "本地 SEO 等），改用那一個，不要為了套用本規則而降級服務。"
)

SESSION_CONTEXT = (
    "[seo-coach router] 這個資料夾有 SEO 陪跑的進度檔。開始前先用 Skill tool 載入 "
    "seo-coach，讀取 seo-progress.md（有的話再讀 seo-actions.md、seo-ga4-log.md），"
    "照回訪開場繼續上次的進度，不要當成新用戶重新開場。"
)


def emit(event: str, context: str) -> None:
    json.dump(
        {"hookSpecificOutput": {"hookEventName": event, "additionalContext": context}},
        sys.stdout,
        ensure_ascii=False,
    )


def is_coaching_folder(cwd: str) -> bool:
    if not cwd or not os.path.isdir(cwd):
        return False
    if any(os.path.isfile(os.path.join(cwd, name)) for name in SESSION_FILES):
        return True
    # The skill's own repo / install dir.
    return os.path.isfile(os.path.join(cwd, "SKILL.md")) and os.path.isdir(
        os.path.join(cwd, "references")
    ) and os.path.isfile(os.path.join(cwd, "references", "00-session-flow.md"))


def main() -> int:
    raw = sys.stdin.read()
    if not raw.strip():
        return 0
    payload = json.loads(raw)

    event = payload.get("hook_event_name") or payload.get("hookEventName") or ""

    if event == "SessionStart":
        if is_coaching_folder(payload.get("cwd") or ""):
            emit("SessionStart", SESSION_CONTEXT)
        return 0

    if event == "UserPromptSubmit":
        prompt = payload.get("prompt") or ""
        if not prompt:
            return 0
        if STRONG.search(prompt) or (SEO_CTX.search(prompt) and BEGINNER.search(prompt)):
            emit("UserPromptSubmit", CONTEXT)
        return 0

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:  # noqa: BLE001 - never break the user's prompt
        sys.exit(0)
