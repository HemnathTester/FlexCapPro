# QA Automation Rulebook — RULES.md

**Version 1.0 | Owner: QA Leadership | Applies to: every project, every tester, every AI tool used**

This is the one file every team member reads before touching any project. Drop this exact file,
unchanged, into the root of every project's repo. If a rule here ever conflicts with something
project-specific, this file wins — raise it with QA leadership to resolve, don't quietly override it.

If you remember nothing else: **one folder structure, one AI trigger rule, one test-case format,
two living memory files (`summary.md` + `task_log.md`).** Everything below is the detail behind
those four things.

---

## 1. File Architecture — the same shape in every project

Every project, regardless of what it tests or which platform it runs on, uses this exact folder
structure. A tester moving from Project A to Project B should find everything in the same place,
named the same way, with zero relearning.

```
<project-root>/
├── RULES.md                          ← this file, identical copy, every project
├── summary.md                        ← living project snapshot (see §5)
├── task_log.md                       ← chronological work log (see §5)
│
├── knowledge/                        ← the source of truth — whatever exists here gets used
│   ├── doc/                          ← requirement docs: PRDs, FSDs, BRDs, reference screenshots
│   │   │                               (screenshots are optional reference, not mandatory)
│   │   └── change-requests/          ← CRs land here, by git pull or placed directly (§5)
│   └── discussions/                  ← meeting notes, decision records
│
├── implementation/
│   ├── plans/
│   │   ├── TEST_CASE_GENERATION_TEMPLATE.md  ← the one fixed process every module follows (§3)
│   │   ├── scenario-catalog.md       ← single source of truth for every scenario ID (§3)
│   │   ├── coverage-model.md         ← why each scenario earns its place (§3)
│   │   ├── locator-maps/             ← one <Module>-Elements.md per screen — cached once (§3)
│   │   ├── testcases/                ← one <Module>-TestCases.md + <Module>-UserScenarios.md per module
│   │   └── module-plans/             ← one <Module>-Plan.md per module — reusable decisions (§4)
│   └── ai_usages/                    ← log of every real AI invocation (§4)
│
├── source/
│   └── <platform>/<product>/         ← e.g. mobile/appium, web/chrome — actual scripts live here
│       └── specs/<module>/           ← one script file per scenario ID, always (§3)
│
├── executions/                       ← execution_runs.json + triage reports, per run
└── reports/
    └── results/<product>/            ← evidence: screenshots, hierarchy dumps, logs (§6)
```

**The rule, stated plainly:** if you're looking for requirement docs, it's always `knowledge/doc/`.
If you're looking for test cases, it's always `implementation/plans/testcases/`. If you're looking
for evidence of what happened in a run, it's always `reports/results/`. This never changes between
projects — a new project gets this exact skeleton on day one, empty folders and all.

---

## 2. AI Initiation Rules — tool-agnostic, by design

**The knowledge base (`knowledge/`) is the source of truth, always — not the codebase.** Nothing is
ever tested from memory, habit, or "what a similar screen looked like last time." Whatever the
knowledge base holds for a project — requirement docs, reference screenshots, prior scenario
catalogs, logged Plan-file decisions — is what generation is grounded in. Nothing in it is mandatory
by *type*: a project may have a detailed requirement doc and no screenshots, or screenshots and a
thin doc. What's mandatory is that whatever *does* exist gets used, and no one ever opens the
codebase just to figure out what a feature is supposed to do.

**The AI captures the screen itself — a tester never has to.** Earlier drafts of this process asked
a person to manually screenshot every screen and number its elements before writing a test case.
That's no longer a manual step. The AI reads the live screen itself (screenshot, accessibility tree,
or DOM — whatever the platform gives it) at the moment it needs it, both when designing a test case
and when running one — the same way an experienced QA engineer looks at a screen before testing it,
not the way a junior one waits to be walked through it. A human-provided screenshot in
`knowledge/doc/` is still useful as reference material when available, but it is optional input, not
a required manual step.

