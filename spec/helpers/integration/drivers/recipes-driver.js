const {
  expectBodyToEqual,
  expectContentType,
  expectListBody,
  expectStatus,
  expectThat,
} = require('./assertions');
const { status } = require('../support/status-codes');

/**
 * GET /recipes and GET /recipes/:recipeId.
 *
 * Every status code, header and field name the suite knows about these two
 * endpoints lives here. Methods take the recipe fixtures a spec declared --
 * `{ filename, sha, content }` from support/github-mock.js -- and, unlike the
 * acceptance driver, can check the exact values the service should return for
 * them.
 *
 * The rules for deriving those values are re-stated here, not imported from
 * lib/, so a change to them breaks a test instead of agreeing with it.
 */

/** `tomato-soup.json` -> `Tomato Soup`: how the list names a recipe, from its filename. */
const nameFromFilename = (filename) => filename
  .split('.')[0]
  .split('-')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

/** The recipe's own name + keywords, joined with `.` and lowercased. */
const filterMatchString = ({ recipeName, keywords = [] }) => [
  recipeName.split(' ').join('.'),
  ...keywords,
].join('.').toLowerCase();

const expectedSummary = (recipe) => ({
  recipeId: recipe.sha,
  filename: recipe.filename,
  recipeName: nameFromFilename(recipe.filename),
  filterMatchString: filterMatchString(recipe.content),
});

/** The file's content with its id, and `nutrition: {}` when the file has none. */
const expectedRecipe = (recipe) => ({
  recipeId: recipe.sha,
  ...recipe.content,
  nutrition: recipe.content.nutrition || {},
});

/** Summaries in a fixed key order, so two lists compare by their text. */
const asText = (summary) => JSON.stringify({
  recipeId: summary.recipeId,
  filename: summary.filename,
  recipeName: summary.recipeName,
  filterMatchString: summary.filterMatchString,
});

const createRecipesDriver = (client) => ({
  /** The list holds a summary of each of `recipes` and nothing else, in any order. */
  async listIsExactly(recipes) {
    const what = `listing recipes, expecting ${recipes.map((recipe) => recipe.filename).join(', ') || 'none'}`;
    const response = await client.get('/recipes');

    expectStatus(response, status.OK, what);

    const listed = expectListBody(response, what).map(asText);
    const expected = recipes.map(expectedSummary).map(asText);
    const missing = expected.filter((summary) => !listed.includes(summary));
    const unexpected = listed.filter((summary) => !expected.includes(summary));

    expectThat(
      missing.length === 0 && unexpected.length === 0,
      `exactly these summaries:\n    ${expected.join('\n    ')}\n  missing:\n    ${missing.join('\n    ')}\n  unexpected:\n    ${unexpected.join('\n    ')}`,
      response,
      what,
    );
  },

  /** Fetches `recipe` by id; it comes back as the file holds it. */
  async getReturnsRecipe(recipe) {
    const what = `fetching recipe ${recipe.filename} (${recipe.sha})`;
    const response = await client.get(`/recipes/${encodeURIComponent(recipe.sha)}`);

    expectStatus(response, status.OK, what);
    expectBodyToEqual(response, expectedRecipe(recipe), what);
  },

  /** Replies 404 with a JSON error body naming RECIPE_NOT_FOUND. */
  async getOfUnknownIdIsNotFound(recipeId) {
    const what = `fetching unknown recipe "${recipeId}"`;
    const response = await client.get(`/recipes/${encodeURIComponent(recipeId)}`);

    expectStatus(response, status.NOT_FOUND, what);
    expectContentType(response, 'application/json', what);
    expectBodyToEqual(response, {
      errors: [{
        status: status.NOT_FOUND,
        code: 'RECIPE_NOT_FOUND',
        source: 'recipes-service',
        message: 'Recipe not found',
      }],
    }, what);
  },
});

module.exports = {
  createRecipesDriver,
};
