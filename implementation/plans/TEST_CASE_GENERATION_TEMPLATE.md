# Test Case Generation Template

Tag this file at the start of every new module's test-case generation (RULES.md §3).
Before anything else: read `summary.md`, `task_log.md`, and the module's Plan file.

## Module header (state first, never leave implicit)
- Module:
- Criticality: Critical / Standard / Light  (blocks core flow, touches money or identity = Critical)
- Source of truth used (files in `knowledge/`):

## Process
1. Check `scenario-catalog.md` first. Reuse an existing ID before creating one.
2. Ground every step in the live screen (screenshot / accessibility tree / DOM), never memory.
   Use reference screenshots in `knowledge/doc/` only as a cross-check.
2b. Cache every element found in `locator-maps/<Module>-Elements.md` (name, how to find it, what it does).
    Read that map first on every later script; re-check only on a detected screen mismatch.
3. Fill the 11-dimension check in `coverage-model.md` for every scenario.
4. Write `testcases/<Module>-TestCases.md` in the fixed format below.
5. One script file per scenario ID, at `source/<platform>/<product>/specs/<module>/`. Never bundle.
6. Write `testcases/<Module>-UserScenarios.md`: plain-language end-to-end journeys (Approach 1, 2, 3...).
7. Update `scenario-catalog.md`, `summary.md`, `task_log.md`, and the module Plan file.

## Fixed test-case format
```
### TC-<ID> — <title>
- Priority:
- Type: Positive / Negative / Edge
- Preconditions:
- Test Data:
- Steps:
  1.
  2.
- Expected Result:
- Automation script path:
- Notes:
```
No table-only shortcuts, no alternate layouts.
