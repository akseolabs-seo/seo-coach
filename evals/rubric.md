# SEO Coach Eval Rubric

How to judge whether an agent response passes a given eval case in `evals.json`.

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
4. **Coaching posture is not questioning theater.** A beginner response should make one evidence-bounded observation, then transfer a similar judgment to the user. Concept questions answer directly. A one-shot full audit still fails coaching cases.
5. **Language follows user.** Default response language is Traditional Chinese; if the user prompts in English, the response must continue in English.

---

## Common assertion patterns

| Pattern | What counts as PASS |
|---------|---------------------|
| `safe-observation-before-question` | Response gives one safe public observation and its evidence limit before asking one small question |
| `no-info-dump` | ≤ 4 paragraphs, ≤ 1 core concept introduced |
| `coaching-not-consulting` | No full audit list, no roadmap, no strategy bullet dump |
| `uses-traditional-chinese` | Response is in Traditional Chinese (not Simplified, not English) |
| `does-not-freeze` | Response continues coaching flow even when WebFetch / read fails |
| `no-hard-block` | Skill never refuses to start merely because the folder is non-empty |
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
| `screenshot-invited` | Reporting method explicitly includes pasting a screenshot instead of describing in text |
| `worked-example-before-question` | A zero-knowledge user sees one evidence-bounded demonstration before judging a similar item |
| `direct-help-respected` | When the user says 你先看／直接告訴我, the response demonstrates immediately instead of forcing a guess |
| `site-is-only-a-quick-check` | `site:` is treated as a presence check, never a precise index count |
| `homework-is-not-a-gate` | Incomplete homework blocks only a truly dependent or unsafe next step, not all learning |
| `open-question-for-experienced` | Question to an experienced user stays open-ended and analysis-oriented; no downgrade to binary guessing games |
| `hint-ladder` | Rescue proceeds 暗示 → 選項 → 示範, never straight to the full answer; the turn still ends with something for the user to do |
| `backup-before-destructive-edit` | Homework touching robots.txt / noindex / canonical / redirect / .htaccess includes backup step + failure symptom + restore path |
| `time-budget-stated` | Check instruction or homework includes an estimated time in minutes |
| `answer-shape-prestated` | Question states how simple the reply can be (A/B, one number, screenshot), and 看不懂 is explicitly a legal answer |
| `mini-summary-card` | Lightweight-mode close contains the 3-line card (user's own specific finding / why it matters / one next step) plus a save-progress invitation |
| `three-layer-language` | Progress framed to novices as 看得到 / 看得懂 / 值得排前面 layers, not Tier/Module numbers |
| `patience-card` | Fix-type homework includes expected time-to-effect and a concrete come-back-if condition |
| `gentle-correction` | Misreport correction normalizes the mistake without shaming and uses the gap as the teaching moment |
| `save-invitation` | Response offers to persist progress (upgrade to full coaching) and does not write files before consent |
| `boundary-stated-on-touch` | Out-of-scope boundary is disclosed at the moment the topic is touched, not front-loaded in the opening |
| `one-pointing-card` | GA4 answer stays on the asked question as a single card; no tour of the interface, no second and third report bundled in |
| `exact-click-path` | GA4 navigation is given click by click (menu → submenu → report → which selector to change), with a fallback for label drift |
| `names-one-metric` | Response names the single number to read and explicitly tells the user to ignore the rest of the screen |
| `names-one-misreading` | Response includes exactly one concrete GA4 misreading guard relevant to the card (session vs user, Direct, `(not set)`, engagement definition, processing delay) |
| `api-gated-on-need` | API/MCP setup is deferred until a stated trigger (repeat screenshots, cross-month comparison, recurring report); never used as an entry requirement |
| `explains-measurement-difference` | GA4/GSC discrepancy is explained by what each tool counts, without declaring one of them broken |
| `no-false-defect` | Response does not assert a broken installation, tracking failure, or penalty that current evidence does not support |
| `gives-a-threshold-not-a-verdict` | Response gives a relative threshold for when a gap or drop is worth investigating, instead of judging from one number |
| `api-does-not-replace-learning` | After the coach can read data directly, the user is still routed to see the same number once in the tool's own interface |
| `proactive-translation` | When a GA4 number appears, the response says in plain language what that number actually counts, without the user having asked |
| `proactive-misreading-callout` | The response volunteers one misreading guard triggered by what is visible on screen; one per turn, not the whole list |
| `logs-ga4-number` | The number is written to `seo-ga4-log.md` in the same turn (baseline marked if first), and the user is told it was recorded |
| `logs-only-observed` | Only numbers actually observed this turn are logged; source is labelled 截圖／API／用戶口述, and missing data is requested rather than filled in |

---

## Case-specific assertions

Every assertion name used in `evals.json` must appear here or in the table above. A name with no definition is judged from taste, not spec — that is the failure this section exists to prevent. Adding an assertion to a case without adding its row here fails source validation.

### Opening, mode selection, and first turn

| Pattern | What counts as PASS |
|---------|---------------------|
| `opening-max-three-paragraphs` | Everything before the first concrete check fits in ≤ 3 short paragraphs |
| `no-disclaimer-upfront` | No 不保證排名 / 業界變化快 / 結果因人而異 disclaimer appears before the user has received a finding |
| `no-unsuitable-list-upfront` | No 不適合／不會做 scope list appears in the opening; boundaries wait until a topic touches them |
| `first-check-in-first-turn` | The first turn already names one concrete check the user can run on their own site |
| `lightweight-first` | A first URL or first contact defaults to lightweight mode, not full onboarding |
| `no-full-onboarding-upfront` | The 6-8 week pace explanation and the 4-style question are both absent from the opening |
| `no-style-selection-upfront` | The response does not ask the user to pick one of the four coaching styles |
| `no-storage-upfront` | The response does not open by announcing that tracking files will be created |
| `no-files-without-consent` | No progress/action file is written before the user agrees to save |
| `no-onboarding-flow` | A pure concept question triggers no platform / GSC / folder questions |
| `offers-upgrade-later` | Full coaching is offered *after* the quick look delivers something, never as a precondition |
| `gives-one-finding` | The turn produces one focus area or one practical first check — not a list of candidates |
| `keeps-to-one-next-step` | Output ends on a single practical next step |
| `mentions-tracking-files` | Before creating files in a non-empty folder, the response says which two files will be added |
| `suggests-but-not-blocks` | A dedicated folder may be suggested for next time, but the session continues regardless |
| `continues-onboarding` | The response proceeds into first-time setup instead of stalling on the folder state |
| `does-not-hard-block` | Any advisory (cooldown, folder, homework) yields to the user if they insist |

### Return visits and session files

| Pattern | What counts as PASS |
|---------|---------------------|
| `warm-welcome` | A long-absent user is welcomed before any homework is mentioned |
| `no-guilt-trip` | Absence or unfinished work is never framed as the user's failing |
| `soft-homework-mention` | Homework appears as a conversation opener, not a gate on continuing |
| `asks-homework-first` | The outstanding homework is raised before moving to the next module |
| `no-re-onboarding` | Platform, style, and pacing already stored in `seo-progress.md` are not asked again |
| `shows-progress-map` | The Tier progress map (✅🔄⬜) is displayed |
| `mentions-progress-location` | The response names the prior or next module recorded in `seo-progress.md` |
| `mentions-completed-fix` | A `[x]` item in `seo-actions.md` is acknowledged as done |
| `mentions-outstanding-action` | A still-open `[ ]` item in `seo-actions.md` is raised |
| `asks-about-fixes` | The response asks about the Tier action items recorded in `seo-actions.md` |
| `gentle-reminder` | A same-day return gets a soft reminder that a session already happened today |
| `suggests-homework` | The alternative offered on a same-day return is homework or fixes, not a new module |
| `respects-user-choice` | The session continues when the user insists, with no hard block |
| `milestone-message` | The session-5 milestone message is delivered |
| `brief-not-excessive` | The milestone is one sentence; no extended celebration |
| `continues-normally` | Coaching flow resumes in the same turn after the milestone, failure, or interruption |

### Teaching method

| Pattern | What counts as PASS |
|---------|---------------------|
| `no-blank-guessing-tax` | A complete novice receives an observation before being asked to predict anything |
| `no-forced-prediction` | No guess is demanded as the price of getting help |
| `transfer-after-demo` | After demonstrating, the response hands one similar judgment back to the user |
| `hint-before-answer` | Rescue narrows the question (hint or options) before revealing the full interpretation |
| `interaction-preserved` | The turn ends with something for the user to do or answer |
| `brief-rescue-observation` | The rescue gives one short observation or frame, then re-asks — it does not switch to lecturing |
| `easier-followup-question` | The follow-up question is smaller and easier than the one the user got stuck on |
| `depth-matches-maturity` | An experienced user gets judgment and verification talk, not beginner analogies |
| `direct-answer` | A concept or how-to question is answered in plain language, first |
| `direct-definition` | The asked-about term is defined directly rather than turned back on the user |
| `no-onboarding-or-counterquestion` | A concept question is not converted into onboarding or a counter-question |
| `does-not-turn-into-lecture` | The response stays on the one asked item; no full tool tour or audit checklist |
| `one-new-term-with-plain-definition` | At most one new term is introduced, with a one-sentence plain definition |
| `known-term-not-retaught` | A term marked learned in `seo-progress.md` is used directly, not re-explained |
| `dont-understand-is-legal` | 看不懂／不確定 is explicitly named as an acceptable answer |
| `no-module-numbers-to-novice` | Tier N / Module N numbers do not appear in novice-facing text |
| `invites-audit` | After answering a standalone question, the response lightly invites the user's own site |

### Homework, safety, and pacing

| Pattern | What counts as PASS |
|---------|---------------------|
| `backup-step-included` | The homework starts by copying or screenshotting the current file |
| `failure-symptom-described` | The response says what a wrong edit would look like (e.g. pages dropping out of the index) |
| `restore-path-given` | The response says how to revert |
| `downscaled-homework` | The replacement homework is visibly smaller (≤ 10 minutes) than the original |
| `normalizing-tone` | Unfinished homework is normalized without lecturing or guilt |
| `no-hard-homework-gate` | Learning continues on an independent path when the unfinished task is not a real dependency |
| `no-instant-result-implied` | A fix is never presented as producing immediate ranking or traffic change |
| `exit-condition-stated` | The response says when this learning goal can be considered complete |
| `goal-specific-path` | The path built is tied to the user's stated outcome, not a generic curriculum |
| `no-course-funnel` | The full 18-module curriculum is not imposed on a goal-specific request |
| `backfill-promised` | Entering from a symptom, the response says the technical basics will still be checked later |
| `entry-matches-symptom` | The first check targets the layer the symptom implicates, not the default Tier 1 opener |

### Evidence and claim gates

| Pattern | What counts as PASS |
|---------|---------------------|
| `evidence-limit-stated` | The response says what the observed result does and does not prove |
| `healthy-baseline-counts` | A healthy result is recorded as a legitimate outcome; no defect is manufactured |
| `finding-is-specific` | The summary cites the user's actual observed finding, not a generic SEO statement |
| `no-unobserved-live-claim` | No number or live behaviour is reported that was not actually retrieved this turn |
| `live-claim-requires-tool-evidence` | Any "I checked" claim is backed by a tool result in this same turn |
| `no-expected-behavior-as-fact` | Typical or default behaviour is never presented as the observed state of this site |
| `webfetch-verification-attempted` | A user-reported fetchable item is silently re-checked against the live URL |
| `difference-used-as-teaching` | A gap between the user's report and reality becomes the teaching moment, not a correction slap |
| `no-single-cause-overclaim` | One signal is not asserted as the sole cause of an indexing or ranking outcome |
| `one-discriminating-check` | The proposed check actually separates the competing explanations named |
| `explains-limitation` | The response states plainly that it could not fetch the site |
| `gives-manual-steps` | On fetch failure, concrete manual steps replace the automated check |

### Boundaries and domain facts

| Pattern | What counts as PASS |
|---------|---------------------|
| `not-a-rejection-tone` | A boundary still leaves one usable path — a coached next step or a referral |
| `gsc-decision-path` | Single-URL and site-wide questions are routed to their respective Search Console reports |
| `mentions-generative-ai-report` | The dedicated generative-AI performance report is described as existing |
| `rollout-boundary` | Availability is described as a limited rollout, not as present on every property |
| `faq-rich-result-retired` | No FAQ rich result is promised |
| `reader-value-preserved` | Useful FAQ content is distinguished from the obsolete search-appearance expectation |
| `no-fixed-character-limit` | A universal character limit is rejected; display is explained as device- and query-dependent |

---

## Running an eval pass

Automated: `python scripts/run_evals.py` (see `--help`). It sends each case to a fresh
`claude -p` session that loads the skill, saves every response under `evals/runs/`, and
writes a judging worksheet with each assertion's rubric definition inlined.
`--judge` adds a model-judged first pass — treat it as a triage signal and spot-check
the FAILs by hand; it is not a substitute for reading the response.

Manual (or when the CLI is unavailable):

1. For each case in `evals.json`, send the `prompt` (with `context` set up if specified) to a fresh session that loads SKILL.md.
2. Capture the full response.
3. Walk each assertion in order, mark PASS / FAIL with a 1-line justification.
4. Record case-level pass only if all assertions PASS.
5. Aggregate: report `passed / total` and list every failing case with which assertion failed.

---

## When the rubric and the spec disagree

If a rubric line conflicts with current SKILL.md behavior, **fix the rubric**, not the spec. The rubric is a derivative; SKILL.md is the source of truth. Note the drift in `CHANGELOG.md`.

If an eval case itself conflicts with current SKILL.md behavior, that is a finding — fix one of the two before running the eval.

---

## Versioning

This rubric is versioned alongside the skill. When SKILL.md bumps a major version (e.g. 1.x → 2.x), re-walk every assertion in this file and confirm it still matches the spec.

Rubric version: **2.0** (matches SKILL.md 2.0.0 — GA4 coaching track, proactive logging, auto-summon router, full assertion coverage)
