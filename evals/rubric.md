# SEO Coach Eval Rubric

How to judge whether a Claude response passes a given eval case in `evals.json`.

---

## Scoring per assertion

Each assertion is scored binary:

- **PASS** — the behaviour described by the assertion is clearly observable in the response
- **FAIL** — the behaviour is missing, partial, or contradicted

A case **passes** only if **all** its assertions PASS. Partial pass is recorded but counts as FAIL for the case total.

---

## Judging principles

1. **Spec, not taste.** Judge against the assertion text + SKILL.md behavior, not whether the response "feels good".
2. **Observable evidence.** If you cannot quote the line that demonstrates the assertion, it is not a PASS.
3. **Don't reward extras.** A response that adds correct extra behavior beyond the assertion still passes; one that *replaces* the asserted behavior with something else fails.
4. **Coaching posture is non-negotiable.** Any response that gives a SEO assessment, full audit, or strategy without first asking the user fails the case regardless of other strengths — this is the skill's core spec (SKILL.md L31).
5. **Language follows user.** Default response language is Traditional Chinese; if the user prompts in English, the response must continue in English.

---

## Common assertion patterns

| Pattern | What counts as PASS |
|---------|---------------------|
| `asks-before-telling` | Response contains a question to the user before any SEO judgment |
| `no-info-dump` | ≤ 4 paragraphs, ≤ 1 core concept introduced |
| `coaching-not-consulting` | No full audit list, no roadmap, no strategy bullet dump |
| `uses-traditional-chinese` | Response is in Traditional Chinese (not Simplified, not English) |
| `does-not-freeze` | Response continues coaching flow even when WebFetch / read fails |
| `no-hard-block` | Skill never refuses to start because folder is non-empty (per SKILL.md L36 + 00-session-flow.md) |
| `mentions-cooldown` | Response references the 3-5 day Tier cooldown recommendation |
| `coach-tone` | Question is short and direct (≤ 1 sentence), no nurturing softeners |
| `gives-one-five-minute-check` | Response gives one concrete beginner action doable without paid tools or setup |
| `no-tool-overload` | First beginner response does not push GSC, GA4, MCP/API, Screaming Frog, or a stack of tools before one basic check |
| `keeps-one-next-step` | Response ends with exactly one practical next step, not a checklist or roadmap |
| `previews-next-module` | Response names the next module, next SEO block, or next check that follows after the current action |
| `no-premature-seo-done` | Response does not imply that one quick check, one module, or one fix means SEO coaching is complete |
| `mentions-18-module-coverage` | Response explains that full coaching covers the full module path / 18 modules / all core SEO blocks |
| `one-step-at-a-time` | Response commits to continuous progress while still keeping the current action limited to one module/check |
| `tracks-next-start` | Response says progress, next module, or next session starting point will be recorded or continued |
| `asks-website-first-routing-question` | When no URL is provided, response asks one routing question focused on whether the user has a website / URL; it does not default to GBP or Google Maps |
| `regular-website-first` | Response treats generic website/ranking/traffic/CMS prompts as regular website SEO unless map/local intent is explicit |
| `uses-index-or-discovery-check` | Response starts with `site:` search, sitemap, robots.txt, URL inspection, homepage access, or another basic discovery/indexing check |
| `does-not-default-to-local` | Response does not make Google Maps, GBP, NAP, reviews, or Local Pack the first route for generic website SEO prompts |
| `checks-important-page-exists` | Response checks whether the target service/product/category/topic has a dedicated page or clear homepage section |
| `checks-title-or-homepage-clarity` | Response asks the user to inspect/paste homepage title, browser tab title, H1, or homepage clarity |
| `plugin-as-tool-not-outcome` | Response explains that SEO plugins help produce settings/output but do not guarantee rankings or completed SEO |
| `does-not-block-on-no-website` | Response still gives a useful next step when the user has no website, usually by explaining the need for a controllable website or landing page |
| `de-escalates-panic` | Response lowers anxiety and avoids catastrophic language before diagnosis |
| `no-perfect-score-chasing` | Response does not imply PageSpeed 100 is required or that a low score alone decides rankings |
| `asks-one-evidence-item` | Response asks for one screenshot, one exact warning, one metric, or one URL only |
| `avoids-penalty-overclaim` | Response does not assume a penalty, ban, or manual action from generic warnings |
| `classifies-before-fixing` | Response says the first step is to identify the type of issue before recommending fixes |
| `maintains-intended-scope` | Response keeps advanced/high-competition requests in coaching/framing mode instead of delivering a consultant roadmap |
| `does-not-apologize-for-boundary` | Response treats scope limits as intentional product boundaries, not as failures |
| `offers-one-safe-next-step` | Response still offers one safe diagnostic or beginner-compatible next step after setting a boundary |
| `refers-professional-when-needed` | Response recommends professional help for full strategic execution or high-risk implementation when appropriate |
| `continues-after-boundary` | Response does not stop at the boundary; it routes the user to the next safe coachable module or check |
| `does-not-provide-full-consultant-roadmap` | Response avoids delivering detailed consultant-grade implementation plans for high-risk technical/strategy issues |
| `uses-free-keyword-tools` | Response includes free keyword research tools such as GSC, Google Autocomplete, Google Trends, or equivalent |
| `mentions-ahrefs-free-keyword-tools` | Response mentions Ahrefs free keyword tools such as Free Keyword Generator, KD Checker, SERP Checker, or Ahrefs Free / Webmaster Tools |
| `gives-one-practical-workflow` | Response gives a short actionable workflow rather than a list of tool names only |
| `does-not-overpromise-tool-data` | Response treats free-tool data as directional and avoids ranking guarantees |

---

## Running an eval pass manually

1. For each case in `evals.json`, send the `prompt` (with `context` set up if specified) to a fresh session that loads SKILL.md.
2. Capture the full response.
3. Walk each assertion in order, mark PASS / FAIL with a 1-line justification.
4. Record case-level pass only if all assertions PASS.
5. Aggregate: report `passed / total` and list every failing case with which assertion failed.

---

## When the rubric and the spec disagree

If a rubric line conflicts with current SKILL.md behavior, **fix the rubric**, not the spec. The rubric is a derivative; SKILL.md is the source of truth. Note the drift in `changelog.md`.

If an eval case itself conflicts with current SKILL.md behavior, that is a finding — fix one of the two before running the eval.

---

## Versioning

This rubric is versioned alongside the skill. When SKILL.md bumps a major version (e.g. 1.x → 2.x), re-walk every assertion in this file and confirm it still matches the spec.

Rubric version: **1.1** (matches SKILL.md 1.1.0 — continuous coaching and free-tool routing)
