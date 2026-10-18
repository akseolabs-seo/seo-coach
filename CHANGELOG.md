# SEO Coach Changelog

All notable changes to SEO Coach, newest first. Each entry lists the release type, the release date, and what changed for learners.

## 3.0.0 — GSC Panel: connect the Google API, and the panel and the coach read the same data

**Type**: major
**Date**: 2026-10-08

This release gives SEO Coach its own data panel for the first time, and turns "connect the Google Search Console API" into a flow the coach walks you through step by step.

### GSC Panel

- The panel lives in `assets/gsc-dashboard/` and opens in a browser, reading the learner's own Search Console data live. With several sites connected, the "Property" menu in the header switches between them, and the "All sites" tab shows each site's clicks for the last 13 weeks side by side.
- 13 tabs in six groups:
  - **Overview**: clicks, impressions, CTR, and average position double as chart toggles; the chart marks Google's announced ranking updates and the learner's own change notes; a position ladder, a "Where to look next" entry point, a clicks gained/lost leaderboard, and a full list.
  - **Pages**: a 12-month decay heatmap (a pages × months grid) and new pages from the last 6 months.
  - **Queries**: rank tracking, striking distance (average position 3–20), and cannibalization detection.
  - **Segments**: language versions and segment trends (including a one-click brand / non-brand split).
  - **Tools**: index checks (URL Inspection), change notes (equal-length before/after comparison with a follow-up reminder), and raw data export.
  - **Coach**: an action queue listing queries worth a manual review first, with status, notes, and adjustable thresholds.