**Scripts run deterministically. AI is invoked only when a script actually fails — or when the
screen it finds doesn't match what it expected.** This is true whether the team is using Qwen,
Claude, ChatGPT, or whatever tool replaces them next year — the rule governs the *process*, not a
specific product, and no team member should ever need a specific AI tool installed locally for this
to work.

```
 PASSING RUN       →  zero AI calls, script runs the same way every time, free and instant
 SCREEN MISMATCH    →  AI checks: is the same option/element present elsewhere on this screen
                        (moved, relabeled, restructured)?
                          → found elsewhere: adapt, continue, LOG the change (never silent)
                          → not found anywhere: treat as a likely real functionality break
 FAILING STEP       →  AI is invoked ONCE to diagnose: what broke, is it a real bug or a stale
                        assumption, propose a fix or flag a human → control returns to the script
```

**Hard rules:**
- AI is never the thing deciding whether a test "looks right" on a passing run — only a real
  failure or a genuine screen mismatch triggers it.
- A relocated element is never silently "fixed" and forgotten — every adaptation gets logged (in the
  run report and, if it's a lasting change, in the module's Plan file) so a human can confirm it was
  the right call.
- AI never generates a large batch of speculative test cases. Generation is scoped strictly to what
  `scenario-catalog.md` calls for (§3).
- Whichever AI tool is used, it must read `summary.md`, `task_log.md`, and the relevant module's
  Plan file before doing anything — see §5. This makes the *process* independent of the *person* or
  the *product* running it.
- A run's report must be able to say, honestly, how many test cases passed with zero AI involvement
  vs. how many needed a diagnosis. A high AI-invocation count is a signal the product or the scripts
  are unstable — not a sign the system is working harder.

**Why this matters for a fast-paced org (§4 below):** the less AI is doing on every run, the faster
and cheaper every run is. Minimizing AI calls isn't a cost-cutting afterthought — it's the same
lever that makes testing fast.

**This is what makes it agentic, not just automated.** Running fixed scripts and calling AI on
failure is AI-*assisted* automation. What makes it agentic is these two things together: the AI
perceives the current screen itself instead of being spoon-fed by a person, and it makes a judgment
call (relocated vs. genuinely broken) instead of just reporting pass or fail.

### Execution always happens through one CLI command — API, Web, and Mobile alike

**There is one way to run tests: the CLI. Never a manual run through an IDE, never a different tool
per platform.** Whether the suite is API, Web, or Mobile App, the team triggers it the same way,
from the same place — `<cli-command> --product=<product> --module=<module>` (exact flags vary by
project, but the pattern never does). Switching from testing a Web module to a Mobile module should
feel like changing one flag, not learning a new tool.

**A CLI run is never allowed to just stop and leave the team guessing.** There are two very
different situations here, and the team should never have to wonder which one they're in:

1. **A single test case fails.** This is normal. AI diagnoses that one scenario (as above), logs the
   result, and the run **continues to the next scenario on its own.** Nobody restarts anything.
2. **The CLI process itself halts** — a crash, a broken driver session, an uncaught exception, an
   environment hiccup. This is the one that actually confuses a team, because without a rule here,
   a tester is left staring at a stopped terminal not knowing whether to wait, retry, or escalate.
   **The rule: AI is invoked to diagnose the halt and attempt to resume the run itself** — restart
   the session, skip the one broken script and move on, recover whatever state it can — rather than
   requiring a human to notice, investigate, and manually kick it off again.
