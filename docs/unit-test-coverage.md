# Unit Test Coverage

Unit tests cover every flow's branches and error cases. A coverage percentage isn't the goal.

> Log rules: committed lines are never edited. Add new dated entries per commit. An entry stays editable until it's committed, and its date is the day it was last edited.

## 2026-09-20

**Goal:** Review unit coverage by flow and fill every missing branch and error case.

**Findings before this work**
- Only the controller and serializer had working specs. `services/index.spec.js` and `services/datasource.spec.js` were `xdescribe`d and tested an old API (moment-based cache, superagent).
- There were no specs for the recipe cache, data mapper, primer, git-api-access, middleware, error factory/utils, validator or utilities.

**Decisions**
- Unused modules (`validator`, `error-factory`, `error-utils`, `utilities`) are tested anyway.
- Quirks get fixed when the consumer (`voracious-appetite-app`) won't break. Otherwise, tests pin the current behavior with a `// DocumentsCurrentBehavior` comment that says what the behavior should be. The consumer treats any non-2xx response the same way (`withApiErrorHandling` → a generic alert), so every fix below was non-breaking and nothing needed `DocumentsCurrentBehavior`.
- Out of scope: `constants.js` (data), `logging.js` (config), and `app.js`/`routes.js`/`dependencies.js` (wiring, covered by the integration tests).

**Fixes**
- Unknown recipe id → **404** `RECIPE_NOT_FOUND` (new in `lib/config/errors.json`, thrown by `RecipesService.getRecipe`). It used to be a 500 because the serializer crashed.
- `RecipePrimer` logs "Recipe cache primed" only on success.
- `validator` checked `result.err`, but joi 14 returns `result.error`, so validation never threw. Fixed.
- **errr 2.7 → ^5.2** and **Docker `node:18` → `node:24`**. errr 2.x calls `util.isUndefined`, which Node 23+ removed, so errors built with debug params crashed. errr 5 needs Node ≥ 20. Running the tests on a Node 18 install was considered and dropped in favor of upgrading.

**Setup**
- `spec/helpers/init.js` sets a dummy `GITHUB_API_TOKEN` and silences the logger, so unit tests run without `.env`.

**Files** (all under `spec/unit/`)
- Rewritten: `services/index.spec.js`, `services/datasource.spec.js` (stubs `getOctokit`; nock is no longer used)
- Extended: `serializers/recipes.spec.js` (no nutrition, empty list)
- New: `services/data-mapper.spec.js`, `data/recipe-cache.spec.js`, `helpers/recipe-primer.spec.js`, `helpers/git-api-access.spec.js`, `helpers/validator.spec.js`, `helpers/utilities.spec.js`, `middleware/try-decorator.spec.js`, `middleware/error-logger.spec.js`, `error/error-factory.spec.js`, `error/error-utils.spec.js`

**Run:** `npm run test-unit`. To see uncovered branches: `npx nyc --reporter=text mocha --require spec/helpers/init "spec/unit/**/*.spec.js"`

**Status:** 70 passing. Every in-scope file has 100% branch coverage. Integration tests: 6 passing.
