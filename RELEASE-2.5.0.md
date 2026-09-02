# SEO Coach 2.5.0 — Build Your SEO Judgment

> A beginner-first SEO coach for people who want to make decisions on a real website, not just read another report.

SEO Coach 2.5.0 turns SEO learning into a repeatable loop: define a safe goal, establish a baseline, inspect real evidence, make one bounded change, verify the live result, and learn from what happened next.

It does not promise to turn you into another SEO master overnight. It gives you a clear way to build your own evidence-based judgment through practice.

## What you get

- A coach that demonstrates one useful step, works through the next with you, and gradually hands the judgment back to you.
- A practical path from a first website check to search opportunities, page ownership, content gaps, technical validation, and delayed performance review.
- A local GSC panel for clicks, impressions, CTR, average position, ranking buckets, query movement, anomaly signals, CTR opportunities, and human-review rewrite candidates.
- Automatic GSC import when an existing host connector is available. Without a connector, import CSV, TSV, or JSON locally.
- One dashboard template in Traditional Chinese, Simplified Chinese, English, Japanese, and Korean. The first visit follows the browser language, while later choices remain local.
- A privacy-preserving runtime: no panel credentials, no direct panel network channel, no Codex CLI, no AI-generated rewrite, and no automatic publishing.

## Why this release matters

Most SEO tools show you more numbers. SEO Coach helps you build the judgment behind the numbers: what to inspect first, what the evidence can actually support, what remains unknown, and which small action is safe enough to verify.

The GSC panel follows the same principle. It does not turn a ranking bucket into a promise or a rule-based candidate into an instruction. It keeps the source range, comparison period, page dimension, and data limits visible so the next decision stays grounded.

## Start here

1. Install the Skill through your AI agent or download the runtime package from GitHub Releases.
2. Say: `Use SEO Coach to teach me SEO on my own website.`
3. When you already have GSC data, open `assets/gsc-dashboard/index.html`. An existing GSC connector is loaded automatically; otherwise import CSV, TSV, or JSON locally.

## The honest boundary

SEO Coach does not guarantee rankings, traffic, indexing, or a particular business outcome. GSC average position is a period aggregate, not a live SERP rank. A rewrite candidate is a prompt for human review—not permission to rewrite a page without checking the current SERP, the existing page, first-party evidence, and the result after the change.

For the complete feature and data contract, see [`references/59-gsc-dashboard.md`](references/59-gsc-dashboard.md). For the full coaching model, see [`README.md`](README.md).
