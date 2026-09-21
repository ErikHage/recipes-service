# Dependency Security

Keeps dependencies free of known vulnerabilities without breaking the consumer (`voracious-appetite-app`).

> Log rules: committed lines are never edited. Add new dated entries per commit. An entry stays editable until it's committed, and its date is the day it was last edited.

## 2026-09-21

**Goal:** Clear `npm audit` vulnerabilities while keeping the API contract the consumer relies on.

**Result:** `npm audit` went from **28 (20 high)** to **0**. The production tree (`--omit=dev`) went from 16 to 0.

**Consumer constraint:** the consumer only calls `GET /recipes` and `GET /recipes/:recipeId` (no query or body), treats any non-2xx as a generic error, and reads the serializer's JSON fields. Every change here keeps the routes and response shapes, so **there's no consumer impact**. The integration tests assert those shapes.

**Changes**
- **Runtime:** `npm audit fix` → express 4.22.3, body-parser 1.20.8 (qs, path-to-regexp), lodash 4.18 under winston 2. Stayed on **Express 4**; Express 5 isn't needed for security. The `package.json` minimums were raised to the patched versions.
- **Runtime:** removed the unused `uuid`, `moment` and `err`.
- **Runtime:** joi 14 → **18** (hoek/topo). The validator now calls `schema.validate(obj, opts)` because `joi.validate` was removed.
- **Dev:** `nyc` moved out of `dependencies` and upgraded 14 → **18**.
- **Dev:** ESLint 6 → **8** with `eslint-config-airbnb-base` 15, which fixes flatted, tmp and inquirer. The React/JSX plugins were dropped because there's no React here. ESLint 9/10 was declined: it needs flat config, which the airbnb config doesn't support. ESLint 8 is past EOL, which is acceptable for a dev tool. One new-rule fix (`no-promise-executor-return` in `utilities.sleep`), no behavior change.
- **Dev:** mocha 10 → **12** (serialize-javascript). It works without any config changes.
- **Fix:** `coverage-check` was `nyc check-coverage -- mocha …`, which never ran the tests and only checked leftover data. It's now `nyc --reporter=text-summary mocha …`; `.nycrc` `check-coverage: true` enforces the thresholds.

**Left as is (not security-driven, optional later):** `@octokit/rest` 22 (ESM-only since 21), winston 3 (API rewrite), sinon 7 / chai 4 / sinon-chai / dirty-chai majors, husky 9, dotenv 18.

**Verification:** 70 unit and 6 integration tests pass, plus lint and coverage-check.

**Open notes**
- A live smoke test wasn't possible because the local `.env` `GITHUB_API_TOKEN` gets 401 Bad credentials from GitHub. Replace the token, then run `npm start` and hit `/api/recipes-service/recipes`.
- Docker isn't installed locally, so check the image build (`node:24`) on the next deploy.