3. **Only when AI genuinely cannot recover** (environment down, invalid credentials, something truly
   outside the suite's control) does the CLI stop — and when it does, it says so in plain language,
   naming exactly what's blocking it and what a human needs to do. It never just goes silent or hangs.

**The guarantee:** a CLI run always ends one of two ways — complete, with a full report (§6), or
stopped with an explicit, human-readable reason. It never leaves the team halfway through, unsure
whether the run is still going, stuck, or done.

---

## 3. Test Case & Script Generation — identical output, regardless of who (or what) generates it

The problem this section exists to kill: two testers working the same module producing different
test-case counts, different formats, different depth — purely because there was no fixed process.

**One fixed template file — `implementation/plans/TEST_CASE_GENERATION_TEMPLATE.md` — holds this
process.** Tag or reference this file at the very start of every new module's test-case generation,
whether a person is doing it directly or an AI session is doing it. This is what makes the process
identical regardless of who (or which AI tool) is running it — nobody re-derives the approach from
scratch or from memory.

**The fixed process, every time, every module, every project:**

1. **Check `scenario-catalog.md` first.** Every scenario has a fixed ID, description, type
   (Positive/Negative/Edge). Never invent an ID without checking here — reuse before create.
2. **Ground every step in the live screen, not memory.** The AI reads the real screen itself
   (screenshot / accessibility tree / DOM) before writing a step — no step is ever written from
   assumption. If a reference screenshot already exists in `knowledge/doc/`, use it as a cross-check,
   but it's a helpful extra, not a prerequisite.
2b. **Cache what the AI finds — never re-derive it.** The first time a screen is inspected, every
   element the AI identifies gets written down, once, in
   `implementation/plans/locator-maps/<Module>-Elements.md` (name, how to find it, what it does).
   Every future script for that screen — written today or six months from now, by a person or a
   different AI session — reads this map first instead of asking AI to re-inspect the same screen
   from scratch. **This is the single biggest cost control in the whole process**: AI usage scales
   with how many *new* screens exist, not how many times an existing screen gets referenced. The map
   only gets re-checked when a screen mismatch is actually detected at execution time (§2) — not on
   a routine basis.
3. **Fill `coverage-model.md`'s 11-dimension check** for every scenario (Functional, Negative,
   Boundary/Edge, State, Role, Data, Integration, Recovery, UI/Visual, API, Regression impact) —
   this is what keeps the set small and high-value instead of bloated.
4. **Write the test-case document in one fixed format** — every module, same layout:
   `### TC-<ID> — <title>` with Priority, Type, Preconditions, Test Data, numbered Steps, Expected
   Result, Automation script path, Notes. No table-only shortcuts, no alternate layouts, ever.
5. **One script file per scenario ID. Never bundle scenarios into a shared script.** A failure must
   always be traceable to exactly one scenario without extra digging.
6. **Write a second, plain-language "End-to-End User Scenario" document** alongside the technical
   one — real user journeys ("Approach 1, 2, 3..."), readable by a non-technical reviewer with zero
   scripts opened.

**The guarantee this produces:** if Tester A and Tester B are both assigned the same module, they
will produce the same scenario count, the same document structure, and the same script layout —
because neither of them is inventing the process, they're both just following it. This is what makes
onboarding a new tester (or handing a module to a different AI tool) a non-event.

---

## 4. Speed Without Compromising Quality

For a fast-paced org, "fast" and "thorough" are not in tension if the process is followed correctly —
they conflict only when shortcuts are taken.

- **Minimum test set, maximum meaningful coverage (§3, Rule 3).** Ten to fifteen well-chosen test
  cases that catch real problems beat two hundred generic ones that mostly restate each other and
  take ten times as long to write and run.
- **Finish one module fully before starting the next.** Partial coverage across five modules in
  parallel looks like progress but leaves gaps in all five. One module, fully stable, before moving
  on — this is faster end-to-end, not slower.
- **Identify critical modules first.** Not every module carries equal risk. A module that blocks the
  core flow, touches money, or touches identity gets full coverage immediately. A "nice to have"
  module gets lighter coverage and can wait. State this explicitly at the top of every module's
  test-case document — never leave it as an unstated assumption.
- **A passing script costs nothing on every re-run** (§2) — this is the actual speed lever. The
  fastest test suite is the one that needs the least AI time per run, which is a direct result of
  following §2 correctly, not a separate optimization.
- **Quality is never traded for speed by skipping the two-document rule (§3.6), the coverage model
  (§3.3), or evidence capture (§6).** Those three are what make a fast run still trustworthy — cut
  them and "fast" becomes "fast and wrong."

---

## 5. Minimizing AI Usage — `summary.md` + `task_log.md` are the memory, not repetition

Every time a new AI session starts on a project, it should never be starting from zero. This is the
single biggest lever for cutting AI cost and time.

