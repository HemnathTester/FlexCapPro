# Setup on a new machine (for a teammate who clones this repo)

## 1. Install once
| Tool | Why | Check |
|---|---|---|
| Git | clone the repo | `git --version` |
| Node.js 20 or newer (24 is what we use) | runs the suite | `node --version` |
| Google Chrome | the browser the tests drive | open it once |
| Java 11 or newer (17 is what we use) | builds the Allure report | `java -version` |

## 2. Get the code
```powershell
git clone https://github.com/HemnathTester/FlexCapPro.git
cd FlexCapPro
git checkout test_branch
```
The repo is private: the owner must add you (GitHub, repo **Settings > Collaborators > Add people**) or you fork it and clone your fork.

## 3. Install the dependencies
```powershell
npm run install:all
```

## 4. Create your own `.env` (it is never committed)
```powershell
copy .env.example .env
```
Fill it in. Ask the owner privately for the values (never paste them in chat or commit them):
```
TARGET_ENV=UAT
BASE_URL=https://uat.freightpay.flexcappro.com
BACKOFFICE_URL=https://uat.freightpay-admin.flexcappro.com
BUYER_EMAIL=...        BUYER_PASSWORD=...
SUPPLIER_EMAIL=...     SUPPLIER_PASSWORD=...
YOPMAIL_URL=https://yopmail.com/en/wm
DEFAULT_PASSWORD=...
```
`supplier1000@yopmail.com` and `buyer1000@yopmail.com` are shared UAT accounts. Login/Forgot-Password OTP is a fixed dev-team test value (`STATIC_OTP`,
default `000000` — see `.env.example`), so OTPs never collide between people running tests at the same time. The verification-email step still goes to a
public yopmail inbox, so if two people verify a *new* account at the same moment, agree who runs when, or each use your own throwaway accounts.

## 5. Run
```powershell
npm run sanity -- --headed                                   # whole-application sanity, one flow
npm run test -- --product=chrome --module=user-access --headed   # one module
npm run test -- --product=chrome --module=user-access --scenario=UA-LOGIN-WRONG-OTP-REJECTED --headed   # one scenario
```
OTP (login, Forgot Password) is a fixed test value (`STATIC_OTP`): the run types it in automatically, no prompt. The run still stops and shows **ACTION FOR YOU**
for a "Verify Your Email" click on a brand-new account: do it in your own browser at `https://yopmail.com/?<mailbox>` and type "done" in the terminal.

## 6. Reports (all created automatically after every run, per module)
| What | Where | Open |
|---|---|---|
| Excel test report (status, defect list, screenshot for every step). File name = module + date + time, e.g. `user-access_2026-10-08_11-41-56.xlsx` | `reports\excel_report\<module>\` | `npm run excel -- --module=<module>` |
| Allure report (steps, screenshots, times) | `reports\allure\<module>\<date-time>\` | `npm run report -- --module=<module>` |
| Failures-first summary | `executions\<run>\triage.md` | any editor |

## Good to know
- Everything in `reports\`, `executions\`, `fixtures\auth\` and `fixtures\created-data.xlsx` is yours alone and git-ignored.
- Tests run against UAT only: the CLI refuses to start unless `TARGET_ENV=UAT`.
- Read `RULES.md`, `summary.md` and `task_log.md` first: they say what exists and what is next.
