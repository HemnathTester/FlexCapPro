# Folder Guide — What Each Folder Is, and Why It Exists

**Companion to `RULES.md`. Read the table below — that's genuinely enough to get started. Only open
a section underneath it if you want the "why" behind a specific folder.**

## 60-second version

| Folder | What goes here | One line why |
|---|---|---|
| `summary.md` | Current state of the project | So nobody re-discovers the project from scratch every session |
| `task_log.md` | Dated log of what happened | So work doesn't get repeated or contradicted across sessions |
| `knowledge/doc/` | Requirement docs; screenshots **if you have them** (optional) | The source of truth — what the feature is supposed to do |
| `knowledge/doc/change-requests/` | New/changed CRs — via git pull or placed directly | Where new requirements land, clearly separate from "already known" |
| `knowledge/discussions/` | Meeting notes, decisions | So reasoning isn't lost once the meeting ends |
| `implementation/plans/TEST_CASE_GENERATION_TEMPLATE.md` | The one fixed test-case process | So everyone (person or AI) follows the same steps |
| `implementation/plans/scenario-catalog.md` | List of every scenario ID | Check here before adding anything new — reuse before create |
| `implementation/plans/coverage-model.md` | Why each scenario earns its place | Keeps the test set small and meaningful, not bloated |
| `implementation/plans/locator-maps/` | Cached element locators per screen | So AI never re-inspects a screen it's already mapped |
| `implementation/plans/testcases/` | The 2 docs per module (technical + plain-language) | One for engineers, one for non-technical review |
| `implementation/plans/module-plans/` | Reusable decisions per module | Say it once, it applies forever |
| `implementation/ai_usages/` | Log of real AI invocations | Keeps AI usage honest and visible |
| `source/.../specs/<module>/` | The actual scripts, one file per scenario | A failure always points to exactly one scenario |
| `executions/` | Run results, failures-first | The one file to open to decide what to fix next |
| `reports/results/<product>/` | Screenshots + evidence per run | Proof of what happened, no re-running needed |

If that's all you needed, you're done. Everything below is detail for anyone who wants the
reasoning behind a specific row.

---

## Root level

```
<project-root>/
├── RULES.md
├── summary.md
├── task_log.md
```

### `RULES.md`
**What:** The master rulebook — identical copy in every project.
**Why it's here:** It's the first thing anyone (a tester or an AI tool) should read, so it sits at
the root, not buried in a subfolder. If you're ever unsure what to do, this is where the answer
lives.

### `summary.md`
**What:** A living snapshot of the project — what's built, what's stable, current coverage by
module, right now.
**Why it exists:** Without this, every new session (yours or a teammate's, or a fresh AI
conversation) starts by re-discovering the state of the project from scratch — reading old test
cases, guessing what's done. `summary.md` is the shortcut: read this first, know where things
stand in two minutes instead of twenty.

### `task_log.md`
**What:** A dated, chronological log — what was done each session, what's pending, what broke and
how it got fixed.
**Why it exists:** `summary.md` tells you *where things stand*; `task_log.md` tells you *how they
got there* and *what's still open*. Without it, two people (or two AI sessions) can easily redo the
same work or contradict each other's decisions, because neither knows what the other already tried.

---

## `knowledge/` — where the truth comes from

```
knowledge/
├── doc/            ← requirement docs: PRDs, FSDs, BRDs, reference screenshots (if available)
└── discussions/    ← meeting notes, decision records
```

**Why this folder exists at all:** Test cases are not supposed to come from memory, habit, or "how
a similar screen usually works." They come from whatever is in the knowledge base. `knowledge/` is
where that source of truth physically lives, so there's never a question of "which version am I
supposed to be testing against."