- **`summary.md`** — a living snapshot: what's built, what's stable, current coverage by module.
  Read this first, every session.
- **`task_log.md`** — a dated, chronological log of what happened each session: what was
  generated, what's still open, what broke and how it was fixed.
- **`<Module>-Plan.md`** (in `module-plans/`) — a per-module memory of reusable decisions and
  standing checks ("always verify this screen's branding, not just where it was first noticed").
  Write a rule here once; every future session on that module inherits it automatically.

**The rule:** at the start of any AI session, the first instruction is always *"read `summary.md`
and `task_log.md`, and this module's Plan file if it exists, before doing anything."* At the end,
the last instruction is always *"update these with what happened this session."* This is what turns
every new session into a **continuation**, not a restart — the AI (whichever one it is) is revising
existing memory, not re-deriving the whole project from scratch every single time. This alone cuts
AI usage dramatically, because rediscovery is the single most expensive thing an AI session can do.

### When a new CR lands — update the delta, never re-learn the project

A CR reaches the team one of two ways, and both are treated identically: it arrives via `git pull`
as part of a normal update, or it's placed directly as a new file in
`knowledge/doc/change-requests/`. Either way, it lands in the same place, named clearly
(`<CR-ID-or-date>-<short-title>.md/.docx`) so it's obvious to anyone — person or AI — that it's new
and not yet processed.

The same reuse-before-create discipline that applies to a single scenario (§3, Rule 1) applies here
at the whole-project level:

1. **`summary.md`, `task_log.md`, `scenario-catalog.md`, `coverage-model.md`, and the existing
   `testcases/` documents are the project's known state — read first, every time.** They are not
   just outputs the process produces; they're the reference index the AI (or a person) checks before
   touching anything, exactly the way a senior QA engineer would ask "what already exists here?"
   before diving in.
2. **Diff the incoming CR against that known state, not against a blank understanding of the
   product.** The question is never "what does this whole product do" — it's "what, specifically,
   does this CR add or change compared to what `scenario-catalog.md` already lists?"
3. **Scope all work to that delta.** New scenarios get added for genuinely new behavior. Existing
   scenarios only get touched if the CR actually changes them — logged as a dated decision in that
   module's Plan file. Everything untouched by the CR stays exactly as it is; it is never
   re-generated or re-validated "just in case."
4. **Once a CR is processed, say so.** Log it in `task_log.md` (what changed, which scenarios were
   touched) so a CR file sitting in `change-requests/` never becomes ambiguous — it's either
   processed and logged, or it isn't yet.

**Why this matters for cost:** without this rule, every incoming CR risks turning into a full
re-read of the product, which is the most expensive thing this process can do, repeated every time
someone pushes a change. With it, AI effort scales with the *size of the CR*, not the size of the
product — the same principle as the Locator Map (§3), applied to the knowledge base instead of the
screen.

---

## 6. Test Reports & Evidence — every scenario type, every project, same shape

Every test run must produce evidence that stands on its own, without needing someone to re-run the
test to understand what happened.

- **Every scenario — Positive, Negative, and Edge — gets a report entry**, not just failures. A
  passing Negative or Edge case is proof the guardrail works; that's worth recording, not just
  silently passing.
- **Every failure captures a screenshot and a full screen-hierarchy dump** at the point of failure,
  saved under `reports/results/<product>/`, named by scenario ID and run ID.
- **The triage report is sorted failures-first**, with category, message, and evidence links — this
  is the one file a human opens to decide what to fix, in what order.
- **Evidence is never optional or "nice to have" for edge cases.** A Boundary/Edge scenario that
  passes silently with no captured evidence is functionally the same as a scenario that was never
  run — there's no way to later verify it was checked at all.

---

## For every team member

- Drop this file, unmodified, into every project's root.
- Don't create a personal variant "for this project" — if something about a project genuinely needs
  a different rule, that's a change to propose for this file, not a local workaround.
- Any AI tool (Qwen, Claude, or otherwise) gets pointed at this file first, before generating
  anything.

This file is the whole onboarding a new project — or a new team member — needs.
