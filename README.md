# recipes-service

A read-only REST API for recipes. The recipes are stored as JSON files in the `json/` directory of the GitHub repo [`ErikHage/my-recipes`](https://github.com/ErikHage/my-recipes). This service is the backend for `voracious-appetite-app`.

## Features

- **Recipes come from GitHub.** Every recipe file is loaded through the GitHub contents API (`@octokit/rest`) into an in-memory cache, keyed by each file's git SHA.
- **Served from the cache.** The cache is filled at startup and refreshed every 24 hours. API requests never call GitHub.
  - If the first load at startup fails, the process exits with code `69`.
  - If a later refresh fails, the error is logged and the service keeps serving the previous cache.
- **Derived fields:**
  - **Display name** comes from the filename (`tomato-soup.json` → `Tomato Soup`).
  - **`filterMatchString`** is a lowercase string of the recipe name and keywords joined with `.` (e.g. `pancakes.breakfast.sweet`), for client-side search. A recipe with no keywords gets its name alone.
- **CORS** is allowed from any origin.

## API

Base path: `/api/recipes-service`

| Method | Path                  | Description                  |
|--------|-----------------------|------------------------------|
| GET    | `/recipes`            | Lists every recipe (summary) |
| GET    | `/recipes/:recipeId`  | Gets one full recipe         |

### `GET /recipes`

```sh
curl http://localhost:3000/api/recipes-service/recipes
```

`200 OK`:

```json
[
  {
    "recipeId": "3f9c2e...",
    "filename": "pancakes.json",
    "recipeName": "Pancakes",
    "filterMatchString": "pancakes.breakfast.sweet"
  }
]
```

### `GET /recipes/:recipeId`

`recipeId` is the `recipeId` returned by `GET /recipes`, which is the recipe file's git SHA.

```sh
curl http://localhost:3000/api/recipes-service/recipes/3f9c2e...
```

`200 OK`:

```json
{
  "recipeId": "3f9c2e...",
  "recipeName": "Pancakes",
  "prep": { "kind": "minutes", "value": 10 },
  "cook": { "kind": "minutes", "value": 15 },
  "yield": { "kind": "servings", "value": 4 },
  "ingredients": [
    { "quantity": { "kind": "cups", "value": 2 }, "name": "flour", "notes": "sifted" }
  ],
  "steps": [
    { "id": 1, "text": "Mix everything" }
  ],
  "keywords": ["breakfast", "sweet"],
  "nutrition": { "calories": 250, "fats": 8, "carbohydrates": 35, "sugars": 6, "protein": 7 }
}
```

- If the recipe has no nutrition data, `nutrition` is `{}`.
- An unknown `recipeId` returns `404`:

```json
{ "errors": [{ "status": 404, "code": "RECIPE_NOT_FOUND", "source": "recipes-service", "message": "Recipe not found" }] }
```

Every error the API raises comes back as JSON in this `errors` shape. An unexpected failure returns `500` with a generic message, so internal details (e.g. from GitHub) aren't exposed. Paths outside the API still get Express's default HTML 404.

## Recipe file format

Each file in `my-recipes/json/` is named in kebab case (e.g. `tomato-soup.json`). It has the same fields as the `GET /recipes/:recipeId` response, except `recipeId`.

- **Required:** `recipeName`, `prep`, `cook`, `yield`, `ingredients` and `steps`.
- **Optional:** `keywords`, `nutrition` and an ingredient's `notes`.

## Configuration

The service reads environment variables, either from the environment or from a `.env` file in the project root:

| Variable           | Required | Default | Description |
|--------------------|----------|---------|-------------|
| `GITHUB_API_TOKEN` | Yes      | —       | GitHub token with read access to the recipes repo's contents. If it's missing, the service logs an error and exits at startup. |
| `PORT`             | No       | `3000`  | The port the server listens on. |

Example `.env`:

```sh
GITHUB_API_TOKEN=<your-github-token>
PORT=3000
```

**Other settings** are set in code:

- **Recipe source:** the GitHub owner and repo are `githubConfig.owner` and `githubConfig.recipesRepo` in `lib/helpers/constants.js`. Change them there to use a different repo.
- **Logging** (winston, `lib/helpers/logging.js`):
  - Debug and above go to the console.
  - Info and above go to `./logs/rwb.log`, which rotates at 10 files of 10 MB each.

## Running

Requires **Node.js 20 or newer**. The Docker image uses Node 24.

```sh
npm install
npm start
```

With Docker:

```sh
docker build -t recipes-service .
docker run -p 3000:3000 -e GITHUB_API_TOKEN=<your-github-token> recipes-service
```

## Development

| Script                     | Description |
|----------------------------|-------------|
| `npm run test:unit`        | Unit tests (`spec/unit`) |
| `npm run test:integration` | Integration tests (`spec/integration`). They run the app in-process and mock GitHub with nock, so there's no network access. |
| `npm run test:acceptance`  | Acceptance tests (`spec/acceptance`) against a running service. See below. |
| `npm run lint`             | ESLint (airbnb-base). Use `lint-fix` to auto-fix. |
| `npm run coverage`         | Unit test coverage, written to `spec/coverage` |
| `npm run coverage-check`   | Runs the unit tests and enforces the thresholds in `.nycrc` |
| `npm run coverage-update`  | Raises the thresholds in `.nycrc` to the current coverage |

The unit and integration tests set a dummy `GITHUB_API_TOKEN`, so no real token is needed.

### Acceptance tests

Black-box tests that call the running service over real HTTP. They use the live recipes from GitHub, so they check shape and rules rather than specific recipes.

```sh
npm start                  # in one terminal; needs a valid GITHUB_API_TOKEN. Wait for "Recipe cache primed"
npm run test:acceptance    # in another
```

They call `http://localhost:3000/api/recipes-service` by default. To change that, set `ACCEPTANCE_BASE_URL` (and optionally `ACCEPTANCE_REQUEST_TIMEOUT_MS`) in the shell or in `spec/helpers/acceptance/.env.acceptance`; see `.env.acceptance.example` there. Before any test runs, a check stops the suite with a message if the service is unreachable, returns an error, or has no recipes.

**How they're organized:**
- **Specs** (`spec/acceptance/`) are written as prose, using `"name: value"` steps.
- **DSL modules** (`spec/helpers/acceptance/dsl/`) parse those steps with [`@feral-auth/ts-simple-dsl`](https://www.npmjs.com/package/@feral-auth/ts-simple-dsl). It's pinned to an exact version because it's a pre-1.0 alpha.
- **Drivers** (`spec/helpers/acceptance/drivers/`) make the HTTP calls and hold every assertion.

Nothing in the suite requires `lib/`. If the service gets something wrong, the test checks what it does today and is marked `// DocumentsCurrentBehavior`, with a note saying what it should do. There are none at the moment.

Feature notes and decisions are kept in [`docs/`](docs/).
