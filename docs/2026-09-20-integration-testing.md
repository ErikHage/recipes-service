# Integration Testing

Tests the running service end to end (Express app → controller → service → cache → datasource → Octokit), with GitHub HTTP calls mocked. No full acceptance tests, and no real network.

> Log rules: committed lines are never edited. Add new dated entries per commit. An entry stays editable until it's committed, and its date is the day it was last edited.

## 2026-09-20

**Goal:** Integration tests for the service that mock outbound HTTP instead of calling GitHub.

**Decisions**
- **nock ^14** (upgraded from 11): `@octokit/rest` v20 uses native `fetch`, which nock < 14 can't intercept.
- **supertest** runs `lib/app.js` in-process. Each `request(app)` starts a temporary HTTP server on a random port, so `bin/server` is never started. Its startup code (port handling, listen errors, prime on listen) isn't covered. This was a deliberate choice; starting the real server once in a root hook was considered and declined.
- The cache is primed by calling `recipeCache.refreshCache()` directly. `recipePrimer.prime()` isn't used because it sets a 24h timer and can call `process.exit`.
- A dummy `GITHUB_API_TOKEN` is set before `lib/` loads (a missing token exits the process). dotenv won't override it, so the real `.env` token is never used.
- `nock.disableNetConnect()` makes any unmocked outbound call fail. Only `127.0.0.1` is allowed.
- The app logger ignores `LOGGING_LEVEL`, so its transports are silenced in the integration init.
- Layout: specs go in `spec/integration/`, grouped by domain directory and one file per API/functionality. Helpers go in `spec/helpers/integration/`, separate from the unit helpers.
- Each spec file primes the cache itself, so every file can run on its own.

**Files**
- `spec/helpers/integration/init.js`: mocha `--require` setup (chai, token, net lock, silenced logger)
- `spec/helpers/integration/github-mock.js`: fixture recipes and nock helpers for the GitHub contents API
- `spec/helpers/integration/recipe-cache.js`: `primeRecipeCache()` fills the app's cache from the mocks
- `spec/integration/recipes/get-recipes.spec.js`: `GET /recipes`
- `spec/integration/recipes/get-recipe.spec.js`: `GET /recipes/:recipeId`, including an unknown id
- `spec/integration/recipes/cache-refresh.spec.js`: cache refresh from GitHub (success and failure)

**Run:** `npm run test-int`

**Status:** 6 passing.

**Open notes**
- An unknown recipe id currently returns 500, because the serializer throws on `undefined`. The test pins this behavior, so update it if the service gets a proper 404.

## 2026-09-20

**Change:** An unknown recipe id now returns **404** (`RECIPE_NOT_FOUND`). `RecipesService.getRecipe` throws it when the cache misses, and the serializer no longer crashes on `undefined`. `get-recipe.spec.js` now expects 404. This resolves the previous open note. Details are in `docs/2026-09-20-unit-test-coverage.md`.

**Status:** 6 passing.