### `knowledge/doc/`
**What:** Requirement documents, and reference screenshots **when they exist**.
**Why screenshots are optional, not mandatory:** A screenshot in this folder is a human-provided
reference — useful, but not required. The AI doing the test-case work reads the *live* screen itself
(screenshot, accessibility tree, or DOM, whatever the platform exposes) at the moment it needs it —
the same way an experienced QA engineer looks at a screen before testing it, rather than waiting for
someone to hand them a numbered picture of it first. A screenshot placed here is a nice-to-have
cross-check, not a blocking step.
**Why it's still separate from everything else:** This is read-only, source-of-truth material. It
never gets edited as part of test-case work — if it needs changes, that's a separate conversation
with whoever owns the requirement.

### `knowledge/doc/change-requests/`
**What:** New or changed requirements — a CR — landing either through a normal `git pull` or placed
directly into this folder, named clearly (`<CR-ID-or-date>-<short-title>`).
**Why it's its own folder:** So it's never ambiguous whether something is a new change still waiting
to be worked through, or an already-understood part of the product. When a CR shows up here, the
process is never "re-learn the whole product" — it's "compare this CR against `scenario-catalog.md`
and only touch what it actually changes." Once it's worked through, that gets logged in
`task_log.md` so the CR is clearly marked done, not left sitting ambiguously.

### `knowledge/discussions/`
**What:** Meeting notes and decision records (like the Sathish review this rulebook is built from).
**Why it matters:** Decisions made in conversation get lost if they only live in someone's memory or
a chat history. Writing them here means the reasoning behind a choice is still findable six months
later, by someone who wasn't in the room.

---

## `implementation/` — where the test-case work happens

```
implementation/
├── plans/
│   ├── TEST_CASE_GENERATION_TEMPLATE.md
│   ├── scenario-catalog.md
│   ├── coverage-model.md
│   ├── testcases/
│   └── module-plans/
└── ai_usages/
```

**Why this folder exists:** This is the workspace for turning a requirement into test cases — the
actual thinking, planning, and documentation work. It's deliberately separate from `source/` (the
scripts themselves — see below), because "what should be tested and why" and "the code that tests
it" are two different kinds of artifact, maintained for two different audiences (a reviewer vs. a
script runner).

### `implementation/plans/TEST_CASE_GENERATION_TEMPLATE.md`
**What:** The one fixed process for turning a screen into test cases.
**Why it exists:** This is the file that solves the "16 scenarios vs. 40 scenarios for the same
scope" problem. Without one fixed, written-down process, every person (and every AI session) makes
their own judgment call on coverage, format, and depth — and those calls never match. This file
gets tagged/referenced at the start of every new module, by a person or an AI, so the process is
never reinvented or half-remembered.

### `implementation/plans/scenario-catalog.md`
**What:** The single source of truth for every scenario ID across the whole project.
**Why it exists:** Before creating anything new, this is what gets checked — "does this scenario
already exist?" Without a single catalog, duplicate or near-duplicate scenarios creep in because
nobody can see the full list of what already exists.

### `implementation/plans/coverage-model.md`
**What:** The reasoning behind *why* each scenario was created — or deliberately wasn't.
**Why it exists:** A test case says *what* to check. This file says *why it was worth checking* and
*why nothing else needed to be added*. That reasoning is what keeps the test set small and
meaningful instead of growing indefinitely "just in case."

### `implementation/plans/testcases/`
**What:** The two documents per module — the detailed technical test cases, and the plain-language
End-to-End User Scenario doc.
**Why two files, not one:** A developer or automation engineer needs step-by-step detail. A
non-technical reviewer (or a manager, or a client) needs to validate that the real user journeys are
covered, without opening a single script. One document can't serve both readers well, so it's two.