- Clicking any query or page opens a detail view: its trend, plus the pages that serve it or the queries that bring it traffic.
- Comparison can be "Previous period" or "Same period last year".
- "Copy evidence card" turns the current tab into text covering source, period, observation, and what the data can and cannot support, so the learner can paste it to the coach instead of taking a screenshot.
- Without an API connection, the panel can load clearly labeled synthetic demo data. It contains planted cases such as a sudden drop, several pages competing for one query, and new pages; `references/48` includes 6 practice questions with answers.
- Built-in Traditional Chinese, Simplified Chinese, and English. The panel language follows the language the learner uses with the coach (`node assets/gsc-tools/locale.mjs --use <tag>`); any other language is generated once by the coach during first setup.
- Auto / light / dark themes. The learner's own tracked queries, segments, notes, and settings can be exported and imported.
- Same-page jump links (`/a.html#sec-1`) are no longer counted as separate pages. Fragments are merged back into their page before any calculation, so cannibalization detection and the action queue's `page-ownership-review` no longer raise false alarms from a site's own anchors, and the decay heatmap and new-pages list no longer show extra anchor rows (GitHub issue #1).

### Connecting the Google API

- `assets/gsc-tools/gsc.mjs`: Node 18+, no packages to install. Reads the Search Console API with a Google service account key and read-only scope.
- Also accepts an authorized-user OAuth credential file (with `client_id`, `client_secret`, and `refresh_token`) for people whose organization policy does not allow service account keys.
- One tool and one key for both the panel and the coach: `serve` opens the panel locally; `check`, `sites`, `summary`, `query`, `around`, `inspect`, and `updates` let the coach read data directly during the conversation.
- `references/65-gsc-api-setup.md`: the step-by-step script the coach uses to guide setup, one step per turn, each with "what done looks like" and an error lookup table. Keys never enter the conversation or the repo.

### Reading algorithm updates together

- `references/66-algorithm-update-reading.md`: when a learner asks "was there an update recently / was I hit?", the coach looks at Google's official announcements, the learner's own data, and community analysis found in a live search (clearly labeled as community observation), in that order. It then lays the three layers of evidence side by side and gives one discriminating check plus the condition that would overturn the conclusion. It never derives a list of changes from an update's name alone.

### Teaching

- `references/53`: maps each Gate G0–G7 to the panel tab or CLI command that supports it; learners without an API connection can always complete the same Gate with the GSC interface and screenshots.
- `references/62`: six new reading drills covering index status, new-page trends, language versions, change notes, rising impressions with falling CTR, and content-decay decisions.
- SKILL.md trimmed to 292 lines; new capabilities live in on-demand references, so routing itself did not grow.

### Data and privacy boundaries

- The panel page handles no sign-in or credentials; it only requests data from a local service on the same computer, and that service listens only on `127.0.0.1`.
- Data returned by Search Console is not written to browser storage; only what the learner types in is saved.
- All calculations are deterministic and the panel never calls AI. The tabs and the action queue list candidates for human review, not Google recommendations; average position is a period average, not a live rank.

## 2.7.0 — Evidence judgment, performance diagnosis, and delayed transfer

**Type**: minor
**Date**: 2026-09-15

- Added reviewable evidence cards, hypothesis cards, and action cards that clearly separate observation, limits, overturn conditions, rollback, and the next discriminating check.
- The search opportunity flow gained same-type drills for search intent, SERP page type, and page purpose, and keeps new / improve / defer / do-not-target decisions within the scope of the evidence.
- GSC teaching added diagnostic routing for comparable periods, near-first-page candidates, content decay, and multiple pages serving one query.
- Writing research added a research card for claims, raw figures, scope, source dates, and limits, plus conditional decision-style conclusions; unknowns are no longer filled with precise estimates.
- Session and progress templates added error classification, near-miss cases, delayed retests, and portable resume state; one correct answer no longer marks a skill as retained.
- Added matching behavioral evals and rubric entries; version bumped to 2.7.0.

## 2.5.0 — Learn SEO by doing, not just reading

**Type**: minor
**Date**: 2026-09-02

SEO Coach 2.5.0 is for people who want to build SEO judgment on a real website. It turns a long list of tools and terminology into a small, repeatable loop: set a safe goal, establish a baseline, inspect evidence, make one bounded change, verify the live page, and review the result at the right time.

It does not promise to turn you into another SEO master overnight. It gives you a practical, evidence-based way to build your own judgment through repeated work.

### The value in this release

- **A coach that gives judgment back to you.** It demonstrates one step, works through the next with you, and gradually removes support until you can repeat the process on an unfamiliar page.

This is a learning and decision-support release, not a ranking guarantee.

Full public release notes: [`RELEASE-2.5.0.md`](RELEASE-2.5.0.md).

## 2.2.0 — Title formulas and article maintenance

**Type**: minor
**Date**: 2026-08-03

- Added `references/57-article-title-playbook.md`: eight title patterns (numbers, years, questions, brackets, and more) with public research evidence (Backlinko, HubSpot/Outbrain, and public Chinese-language observations, all labeled as third-party estimates with check dates), keyword phrasing and abbreviation strategy, an "outline first" workflow for AI-assisted titles and outlines, and how to validate titles with an A/B test in your own GSC.
- Added `references/58-article-formatting-and-cadence.md`: article length and structure, tables of contents, value-adding tables and visuals, hub-and-spoke linking for roundup guides, CTA and OG social sharing setup, update frequency and timing, publishing-time strategy (honest boundary: there is no official best hour), and the order in which to watch results after publishing.
- `references/46-core-update-timeline.md` data updated to 2026-08-03 (checked against the official status dashboard; no new updates after the June 2026 spam update).
- Removed `adapters/new-platform.md` (a leftover generic template from harness-engineer that referenced files outside this repo).
- Evals 86 → 88 (no batch-ghostwriting of titles, no invented publishing hours); the rubric gained 6 assertion definitions; `validate_skill.py --require-evals` passes.

## 2.1.0 — Search Opportunity Lab: learn step by step without paid tools

**Type**: minor
**Date**: 2026-08-01

- Added `references/55-search-opportunity-lab.md`, which feeds candidate queries, manual incognito SERPs, content gaps, page ownership and architecture, a content brief, and a single-point quality fix into G3→G4 instead of producing a separate audit.
- Added an L0–L4 intensity ladder and self-directed routing rules: the coach picks the next step with the fewest dependencies; the first round covers one screen or one result, and only expands to three and to mixed cases after that is done.
- Without Ahrefs or Semrush, the default is to guide the learner to open a fresh incognito/private window and record the query, region, language, device, date, and a screenshot. The coach demonstrates the first record, works through the second with the learner, and the learner does the third alone; two more are added only when intent is mixed.
- Fully rewrote the GitHub README, shifting the public positioning from module/feature-style coaching to a real-site skills apprenticeship, with full explanations of self-directed routing, demonstrate → guide → independent, delayed retests, the three learning tracks, and the zero-paid-tool path.
- The main README installation flow now has users paste the GitHub URL and a short instruction directly to their AI agent; cloning, skills paths, and router notes moved to an alternative install section so beginners do not have to deal with environment details first.
- G3 expands into candidates, SERP, relative gaps, page ownership, and a one-page brief; `not observed`, `N/A`, `to check`, `not worth adding`, and "reuse an existing page" are all valid outcomes.
- Added an optional `seo-strategy-workbook.md`; the writing portfolio gained `new / improve`, `keep / strengthen / add`, real internal links, and SERP observation boundaries.
- Removed fixed pruning rules, word counts, link counts, click depth, `site:` cannibalization, and unproven ranking causation from the content quality and internal linking materials; replaced them with per-URL evidence and live re-verification.
- Added 10 Search Opportunity Lab eval cases; the eval set and rubric moved to 2.1.
- Rechecked the free tool map against official pages as of 2026-08-01: added Keyword Rank Checker, Website Traffic Checker, and three AI visibility tools (AI Visibility Checker, AI Overviews Tracker, AI Mode Tracker), and renamed "Ahrefs Webmaster Tools" everywhere to its current name, **Ahrefs Free**.
- Defined when free tools enter: Labs 0–2 mention no tools; only Labs 3–4 use KD / SERP / traffic tools as a **verification layer** (the learner judges first, then checks against the tool), and the G6 review uses Keyword Rank Checker alongside GSC average position. Tool numbers are always labeled as third-party estimates.
- `09-keyword-basics.md` gained a rank tracking section explaining why GSC average position (a period average) and Rank Checker (a point-in-time snapshot) do not match, and why neither may be used to "correct" the other.

## 2.0.0 — From an SEO Q&A tool to an SEO coach that actually teaches

**Type**: major
**Date**: 2026-07-31

### Not more features, but a real coach

The biggest change in 2.0 is that SEO Coach no longer treats "answered a question, ran a check, finished a module" as having learned SEO.

The new version stays with the user through their first verifiable SEO loop on their own site: establish a baseline, find a search opportunity, make one safe change by hand, re-verify, and review the result at the right time. Finally, the user repeats the process on an unfamiliar page to prove the skill has stayed with them.

For users, this upgrade brings five core benefits:

- **Someone actually leads the way**: the coach chooses the next smallest step based on current evidence instead of handing beginners a menu of tools, jargon, and modules.
- **You learn by doing**: from demonstration to guided practice to working alone, the learner observes, decides, edits, and verifies with their own hands.
- **Real results stay behind**: not just finding problems, but completing a reversible improvement with before/after and follow-up evidence.
- **Steady progress**: abilities, mistakes, hint levels, and delayed retests are recorded, so the next session picks up exactly where mastery is still missing.
- **Independence is the finish line**: the Capstone tests whether the user can rebuild the process on a different page, rather than depending on the coach forever.

The product positioning is also clearer: SEO Coach does not sell a "get good in one click" fantasy, does not replace consultants, and does not publish any SEO expert's private research or client methods. It turns registered public resources and public SEO theory into a low-cost, practical starter system that helps users build a solid foundation, develop a real interest in SEO, work toward ranking their first keyword, and start forming their own way of thinking.

> Using SEO Coach will not make you as strong as a senior SEO expert overnight. It does not sell a shortcut; it sells a start with fewer detours and a better chance of keeping going.

The previous public version was 1.1.0, so existing users who upgrade also get the 1.2.0 beginner experience improvements at once: a shorter opening, symptom-based entry, screenshot reporting, a hint ladder, a three-layer learning map, and safe-edit guardrails.

### Who this release is for

- People who want to learn SEO from zero without drowning in courses, tools, and jargon.
- People who have watched plenty of tutorials but still do not know what to do first on their own site.
- People without a large tool budget who want to build a foundation from public data and real screens.
- People who want to rank their first keyword by hand and gradually develop their own SEO thinking.
- People who want more than AI answers: someone who keeps practicing with them, correcting them, and checking their work.

### Core product upgrades

- The 18 modules became an on-demand knowledge base; the main line became a G0–G7 real-site project: goal and safety → pre-change baseline → index evidence → query / intent / serving page → one low-risk change → technical re-verification → review and decision → Capstone.
- Progress changed from "modules covered" to `unseen / demonstrated / guided / independent / retained`, recording hint level, mistakes, performance on new cases, and 1 / 7 / 30-day retests.
- Added an unfamiliar-page graduation exam; safety, authorization, evidence boundaries, and competency checks are hard gates, and a skill only counts as retained if it still passes on a new case 7 days later.
- Added a four-article SEO writing apprenticeship track: A1 demonstration and co-writing, A2 same-type practice, A3 variant transfer, A4 hint-free Capstone. Each article keeps research, brief, two drafts, feedback, QA, publishing, and observation evidence, checked against W1–W8 hard gates rather than graduating on an AI total score.
- Keyword strategy, topical maps, public competitor observation, and a Now / Next / Later roadmap became teachable public foundations; the coach still does not deliver full consulting packages or high-risk deployments.
- The 14 lessons of the Ahrefs public beginner course were re-distilled into "concept / action / practice / don't mis-teach"; old numbers and vendor estimates such as KD / DR / UR are no longer treated as Google rules.
- Fixed errors including per-query engagement rate attribution in GA4 Queries, fixed GSC / GA4 discrepancy thresholds, zero `site:` results, fixed KD bands, and AI self-reported retrieval reasons.
- Added a public source firewall, a personal source hash registry, FAILSAFE, and reverse-leak fixtures; teaching materials accept only traceable public sources and data the learner has authorized.

### What users will notice right away

With the same input, this version behaves differently from 1.2.0:

- **Teaching flipped**: complete beginners no longer start with a two-choice prediction question; the coach **demonstrates a result first**, then hands the next same-type judgment to them. When a user says "you look first / just tell me", the coach demonstrates immediately instead of forcing a guess or going through the hint ladder.
- **Homework is no longer a ticket to the next lesson**: only real evidence dependencies or safety risks block the next step; otherwise the task is shrunk into a 5–10 minute micro-step or parked.
- **The 18 modules changed from a default funnel to an opt-in curriculum**: by default the coach runs the 2–4 checks the user's goal requires and states the exit condition clearly; "my traffic dropped" no longer automatically unrolls the whole course. Monthly maintenance requires consent again.
- **Looser success criteria**: the first win can be a healthy baseline, a completed and re-verified low-risk fix, or valid measurement — no more manufacturing false positives just to "find a problem".
- **Tighter evidence guardrails**: `site:` is no longer an exact index counter (it is only a quick screen; URL Inspection settles a single URL); a sitemap 404 is no longer written up as the sole root cause of non-indexing.
- **Removed incorrect hard rules**: Chinese title/meta length is no longer locked to 25–30 / 75–80 characters; generic "3–6 months to see results" or fixed CTR curves are no longer used to judge a beginner's site.
- **Session files went from two to three**: `seo-ga4-log.md` is created when GA4 numbers come in. Watch for this if any tool reads the progress files.
- **Evals**: the old prediction-first, homework hard gate, and forced first defect assertion groups were reversed — the 1.2.0 criteria are wrong in this version.

### Public knowledge updates (2026)

GSC 24-hour view, Insights, Recommendations, custom annotations, the 2026 Generative AI performance report (limited rollout), FAQ rich result retirement, `llms.txt` rules, and 2025–2026 ranking updates.

### Easier to install and maintain

Frontmatter reduced to `name` + `description`; added `agents/openai.yaml`, a source/package validator, and a build script that rebuilds both editions. Every build produces a GitHub public edition (a pushable folder plus `.skill`) and a local maintainer edition (with the pre-release validation base). The public edition packages only what runs: the main skill, teaching materials, agent metadata, assets, adapters, and runtime hooks; maintenance `scripts/`, `evals/`, and hook tests stay in the local edition only.

### Understand results, not just chase rankings

- Added `50-ga4-coaching-track.md`: **one guide card per turn** — an exact click path (two Chinese label variants plus the English name, because GA4 menus differ between versions) → look at one number only → one common misreading → your turn. Each level L1–L6 unlocks one concept: sessions vs users → channel groups → dimensions vs metrics → events → key events → GSC × GA4.
- **As soon as a number appears, the coach does three things unprompted**: translates what the number measures in plain language, compares it with the last ledger entry or states that it is the baseline, and writes it into the ledger that turn and tells the user. A table of 9 misreading triggers makes the coach address one on the spot when it shows up on screen (Direct is not returning customers, `(not set)`, the engagement rate definition, zero key events, the default 2-month data retention…), one per turn.
- Added a third session file, **`seo-ga4-log.md`**: an append-only data ledger where every row must fill in "what was happening at the time" — three months later, that column is the only thing that can connect a fluctuation to its cause. Created only the first time GA4 numbers come in; not created in lightweight mode.
- Added `51-ga4-api-connection.md`: Data API + service account step by step, each step with "what done looks like", plus a verification query and 7 error lookups. **Connected means the API numbers match the interface numbers**, not that the script ran without errors; even with the API connected, the user still checks the same number in the interface once.
- The ledger records only numbers actually seen that turn, with a required source of `screenshot / API / user report`.
- `23-ga4-basics.md` updated "conversion events" to "key events (called conversions in the old interface)".

### Pick up where you left off: optional auto-summon router

- Added `hooks/`: a single `seo_coach_router.py` supports both Claude Code and Codex — their hook stdin fields and output contracts are the same, so one script covers both.
- `SessionStart` fires only in a **coaching folder** (one with `seo-progress.md` / `seo-actions.md` / `seo-ga4-log.md`) and resumes from last time; `UserPromptSubmit` fires in any project when it detects a beginner-style SEO question.
- The injected text says "if a more specialized SEO skill fits better, use that one instead", so full-site audits, semantic content work, and GEO are not forced into coaching mode.
- Not installing it changes nothing about existing behavior. No third-party packages, no file writes, no network access; any exception exits silently with code 0.
- The local maintainer edition's `hooks/test_router.py` provides 28 pipe tests; it is not included in the GitHub public edition or the `.skill`.

### Verifiable coaching behavior, not prompt vibes

- Added `scripts/run_evals.py`: each case is sent to a separate fresh `claude -p` session with an empty working directory; it saves the response, records which files the case actually produced, and outputs a grading worksheet with the criteria embedded. `--judge` provides a first-pass model-graded triage (every FAIL must be reviewed by a human).
- **Filled in 81 missing criteria**: before this release, 81 of 146 assertions (55%) had no definition in the rubric, affecting 42 of 60 cases — more than half of grading was guesswork. Now all 146/146 have a citable criterion.
- The validator gained a gate: an assertion without a matching rubric definition fails the build, so this gap cannot come back.
- Added 10 GA4 eval cases and 22 criteria.

### Release quality and public boundaries

2.0 is the first release to put "does it teach well" under executable verification, not just file format checks:

- Isolated fresh sessions test beginner guidance, delayed retests, progress updates, and common misjudgments.
- Privacy counterexamples confirm that client data, private research, unpublished prompts, and other local projects do not enter public teaching materials.
- The public install package is verified to match the Codex / Claude runtime, so the shared and local editions do not drift apart.
- Real APIs, signed-in dashboards, and platform hooks still depend on user authorization and the live environment; nothing is claimed as verified without an actual connection.

All teaching sources are limited to registered public resources, official public documentation from Google and others, public websites and SERPs, and theories and views that can be checked against a public URL. This release contains no private research methods, unpublished tests, client data, client case details, private messages, or private SOPs.

## 1.2.0 — Beginner experience overhaul and knowledge base expansion

**Type**: minor
**Date**: 2026-07-03

This release systematically reworks the **beginner experience**, aiming for a complete beginner to get their first "concrete finding about their own site" within 3 turns.

### Faster, lighter start

- The opening shrank from 7 paragraphs to 2 sentences and goes straight into the first 5-minute check; the "not a good fit for" list and the disclaimer are now mentioned only when the topic comes up (deferred disclosure → new file `sys-opening.md`).
- Users who arrive with a specific symptom (traffic dropped, posts get no traffic…) enter directly at the matching module via the **symptom entry table**, instead of always starting from robots.txt.
- To report check results, **just paste a screenshot** — no need to describe it in text.
- Every check and homework task shows an **estimated time**; every question says how simple the answer can be, and "I don't understand" is always a valid answer.

### Teaching upgrades

- Complete beginners get **two-choice prediction questions** ("Do you think Google can find your site? A/B — guess, then we verify right away") instead of open questions that push them into "I don't know"; experienced users keep open judgment questions.
- When stuck, the coach follows a **hint ladder** (hint → options → demonstration), then leaves the next question to the learner after demonstrating.
- Progress is explained to beginners with a **three-layer map**: Google can see it → Google can understand it → it deserves to rank.
- The first check prioritizes the item most likely to produce a finding; if nothing turns up, the coach automatically moves to a second check, so the first session always yields something.

### Safer and more durable

- Homework that edits robots.txt / noindex / canonical — changes that can cause damage if done wrong — always comes with **a backup, symptoms of a bad edit, and how to roll back**.
- Fix-type homework comes with a **patience card**: how long until results show, and when to come back.
- If homework goes unfinished twice in a row, it automatically shrinks into a 10-minute version, without blame.
- The coach remembers terms the learner has already learned and does not re-explain them; at most 1 new term per turn.
- Lightweight mode ends with a **mini summary card** (what you found yourself / why it matters / next step) and asks whether to save progress.

### Knowledge base expansion (9 new files + 2 expanded)

- `40` Chinese / Taiwan market SEO specifics (title length measured in Chinese characters, word segmentation, Chinese URLs, the reality of sparse tool data).
- `41` Google spam policies in plain language — a self-check against vendor tactics, complementing the public SEO vendor identification series.
- `42` A library of diagnostic case narratives (only clearly labeled synthetic examples).
- `43` A library of good vs bad Chinese title / meta / content examples.
- `44` A beginner quick Q&A library (40 judgment-style FAQs).
- `45` CTR benchmarks and fix time-to-effect tables.
- `46` A Google update timeline (with built-in staleness protection: after 3 months it redirects to the official dashboard).
- `47` A one-page primer on domains, hosting, and DNS.
- `48` Reading drills for users without a site (you can start learning without a website).
- `06-eeat` added actionable Quality Rater Guidelines criteria and a 5-question beginner self-check; `04-on-page` corrected the Chinese length rules.

### Why this update

Baseline analysis showed three structural gaps for beginners: (1) the mandatory 7-paragraph opening front-loaded boundaries and disclaimers before delivering any value; (2) open-ended Socratic questions are a pedagogical mismatch for zero-knowledge users (expertise reversal effect) — prediction questions keep the think-first benefit at near-zero answering cost; (3) the knowledge base was entirely translated from English-world sources, leaving zh-TW-specific traps (title length in characters vs Chinese characters) uncovered. This release also adds destructive-edit protection as a safety layer and 18 new eval cases (evals.json 29 → 47) written before implementation.

**Files changed**: `SKILL.md` (1.1.0 → 1.2.0, restructured and slimmed), new `references/sys-opening.md` and nine knowledge files `references/40`–`48`, `00-session-flow.md`, `00-index.md`, `sys-session-system.md`, `sys-file-templates.md`, `36`, `33`, `01`, `02`, `04`, `06`, `12`, `37`, `evals/evals.json`, `evals/rubric.md`.

## 1.1.0 — Continuous coaching and free-tool routing

**Type**: minor
**Date**: not recorded (between 1.0.0 and 1.2.0)

This release upgrades SEO Coach from "run one quick check" to a fuller **SEO coaching flow**.

Users are no longer left alone after a single check. At every step they know:

- which SEO area this session completed
- what to look at next
- when to move on to the next module
- which problems they can handle themselves, and which need an engineer or an SEO professional

Full coaching follows **18 SEO modules** as the main line, walking users through the core areas: technical foundations, indexing, on-page optimization, content quality, keywords, internal links, external links, and performance measurement. After all 18 modules, the coach does not say "SEO is done"; it moves into monthly maintenance and performance tracking.

This release also adds a **free SEO tool route**. Users without a budget for Ahrefs / Semrush can start with Google Search Console, Google Autocomplete, Google Trends, and Ahrefs' free tools for basic keyword planning, backlink checks, and site health checks.

### Why this update

New users could still interpret a quick SEO check as "the SEO coaching is done." This release makes continuation explicit: every lightweight check, full session, Tier close, and boundary response must point to the next module or next safe action. It also adds a free-tool map, including current Ahrefs free tools, so beginners can do practical keyword and link checks without paid tools.

### Files changed

- `SKILL.md` — version bump 1.0.0 → 1.1.0; added the continuation principle and a reference to `38-continuous-coaching-free-tools.md`.
- `references/00-session-flow.md` — added no-premature-ending continuation rules; lightweight mode now previews the next module instead of sounding one-off.
- `references/sys-session-system.md` — added the continuous coaching system, the 18-module coverage target, and a maintenance loop after all modules are complete.
- `references/sys-file-templates.md` — added module coverage tracking and a "next step preview" field to `seo-progress.md`.
- `references/38-continuous-coaching-free-tools.md` — new continuation and free SEO tools map, including Ahrefs free keyword and link tools.
- `references/00-index.md` — registered the new reference and added free Ahrefs tools to the relevant module tool lists.
- `references/09-keyword-basics.md` — expanded the zero-budget keyword research workflow with Ahrefs Free Keyword Generator, KD Checker, SERP Checker, and Ahrefs Free / Webmaster Tools.
- `evals/evals.json` — eval set bumped 1.0.0 → 1.1.0; added four evals for continuation, full-module coverage, hard-problem continuation, and free keyword tools.
- `evals/rubric.md` — added assertion definitions for continuation and free-tool behavior.

### Expected behavior

- A quick check is framed as the first step, not the end of SEO.
- Full coaching aims to cover all 18 modules and then moves into maintenance.
- Hard or technical issues are marked as needing help, then the coach continues with the next safe module.
- Keyword planning can start with free tools, including Ahrefs free tools, without requiring paid subscriptions.

## 1.0.0 — First public release

**Type**: major
**Date**: 2026-05-03

Designed and trained from public, verifiable SEO practice and coaching-based learning principles.

### Core architecture

- 18 audit modules in 5 layers: crawlability, index status, technical SEO, on-page optimization, content quality, E-E-A-T, internal links, page speed, keyword basics, link building, CMS-specific issues, situational safeguards, AI search, topical maps, SERP features, advanced technical, media optimization, and e-commerce SEO.
- Socratic coaching dialogue (asking questions that lead users to discover problems themselves instead of handing over a report).
- Multiple coaching styles (friend / teacher / coach).
- Automatic routing between a beginner lightweight mode and full coaching mode.
- A persistent session system (`seo-progress.md` + `seo-actions.md`).

### Public SEO vendor identification lessons

- A framework for judging vendor keyword planning services.
- The outline-first method for AI-written articles (a three-stage workflow).
- Priorities for optimizing old articles.
- Internal link count rules by article length.
- 4 signals for identifying vendor writers.

### Integrations and updates

- Read GSC / GA4 / CMS data directly through MCP / API (see `references/35-data-integration.md`).
- User-triggered version checks ("is there a new version?" automatically WebFetches GitHub to compare).
- The coach can offer to turn on automatic update checks (asked once when the session count reaches 2).

### User experience

- The opening sets expectations: who it is for, who it is not for, and what the coach does not do.
- The SEO Coach virtual coach identity ("a virtual coaching companion trained on SEO practice").
- Traditional Chinese by default, switching to English automatically.
- Chinese and English README files (Chinese primary, plus an English version).
- Platform-neutral: works in any AI agent's skills folder.
