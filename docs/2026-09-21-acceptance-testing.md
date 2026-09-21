# Acceptance Testing

Black-box tests that call a locally running instance of the service over real HTTP, as a client on the internet would. They're written in the DSL/driver pattern from `feral-authentication-service`.

> Log rules: committed lines are never edited. Add new dated entries per commit. An entry stays editable until it's committed, and its date is the day it was last edited.

## 2026-09-21

**Goal:** An acceptance suite that drives the real, running service with no mocks. It follows the layering from `feral-authentication-service`, described in its `test/acceptance/README.md` and `docs/2026-08-31-2-acceptance-test-adoption.md`.

**Rules** (from feral, adapted)
1. **Local service only.** Tests call a service that's already listening on a real port. They never start it.
2. **No direct calls into the code.** Nothing in the acceptance dirs requires `lib/`. Status codes are re-declared in `support/status-codes.js`, so if the service changes a code, a test breaks instead of silently agreeing.
3. **Assertions live in the drivers.** Specs and DSL modules contain no `expect`, no status codes and no JSON field paths. `drivers/assertions.js` is the only file that requires chai. One exception: `dsl/dsl-misuse.js` asserts about a wrongly called step, and it does so through `assertions.js`.
4. **Specs are prose.** A spec passes only `"name: value"` strings. Its only import is `dsl/acceptance-dsl`.

**The DSL library:** `@feral-auth/ts-simple-dsl` works in this JS project.
- It ships a CommonJS build (`exports.require → dist/index.cjs`) with no runtime dependencies. It needs Node ≥ 22; we're on 24.
- In JS we lose only the compile-time param types. Runtime validation (`DslParamsError`, which reports every problem at once) is unchanged, and feral notes that `tsc` couldn't check its prose calls anyway.
- It's installed as a dev dependency and pinned exactly, as feral does: `"@feral-auth/ts-simple-dsl": "0.0.1"`. It's a pre-1.0 alpha that ships breaking changes in patch releases.

**Stack:** mocha + chai, plain CommonJS, matching the unit and integration suites.

**Layout:** specs in `spec/acceptance/`, helpers in `spec/helpers/acceptance/`.
```
spec/acceptance/
  recipes/list-recipes.spec.js       GET /recipes
  recipes/get-recipe.spec.js         GET /recipes/:recipeId
  dsl-misuse.spec.js                 a wrongly called step is rejected before any HTTP call
spec/helpers/acceptance/
  init.js                            mocha --require: the mochaGlobalSetup preflight; loads no nock or lib/
  setup/config.js                    env → { baseUrl, requestTimeoutMs }
  dsl/acceptance-dsl.js              the one import for specs: { recipes, misuse, cleanup }
  dsl/world.js                       recipe names; wraps the test context; cleanup() forgets names, then tears down
  dsl/params.js                      shared param declarations (alias, named)
  dsl/dsl-misuse.js                  expectStepRejected: asserts on DslParamsError
  dsl/recipes-dsl.js                 parses prose, resolves aliases, calls the driver
  drivers/drivers.js                 builds the drivers once, over the http client
  drivers/recipes-driver.js          every assertion, status code, header and field name
  drivers/assertions.js              the only file that requires chai's expect
  support/http-client.js             the only place fetch() is called; returns non-2xx rather than throwing
  support/status-codes.js            a copy, not imported from lib/
  support/test-context.js            config, client, drivers; a cleanup hook for created resources (empty today)
  .env.acceptance.example
```

**Differences from feral, and why**
- **No actors, `as:`, login, admin bootstrap or resource registry.** The service has no auth and no write endpoints, so there's no caller to name and nothing to tear down. `cleanup` only forgets the names a test gave, so each test starts fresh.
- **Live data**, from the public `ErikHage/my-recipes` repo, not seeded. Tests assert shape and invariants across all recipes, not specific recipes.
- **Named recipes:** a spec picks a recipe from the live list and names it (`pickRecipe('recipe: any')`, optionally `named: <recipeName>`). Later steps refer to it by that name.
- **The same split as feral's `TestContext` and `World`.**
  - `support/test-context.js` is the plumbing: it reaches the service, builds the drivers, and will tear down anything a spec creates. It knows nothing about names.
  - `dsl/world.js` holds only what the spec named things. It wraps the test context, and its `cleanup()` forgets names and tears down together.
  - Today `TestContext.cleanup` is empty and there are no identities. The split is kept anyway so that future auth or write endpoints have a home: logins and a resource registry would go in the test context.
  - The two were briefly merged into one `testContext`. The user brought the split back after comparing the two layers.
