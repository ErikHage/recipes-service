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

## 2026-10-12 — Clear the sprintf-js chain and patch proxy-addr

**Goal:** Clear new `npm audit` advisories published since the 2026-09-21 entry.

**Result:** `npm audit` went from **9 (1 critical, 7 moderate, 1 low)** to **0**. The production tree (`--omit=dev`) is at 0. The only production finding was proxy-addr, under Express.

**Changes**
- **Runtime:** `npm audit fix` (lockfile only) → proxy-addr 2.0.8 under express. This was the critical one: IP spoofing through an IPv4-mapped IPv6 trust subnet. **No consumer impact**, because routes and response shapes are unchanged.
- **Dev:** the same `npm audit fix` → serialize-javascript 7.1.2 under mocha.
- **Dev:** all 7 moderate findings came from **sprintf-js**, which has no patched release. Every version is affected, so the fix removes it from the tree. It came in through js-yaml 3 → argparse 1, which reached the tree by two paths:
  - **nyc:** nyc 18 is the latest release, but `@istanbuljs/load-nyc-config` 1.1.0, also the latest, still asks for js-yaml `^3`. An `overrides` entry gives it js-yaml `^4`. This is safe because the loader only calls `yaml.load()`, which js-yaml 4 keeps, and only for `.nycrc.yaml`/`.yml` files. Our `.nycrc` is JSON. `npm audit fix --force` was rejected because it would have downgraded nyc to 14.
  - **husky 3 → 9** (it had been listed under "Left as is" on 2026-09-21; this upgrade takes care of it). husky 3 brought in cosmiconfig 5 with js-yaml 3. Overriding js-yaml there was rejected because cosmiconfig 5 calls `safeLoad`, which js-yaml 4 removed. husky 3 was also only running the `prepush` script through a deprecated fallback. husky 9 needs a `"prepare": "husky"` script and `.husky/pre-push`, which calls `npm run prepush`, so the hook behaves as before. On `npm install`, husky sets `core.hooksPath` to `.husky/_`. The old husky 3 files in `.git/hooks` are left behind and ignored.

**Verification:** lint passes. 76 unit and 9 integration tests pass, coverage-check passes, and calling `.husky/_/pre-push` directly runs `prepush` and passes.

**Open notes**
- The Docker build runs `npm install` with no `.git` present. husky 9's `prepare` should just print a notice and exit 0 there, but this hasn't been checked because Docker isn't installed locally.
- Remove the `overrides` entry once `@istanbuljs/load-nyc-config` moves to js-yaml 4.
