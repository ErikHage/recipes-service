# Integration Test DSL

Rewrites the integration suite in the spec → DSL → driver pattern from the `dsl-tests` skill, as the acceptance suite already is.

> Log rules: committed lines are never edited. Add new dated entries per commit. An entry stays editable until it's committed, and its date is the day it was last edited.

## 2026-10-12

**Goal:** Specs in `spec/integration/` read as prose (`"name: value"` strings only), through one entry module, `createIntegrationDsl()`. Assertions live in drivers. This is the first integration suite built this way: the skill's integration section was marked "derived, not yet proven", so what was learned here went back into the skill.

**Decisions**
- **Fixtures are declared per test, in prose**, replacing the fixed two-recipe list: `github.hasRecipe('recipe: pancakes', 'keywords: breakfast, sweet', 'nutrition: none')`. The alias is also the filename (`tomato-soup.json`); the sha gets an `int-` prefix and a random suffix. Drivers compare responses with the fixtures field by field.
- **Mocks are installed at refresh time**, not when declared, because the GitHub listing must name every recipe at once. `support/app.js` runs the mock's `install()` just before `refreshCache()`.
- **`cleanup` resets the app.** It forgets names, runs `nock.cleanAll()` and empties the app's recipe cache (`recipeCache.cache = {}`, from `support/` only). `refreshCache()` only ever adds, so without the reset one test's recipes would show up in the next test's list.
- **The cache refresh has its own seam**, like the http client. `support/app.js` returns `{ error }` and never throws, and `recipe-cache-driver` decides what that means. The cache-refresh spec checks the loaded recipes over HTTP, not via `recipeCache.getRecipe()`.
- **Outcome branching:** `recipeCache.refresh('expect: succeeds | is rejected')`. `is rejected` takes its status from the world, as declared by `github.failsToList('status: 500')`.
- **`console.error` is captured inside the http client** for each request, replacing the per-test sinon stub. The error-logger middleware writes there. The captured text goes into failure messages as `server log:`.
- **The integration init no longer sets a global chai `expect`.** Only `drivers/assertions.js` requires chai.
- **The GitHub repo path is re-declared** in `support/github-mock.js` rather than read from `lib/helpers/constants`, so the mocks stop answering if the app changes where it looks.
- **Copied, not shared**, from the acceptance suite: `assertions.js` (reduced to what's used, plus `expectBodyToEqual` and `serverLog` in messages), `params.js` (plus `outcome()`) and `dsl-misuse.js`. Each suite stays self-contained, and the grep checks work per suite. Declined: a shared `spec/helpers/dsl-common/`.
- **Declined for now:** pinning, as a `DocumentsCurrentBehavior` test, that a recipe deleted from GitHub stays in the cache until restart (the cache never drops entries). It was raised during planning, but it's outside this migration.

**Files**
- `spec/helpers/integration/dsl/`: `integration-dsl.js` (entry), `world.js`, `params.js`, `dsl-misuse.js`, `github-dsl.js`, `recipe-cache-dsl.js`, `recipes-dsl.js`
- `spec/helpers/integration/drivers/`: `drivers.js`, `assertions.js`, `github-driver.js`, `recipe-cache-driver.js`, `recipes-driver.js`
- `spec/helpers/integration/support/`: `app.js` (the only `lib/` import besides `init.js`), `http-client.js` (supertest adapter), `github-mock.js` (`aRecipe()` + nock), `status-codes.js`, `test-context.js`
- Removed: `spec/helpers/integration/github-mock.js`, `spec/helpers/integration/recipe-cache.js`
- Specs: `recipes/get-recipes.spec.js`, `recipes/get-recipe.spec.js`, `recipes/cache-refresh.spec.js` rewritten; `dsl-misuse.spec.js` added
- `README.md`: an "Integration tests" section

**Run:** `npm run test:integration`

**Status:** 9 passing (6 rewritten tests, plus a fixture for the 404 test and 3 misuse tests). Lint is clean. To show the tests can fail, three mutations were tried and each failed exactly one test: no lowercasing in `filterMatchString`, `null` instead of `{}` for missing nutrition, and `cleanup` not emptying the cache. The skill's layering greps are clean.

**Open notes**
- `spec/helpers` is in `.eslintignore`, so `npm run lint` doesn't check helpers. The new integration helpers pass `eslint --no-ignore`; the acceptance helpers have 7 errors there.
