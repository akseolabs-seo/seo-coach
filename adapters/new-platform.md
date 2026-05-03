# Adapter: [Platform Name]

<!-- adapter: new-platform | version: 1.0.0 | template -->

## Purpose

This is a template for creating a new platform adapter for Harness Engineering.

Fill in this file to translate core harness concepts into your platform's capabilities.
When complete, rename this file to `adapters/[your-platform].md`.

Read the core references first. This template assumes you have read:
- `references/01-core-flow.md`
- `references/02-analyze-classify.md`
- `references/05-execution-modes.md`

---

## Step 0: Platform Inventory

Answer these before filling in the rest. Your answers determine which harness patterns apply.

**Execution environment**
- Where does your agent run? (local machine / cloud / API / other): ___
- Does it have access to the filesystem? (yes / no / limited): ___
- Can it execute shell commands? (yes / no / limited): ___
- Can it make external API or web requests? (yes / no): ___

**Memory and state**
- Does your agent have memory across sessions? (yes / no / limited): ___
- If yes, where is state stored? (files / database / repo / platform-native / other): ___
- Can state be read before the main task begins? (yes / no): ___

**Tool and automation model**
- Can your agent call tools or external functions? (yes / no): ___
- Can it run setup steps before the main inference begins? (yes / no): ___
- Can it spawn sub-agents or separate evaluation contexts? (yes / no): ___

**Instruction format**
- What is the equivalent of SKILL.md on your platform? (system prompt / instruction file / config / other): ___
- Can you load reference files on demand, or must all context be loaded upfront? (on-demand / upfront / other): ___

---

## How [Platform Name] Maps to Core Structure

Fill in the right column based on your Step 0 answers.

| Core Concept | Claude Code | [Platform Name] |
|--------------|-------------|-----------------|
| Instruction layer | SKILL.md | ___ |
| Reference files | `/references/*.md` loaded on demand | ___ |
| State persistence | JSON file in project dir | ___ |
| A-type automation | settings.json hooks | ___ |
| D-type evaluation | evals.json + separate session | ___ |
| Session continuity | File-based (state JSON) | ___ |

---

## A-Type Behaviors on [Platform Name]

A-type behaviors are mechanical and deterministic. They should not run inside the inference step.

**On your platform, A-type behaviors can be handled by:**
(check all that apply)
- [ ] Pre-task setup scripts
- [ ] Tool calls at defined points
- [ ] Environment variable injection
- [ ] Platform-native automation (describe: ___)
- [ ] Other: ___

**Example: injecting the current date**

On Claude Code:
```json
{ "type": "command", "command": "date +%Y-%m-%d" }
```

On [Platform Name]:
```
[fill in your platform's equivalent]
```

**Apply reason + strip_when to every A-type component you create:**
```
Component: [name]
Reason: [why this cannot be left in the instruction layer]
Strip_when: [observable condition for removal]
```

---

## C-Type Behaviors on [Platform Name]

C-type behaviors depend on time or prior interaction history.

**Where does state live on your platform?**
- Option A — Files: ___ (path convention)
- Option B — Platform-native: ___ (describe)
- Option C — Repository: ___ (path convention)
- Option D — Other: ___

**Opening pattern** (how does the agent load state before routing?):
```
[describe your platform's state-loading sequence]
```

**Closing pattern** (how does the agent write state after the run?):
```
[describe your platform's state-write sequence]
```

**Failure handling** (what happens if state is missing or unreadable?):
```
[describe your platform's fallback]
```

**Minimum state schema** (use this as your starting point):
```json
{
  "_meta": {
    "schema_version": "1.0.0",
    "skill": "",
    "platform": "[your platform name]",
    "last_updated": ""
  }
}
```

---

## D-Type Behaviors on [Platform Name]

D-type behaviors are quality checks. The generator must not be the evaluator.

**On your platform, evaluation can be separated by:**
(choose the strongest option available)
- [ ] Deterministic tools (tests, linters, type checkers) — preferred for code tasks
- [ ] Sub-agent with stripped context
- [ ] Separate session or fresh context
- [ ] External review step (PR review, human review)
- [ ] Other: ___

**When is a separate agent context required?**
A separate context is needed when the evaluation requires judgment that the generating context would bias — typically non-code tasks where no deterministic verifier exists.

For code-producing workflows, tests and verification scripts are sufficient. They have no stake in the implementation.

---

## B-Type Behaviors on [Platform Name]

B-type behaviors require judgment and stay in the instruction layer.

No platform-specific translation needed. These are what your instruction file (SKILL.md equivalent) should contain.

Confirm your instruction file contains only:
- [ ] Routing logic
- [ ] B-type judgment behaviors
- [ ] Pointers to where A/C/D logic is handled
- [ ] Hard constraints and anti-patterns

It should NOT contain:
- [ ] Mechanical steps that your platform can automate
- [ ] State computation logic
- [ ] Self-evaluation instructions

---

## Failure Modes on [Platform Name]

List the failure modes specific to your platform. Use this structure:

| Failure | Typical Cause | Recommended Handling |
|---------|---------------|---------------------|
| [failure 1] | [cause] | [handling] |
| [failure 2] | [cause] | [handling] |

Reference the Claude Code and Codex adapters for examples of how to fill this in.

---

## Platform Strengths for Harness Engineering

List what your platform makes easier compared to others:

- **[Strength 1]**: [how it simplifies a harness pattern]
- **[Strength 2]**: [how it simplifies a harness pattern]

Design skills targeting this platform to take advantage of these native capabilities rather than replicating patterns from other environments.

---

## Completing This Adapter

When you have filled in all sections:

1. Rename this file to `adapters/[your-platform].md`
2. Remove this instruction section
3. Update the `<!-- adapter -->` comment at the top with your platform name
4. Add a row to the Knowledge Table in `SKILL.md`
5. Add your platform to the Step 4 routing line in `SKILL.md`
6. Bump `skill_version` minor in `SKILL.md` frontmatter
7. Add a changelog entry

```
| adapters/[your-platform].md | How [Platform Name] implements core harness concepts |
```

```
**Step 4 — Platform:** Claude Code → ... · [Platform Name] → `adapters/[your-platform].md` · Unknown → core only
```
