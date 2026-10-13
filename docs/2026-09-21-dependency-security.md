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

## 2026-10-12 — Clear npm deprecation warnings

**Goal:** Clear the `npm warn deprecated` lines that `npm ci` prints.

**Result:** a clean `npm ci` went from **10** deprecation warnings to **1**. `npm audit` stays at 0.

**Changes**
- **Dev:** sinon 7 → **22**. This removes nise 1 and the deprecated `@sinonjs/text-encoding`, and clears the "sinon 7" item under 2026-09-21's "Left as is". No spec changes were needed.
- **Dev:** chai 4.3.7 → **4.5.0** (deprecated loupe 2.3.6 → 2.3.7). chai stays on major 4: chai 5 and later is ESM-only, and moving would also need new majors of sinon-chai and dirty-chai, neither of which is deprecated.
- **Dev:** ESLint 8 → **10**, and **airbnb-base is dropped**. This **supersedes** 2026-09-21's decision to decline ESLint 9/10. That decision waited on airbnb-base, which is still eslintrc-only. Its config also turns off `valid-jsdoc`/`require-jsdoc`, which ESLint 9 removed, and flat config rejects unknown rules, so it can't be loaded as is. The ESLint 8 tree accounted for 6 of the warnings: eslint itself, `@humanwhocodes/config-array`/`object-schema`, rimraf 3, glob 7 and inflight.
  - Two alternatives were rejected. `eslint-config-airbnb-extended` hard-depends on typescript-eslint, React and Next plugins. A FlatCompat shim would mean stripping rules and overriding peer ranges on ESLint 9, which is itself near end of life.
  - `eslint.config.js` replaces `.eslintrc` and `.eslintignore`. The ignores are carried over unchanged. It uses `@eslint/js` recommended, `eslint-plugin-n` `flat/recommended-script` and `@stylistic` (2-space indent, single quotes with `avoidEscape`, semicolons, always-multiline trailing commas, 1tbs, `max-len` 100).
  - Carried over from airbnb or the old `.eslintrc`: `no-console`, `no-param-reassign` with airbnb's `props: true` options (still a warning), `no-await-in-loop`, `prefer-const`, `no-var`, `eqeqeq` and `global-require` (now `n/global-require`). `arrow-parens` stays off. `n/no-process-exit` is off because the service exits on purpose when it can't start. `eslint-plugin-import` was dropped: its peer range stops at ESLint 9, and `n/no-missing-require` covers unresolved requires.
  - The rules were tuned to fit the existing code, so nothing was reformatted. The only code edits are directive cleanups. ESLint 10 reports unused disable directives, which surfaced two stale ones: `no-unused-vars` in `lib/middleware/error-handler.js` (`next` is used now) and `no-await-in-loop` in `lib/services/recipes/index.js` (no `await` is left in it). Both were removed. `import/no-dynamic-require` was also removed from `spec/unit/helpers/git-api-access.spec.js`.
- **Left in place:** `@feral-auth/ts-simple-dsl@0.0.1` is deprecated by its publisher as an "alpha, pin exact" notice, and it's the only version. This repo already pins it exactly, so nothing here can clear the warning. Any change belongs in the ts-simple-dsl repo.

**Verification:** after `rm -rf node_modules && npm ci`, only the ts-simple-dsl warning is printed. Lint is clean, 76 unit tests pass with coverage-check, 9 integration tests pass, and the pre-push hook passes. A probe file with `var`, an unused variable, double quotes and a missing require gets all five errors reported, so the new config is really linting.

**Open notes**
- `spec/helpers` is still excluded from lint, as before. Most of the DSL and driver code lives there, so it may be worth linting now.