### `implementation/plans/module-plans/`
**What:** One `<Module>-Plan.md` per module, holding reusable decisions and standing checks.
**Why it exists:** Some things need to be remembered forever, not just written once ("always check
this screen's top bar color, every time, not just the one test that first noticed it"). Without this
file, that kind of instruction has to be re-explained in every single session — this folder is where
it gets said once and then just... keeps applying.

### `implementation/ai_usages/`
**What:** A log of every real AI invocation — when AI was actually called in to diagnose a failure.
**Why it exists:** This is how the team can honestly answer "how much is AI actually doing here?" A
high number here is a signal worth investigating (unstable scripts or a flaky environment) — not a
badge of thoroughness. Without this log, that signal is invisible.

---

## Two behaviors worth understanding before you run anything

### 1. Everything runs through one CLI command — API, Web, Mobile, all the same way

You never run tests by clicking around in an IDE, and you never need a different tool depending on
whether you're testing an API, a Web screen, or a Mobile screen. One command, same shape every time —
only the product/module flag changes. If you know how to run one suite, you know how to run all of
them.

**And the run never just stops and leaves you guessing.** There's a difference between a test case
failing (normal — AI logs it and the run keeps going to the next test on its own) and the whole
process halting (a crash, a broken session) — which is the one that actually confuses people. For
that second case, AI tries to recover and continue the run **by itself**. You only ever see the CLI
stop for a reason it tells you plainly — never a silent hang.

### 2. What happens when a screen has changed

This isn't a folder, but it's the one concept that explains why this is called "agentic" and not
just "automated," so it's worth two minutes here.

When a script runs and the screen doesn't match what was expected, the AI doesn't just fail
immediately. It checks one thing first: **is the same option still on the screen, just moved,
renamed, or restructured?**

- **If yes** → it adapts, continues the test, and **logs the change** (this is never done silently —
  a human can always see it happened and confirm it was the right call).
- **If no** → it treats this as a likely real functionality break and flags it, instead of silently
  passing or failing with a confusing error.

This is the difference between a script that just breaks the moment a button moves, and a system
that reasons about intent the way an experienced tester would. It's also why `implementation/ai_usages/`
matters — every time this judgment call happens, it's worth being able to see it happened.

---

## `source/` — where the actual scripts live

```
source/
└── <platform>/<product>/
    └── specs/<module>/   ← one script file per scenario ID, always
```

**Why this is separate from `implementation/`:** Everything in `implementation/` is about *deciding
what to test and documenting it*. Everything in `source/` is the *code that actually does it*. Those
are different skill sets and different review processes — keeping them apart means a reviewer
checking test-case completeness never has to wade through code, and an automation engineer fixing a
script never has to wade through planning docs.

**Why one script per scenario, never bundled:** If a run fails, it needs to point at exactly one
scenario without extra digging. A shared script covering five scenarios means a single failure
could be any of the five — this structure removes that ambiguity entirely.

---

## `executions/` and `reports/` — what happened, with proof

```
executions/        ← execution_runs.json + triage reports, per run
reports/
└── results/<product>/   ← evidence: screenshots, hierarchy dumps, logs
```

### `executions/`
**What:** The record of each test run — what ran, what passed, what failed, sorted failures-first.
**Why it exists:** This is the one file a human opens to decide what to fix next, and in what order.
Without a single, consistently-shaped place for this, triage starts from scratch every run.

### `reports/results/<product>/`
**What:** The actual evidence — screenshots and screen-hierarchy dumps captured at the moment of
failure (and for Positive/Negative/Edge passes too, not just failures).
**Why it exists:** A failure report that just says "it failed" is not enough to act on. A screenshot
and a hierarchy dump at the exact failure point means nobody has to re-run the test just to see what
went wrong — the proof is already sitting there.

---

## The one-sentence version, if someone only reads this far

- **`knowledge/`** = where the truth comes from.
- **`implementation/`** = deciding what to test, and writing it down so it's never different twice.
- **`source/`** = the code that actually does the testing.
- **`executions/` + `reports/`** = proof of what happened, every time.
- **`summary.md` + `task_log.md`** = so nobody — person or AI — ever starts from zero.

This shape is identical in every project on purpose. Learn it once, and you already know your way
around the next one.
