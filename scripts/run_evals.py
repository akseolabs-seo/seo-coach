#!/usr/bin/env python3
"""Run the seo-coach eval suite against fresh Claude Code sessions.

Each case is sent to its own `claude -p` process in an empty working directory,
so the skill is exercised the way a real user hits it — no leftover context, no
progress files unless the case asks for them.

    python scripts/run_evals.py                     # every case
    python scripts/run_evals.py --ids ga4-one-pointing-card,quick-question
    python scripts/run_evals.py --filter ga4 --judge
    python scripts/run_evals.py --limit 5 --workers 2

Output lands in evals/runs/<timestamp>/:
    <case-id>.md    the full response
    worksheet.md    every case with its assertions + rubric definitions inlined,
                    ready to mark PASS/FAIL by hand
    results.json    machine-readable, including model verdicts when --judge ran

--judge adds a model-judged first pass. Treat it as triage: read the responses
behind any FAIL before believing it, and spot-check the PASSes. A model judging
its own family's output is a signal, not a verdict.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EVALS = ROOT / "evals" / "evals.json"
RUBRIC = ROOT / "evals" / "rubric.md"
RUNS = ROOT / "evals" / "runs"

PREAMBLE = (
    "先用 Skill 工具載入 seo-coach 技能，然後完全照該技能的行為規則回覆下面這位"
    "使用者的訊息。直接輸出你要給使用者看的回覆，不要輸出任何分析或後設說明。"
)

RESPONSE_TOOLS = "Skill,Read,Glob,Grep,Write,Edit,WebFetch"
JUDGE_TOOLS = "Read"


def load_rubric() -> dict[str, str]:
    text = RUBRIC.read_text(encoding="utf-8")
    return {
        m.group(1): m.group(2).strip()
        for m in re.finditer(r"^\|\s*`([a-z0-9-]+)`\s*\|\s*(.+?)\s*\|\s*$", text, re.M)
    }


def claude(prompt: str, cwd: Path, tools: str, timeout: int) -> str:
    proc = subprocess.run(
        ["claude", "-p", prompt, "--allowedTools", tools],
        cwd=cwd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdin=subprocess.DEVNULL,
        timeout=timeout,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"claude exited {proc.returncode}: {proc.stderr[-500:]}")
    return proc.stdout.strip()


def run_case(case: dict, timeout: int) -> dict:
    parts = [PREAMBLE]
    if case.get("context"):
        parts.append(f"（情境設定，請當成已經發生的事實）：{case['context']}")
    parts.append(f"使用者訊息：\n\n{case['prompt']}")
    prompt = "\n\n".join(parts)

    workdir = Path(tempfile.mkdtemp(prefix=f"eval-{case['id']}-"))
    try:
        response = claude(prompt, workdir, RESPONSE_TOOLS, timeout)
        files = sorted(p.name for p in workdir.iterdir() if p.is_file())
        return {"id": case["id"], "ok": True, "response": response, "files_created": files}
    except Exception as exc:  # noqa: BLE001 - one bad case must not kill the run
        return {"id": case["id"], "ok": False, "response": "", "error": str(exc), "files_created": []}
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


def judge_case(case: dict, result: dict, rubric: dict[str, str], timeout: int) -> dict:
    if not result["ok"]:
        return {}
    lines = [
        f"- `{a['name']}`: {rubric.get(a['name'], a['description'])}" for a in case["assertions"]
    ]
    prompt = (
        "你是 eval 判分者。依照下列判準逐條判斷回應是否 PASS。"
        "判準沒有明說的事情不要自行加碼；引不出證明那一行就算 FAIL。\n\n"
        f"### 這個 case 期望的行為\n{case['expected_output']}\n\n"
        f"### 判準\n" + "\n".join(lines) + "\n\n"
        f"### 待判回應\n{result['response']}\n\n"
        "只輸出 JSON，不要有其他文字："
        '{"verdicts":[{"name":"...","pass":true,"evidence":"引用回應中的一句話"}]}'
    )
    workdir = Path(tempfile.mkdtemp(prefix=f"judge-{case['id']}-"))
    try:
        raw = claude(prompt, workdir, JUDGE_TOOLS, timeout)
        match = re.search(r"\{.*\}", raw, re.S)
        return json.loads(match.group(0)) if match else {"error": "no JSON in judge output"}
    except Exception as exc:  # noqa: BLE001
        return {"error": str(exc)}
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


def write_outputs(outdir: Path, cases: list[dict], results: dict, rubric: dict[str, str]) -> None:
    outdir.mkdir(parents=True, exist_ok=True)
    sheet = ["# Eval worksheet", "", f"Cases: {len(cases)}", ""]

    for case in cases:
        res = results[case["id"]]
        (outdir / f"{case['id']}.md").write_text(
            f"# {case['id']}\n\n## prompt\n\n{case['prompt']}\n\n## response\n\n"
            + (res["response"] or f"(ERROR) {res.get('error', '')}"),
            encoding="utf-8",
        )
        sheet += [f"## {case['id']} — {case.get('name', '')}", ""]
        if not res["ok"]:
            sheet += [f"**RUN FAILED**: {res.get('error', '')}", ""]
            continue
        if res["files_created"]:
            sheet.append(f"_files written: {', '.join(res['files_created'])}_\n")
        sheet += ["| ? | assertion | 判準 | verdict |", "|---|---|---|---|"]
        for a in case["assertions"]:
            verdict = ""
            for v in (res.get("judge") or {}).get("verdicts", []):
                if v.get("name") == a["name"]:
                    verdict = "PASS" if v.get("pass") else "**FAIL**"
            sheet.append(
                f"| ☐ | `{a['name']}` | {rubric.get(a['name'], '(no rubric row)')} | {verdict} |"
            )
        sheet += ["", "<details><summary>response</summary>", "", res["response"], "", "</details>", ""]

    (outdir / "worksheet.md").write_text("\n".join(sheet), encoding="utf-8")
    (outdir / "results.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ids", help="comma-separated case ids")
    ap.add_argument("--filter", help="substring match on case id")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--timeout", type=int, default=300, help="seconds per claude call")
    ap.add_argument("--judge", action="store_true", help="add a model-judged first pass")
    args = ap.parse_args()

    if not shutil.which("claude"):
        print("ERROR: `claude` not found on PATH — run the suite manually per rubric.md")
        return 2

    cases = json.loads(EVALS.read_text(encoding="utf-8"))["evals"]
    if args.ids:
        wanted = {i.strip() for i in args.ids.split(",")}
        cases = [c for c in cases if c["id"] in wanted]
    if args.filter:
        cases = [c for c in cases if args.filter in c["id"]]
    if args.limit:
        cases = cases[: args.limit]
    if not cases:
        print("ERROR: no cases matched")
        return 2

    rubric = load_rubric()
    outdir = RUNS / datetime.now().strftime("%Y%m%d-%H%M%S")
    print(f"running {len(cases)} case(s), {args.workers} at a time -> {outdir}")

    results: dict[str, dict] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(run_case, c, args.timeout): c for c in cases}
        for fut in concurrent.futures.as_completed(futures):
            res = fut.result()
            results[res["id"]] = res
            print(f"  {'ok  ' if res['ok'] else 'FAIL'} {res['id']}")

    if args.judge:
        print("judging...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {
                pool.submit(judge_case, c, results[c["id"]], rubric, args.timeout): c for c in cases
            }
            for fut in concurrent.futures.as_completed(futures):
                case = futures[fut]
                results[case["id"]]["judge"] = fut.result()

    write_outputs(outdir, cases, results, rubric)

    ran = sum(1 for r in results.values() if r["ok"])
    print(f"\n{ran}/{len(cases)} case(s) produced a response")
    if args.judge:
        failed = [
            c["id"]
            for c in cases
            if any(not v.get("pass") for v in (results[c["id"]].get("judge") or {}).get("verdicts", []))
        ]
        print(f"model-judged FAIL: {len(failed)}" + (f" -> {', '.join(failed)}" if failed else ""))
        print("verify every FAIL against the saved response before acting on it.")
    print(f"worksheet: {outdir / 'worksheet.md'}")
    return 0 if ran == len(cases) else 1


if __name__ == "__main__":
    sys.exit(main())