- **Shape rules come from a survey of all 142 live recipe files.**
  - `ingredient.quantity.value` is a number or a string (e.g. `"1/2"`).
  - Nutrition values are numbers or `null`.
  - `notes` is a string or `null`.
  - The list's `recipeName` comes from the filename and can differ from the recipe's own name (14 do). The checks allow for this.

**Config:** optional env vars, read from the shell or from a git-ignored `spec/helpers/acceptance/.env.acceptance`.
- `ACCEPTANCE_BASE_URL`: default `http://localhost:3000/api/recipes-service`.
- `ACCEPTANCE_REQUEST_TIMEOUT_MS`: default `10000`.

There are no secrets. The service itself needs a valid `GITHUB_API_TOKEN`.

**Preflight:** calls `GET /recipes` once and stops with a message naming the fix.
- **Unreachable:** start it with `npm start`.
- **Non-200:** shows the status and body, and says to check the base path.
- **Empty list:** there are no recipes.

**Specs (10)**
- **List:**
  - every entry is a summary with 4 non-empty fields
  - ids are unique
  - search strings are lowercase
  - each search string is built from its recipe's name and keywords (all recipes are fetched)
  - any origin is allowed (CORS `*`)
- **Get:**
  - a picked recipe comes back in full
  - every listed recipe comes back in full
  - an unknown id → 404
- **DSL misuse:**
  - a misspelled param is rejected
  - a param passed to a step that takes none is rejected

**Quirks the suite found, now fixed in the service.** Both were first pinned as `DocumentsCurrentBehavior`. Neither fix breaks the consumer: it never reads error bodies or statuses, and it filters with `filterMatchString.includes()`. The markers are gone, and the driver methods were renamed to the fixed behaviour.
- **An unknown id's 404 was Express's HTML page.**
  - **Fix:** a new `lib/middleware/error-handler.js`, mounted after `error-logger` in `lib/app.js`.
    - Errors from the error factory reply with their own status and `toObject()` body (`{ errors: [{ status, code, source, message }] }`).
    - Any other error replies 500 with a generic message, so internal messages (e.g. GitHub's) aren't sent to the client. A 4xx error's message is shown only if it's marked `expose`.
  - **Not covered:** paths outside the API still get Express's HTML 404. That's out of scope.
  - **Tests:** a new unit spec `error-handler.spec.js`. The integration test for an unknown id now asserts the JSON body, and the acceptance driver is `getOfUnknownIdIsNotFound`.
- **`keywords: []` gave a trailing `.`** (`key.lime.pie.`).
  - **Fix:** `recipe-cache.js` now appends keywords only when the list is non-empty.
  - **Tests:** a new unit case in `recipe-cache.spec.js`, and the acceptance driver is `listSearchStringsMatchRecipes`.

**Wiring**
- `npm run test:acceptance` runs `mocha --require spec/helpers/acceptance/init --timeout 15000 "spec/acceptance/**/*.spec.js"`.
- `.gitignore` has the new `.env.acceptance` entry.
- The README has a Development row and an "Acceptance tests" section.
- `spec/acceptance` is linted. `spec/helpers` stays ignored, as before.

**How to run:** `npm start` and wait for "Recipe cache primed" (about 20s), then run `npm run test:acceptance` in another terminal.

**Alternatives declined**
- **vitest + TypeScript like feral:** the repo is mocha + JS.
- **`test/acceptance/` like feral:** the user wants `spec/acceptance` with its own helpers directory.
- **A required caller param:** there's no auth.
- **Checking only one recipe:** the full sweeps take about 2s each and caught the trailing-dot quirk.

**Verification:**
- **Results:** 10 passing against the real service, with the local `.env` token now valid, both before and after the fixes. Unit tests went from 70 to 76, integration stays at 6, and lint and coverage-check are clean.
- **Checks can fail:** every driver check was confirmed to fail on tampered responses: a missing field, an empty list, a duplicate id, uppercase, wrong types, a wrong id, a missing named recipe, and a known id treated as unknown. The two fixed checks were seen failing against the unfixed service: the key-lime-pie mismatch and the `text/html` 404.
- **Live service after the fixes:** `key.lime.pie`, no search string ends in `.`, and the 404 is `application/json`.
- **Layering:** `fetch(` appears only in `http-client.js`, chai is required only in `assertions.js`, specs require only `acceptance-dsl`, and nothing requires `lib/`.

**Open notes**
- There are no `DocumentsCurrentBehavior` markers left.
- Tests run against whatever is in the recipes repo. A bad recipe file pushed there will fail the sweeps, which is intended.
