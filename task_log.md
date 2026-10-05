# Task Log

Chronological, one entry per meaningful change. Newest first.

## 2026-10-05 — Initial scaffold
- **Trigger:** Manual request — base project setup
- **Docs consulted:** qa_automation_project_scaffold.md
- **Created:** folder contract (Section 2), root/config files, starter smoke test per engine
- **Deviations from scaffold Section 11:**
  - Appium: uses the globally installed Appium 3 + its drivers (`appium driver list`);
    `appium`/driver packages removed from package.json (scaffold pinned Appium 2 / uiautomator2 3.x,
    which conflicts with Appium 3). `ts-node` dropped — WDIO v9 compiles TS itself.
  - iOS config kept for parity, but iOS cannot run on Windows (needs macOS + Xcode).
  - `.env` is loaded from the repo root explicitly (dotenv/config only looks in the cwd).
  - Reporter/output paths resolved from each config file's directory, not the cwd.
  - Maestro: `config.yaml` is now a valid workspace config (`flows:`); `appId` moved into the
    flows and passed via `-e APP_ID=...`. `run_maestro_suite.sh` cd's to its own folder so it
    works from the repo root. `install_maestro.sh` supports Windows (zip install).
  - `.npmrc` sets npm's script-shell to Git Bash (on this machine `bash` in cmd.exe is WSL).
  - `.gitignore` fixed so .gitkeep files are actually tracked.
  - Smoke checks: Appium asserts the foreground package equals ANDROID_APP_ID; Maestro smoke is a
    marked PLACEHOLDER (needs a real launch-screen element).
- **Skipped/Deferred:** scenario generation — no documents in knowledge/ yet.
- **Result:** not executed (no app build / device / web URL configured yet)
