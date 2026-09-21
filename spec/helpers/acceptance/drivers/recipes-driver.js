const {
  expectContentType,
  expectHeader,
  expectNonEmptyList,
  expectObjectBody,
  expectStatus,
  expectThat,
} = require('./assertions');
const { status } = require('../support/status-codes');

/**
 * GET /recipes and GET /recipes/:recipeId.
 *
 * Every status code, header and field name the suite knows about these two
 * endpoints lives here. Methods take plain values -- a recipe summary as the
 * list returned it, an id, an origin -- and either assert or return data.
 *
 * The recipes are live data from the GitHub repo, so nothing here expects a
 * particular recipe. The checks are about shape and the rules the service
 * promises: see the README's API section.
 */

const SUMMARY_FIELDS = ['recipeId', 'filename', 'recipeName', 'filterMatchString'];
const NUTRITION_FIELDS = ['calories', 'fats', 'carbohydrates', 'sugars', 'protein'];

const isNonEmptyString = (value) => typeof value === 'string' && value.length > 0;
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumberOrNull = (value) => value === null || typeof value === 'number';

/** The name + keywords, joined with `.` and lowercased -- the rule the README states. */
const expectedFilterMatchString = (recipe) => [
  recipe.recipeName.split(' ').join('.'),
  ...(recipe.keywords || []),
].join('.').toLowerCase();

/** Returns what is wrong with a summary entry, in words; empty when nothing is. */
const summaryProblems = (entry) => SUMMARY_FIELDS
  .filter((field) => !isNonEmptyString(entry[field]))
  .map((field) => `${field} is not a non-empty string`);

/** Returns what is wrong with a full recipe, in words; empty when nothing is. */
const recipeProblems = (recipe) => {
  const problems = [];
  const problem = (text) => problems.push(text);

  if (!isNonEmptyString(recipe.recipeName)) problem('recipeName is not a non-empty string');

  ['prep', 'cook', 'yield'].forEach((field) => {
    const measure = recipe[field];
    if (!isObject(measure)) {
      problem(`${field} is not an object`);
      return;
    }
    if (typeof measure.kind !== 'string') problem(`${field}.kind is not a string`);
    if (typeof measure.value !== 'number') problem(`${field}.value is not a number`);
  });

  if (!Array.isArray(recipe.ingredients)) {
    problem('ingredients is not an array');
  } else {
    recipe.ingredients.forEach((ingredient, i) => {
      const at = `ingredients[${i}]`;
      if (!isObject(ingredient.quantity)) {
        problem(`${at}.quantity is not an object`);
      } else {
        if (typeof ingredient.quantity.kind !== 'string') problem(`${at}.quantity.kind is not a string`);
        // some recipes write quantities like "1/2", so a string is as valid as a number
        if (!['number', 'string'].includes(typeof ingredient.quantity.value)) {
          problem(`${at}.quantity.value is neither a number nor a string`);
        }
      }
      if (!isNonEmptyString(ingredient.name)) problem(`${at}.name is not a non-empty string`);
      if (ingredient.notes !== undefined && ingredient.notes !== null && typeof ingredient.notes !== 'string') {
        problem(`${at}.notes is not a string`);
      }
    });
  }

  if (!Array.isArray(recipe.steps)) {
    problem('steps is not an array');
  } else {
    recipe.steps.forEach((step, i) => {
      if (typeof step.id !== 'number') problem(`steps[${i}].id is not a number`);
      if (typeof step.text !== 'string') problem(`steps[${i}].text is not a string`);
    });
  }

  if (recipe.keywords !== undefined
    && !(Array.isArray(recipe.keywords) && recipe.keywords.every((k) => typeof k === 'string'))) {
    problem('keywords is not an array of strings');
  }

  if (!isObject(recipe.nutrition)) {
    problem('nutrition is not an object ({} when the recipe has none)');
  } else {
    Object.keys(recipe.nutrition)
      .filter((field) => !NUTRITION_FIELDS.includes(field))
      .forEach((field) => problem(`nutrition.${field} is not a known nutrition field`));
    NUTRITION_FIELDS
      .filter((field) => recipe.nutrition[field] !== undefined && !isNumberOrNull(recipe.nutrition[field]))
      .forEach((field) => problem(`nutrition.${field} is neither a number nor null`));
  }

  return problems;
};

const listProblems = (entries, problemsOf) => entries
  .map((entry, i) => ({ i, problems: problemsOf(entry) }))
  .filter(({ problems }) => problems.length > 0)
  .map(({ i, problems }) => `[${i}] ${entries[i].filename || entries[i].recipeId}: ${problems.join(', ')}`);

const createRecipesDriver = (client) => {
  const listRecipes = async (what) => {
    const response = await client.get('/recipes');

    expectStatus(response, status.OK, what);

    return { response, entries: expectNonEmptyList(response, what) };
  };

  const getRecipe = async (recipeId, what) => {
    const response = await client.get(`/recipes/${encodeURIComponent(recipeId)}`);

    expectStatus(response, status.OK, what);

    return { response, recipe: expectObjectBody(response, what) };
  };

  return {
    /**
     * Returns the summary entry for the recipe called `named`, or the first
     * one listed when `named` is undefined. Asserts it is there.
     */
    async findListed(named) {
      const what = named === undefined ? 'picking a listed recipe' : `picking the listed recipe "${named}"`;
      const { response, entries } = await listRecipes(what);
      const match = named === undefined
        ? entries[0]
        : entries.find((entry) => entry.recipeName === named);

      expectThat(match !== undefined, `a listed recipe named "${named}"`, response, what);

      return match;
    },

    async listReturnsSummaries() {
      const what = 'listing recipes, every entry a summary';
      const { response, entries } = await listRecipes(what);
      const problems = listProblems(entries, summaryProblems);

      expectThat(
        problems.length === 0,
        `every entry to have ${SUMMARY_FIELDS.join(', ')}; problems:\n    ${problems.join('\n    ')}`,
        response,
        what,
      );
    },

    async listHasUniqueIds() {
      const what = 'listing recipes, each id once';
      const { response, entries } = await listRecipes(what);
      const ids = entries.map((entry) => entry.recipeId);
      const repeated = ids.filter((id, i) => ids.indexOf(id) !== i);

      expectThat(repeated.length === 0, `no repeated recipeId, but saw ${repeated.join(', ')}`, response, what);
    },

    async listSearchStringsAreLowercase() {
      const what = 'listing recipes, search strings lowercase';
      const { response, entries } = await listRecipes(what);
      const offenders = entries
        .filter((entry) => entry.filterMatchString !== entry.filterMatchString.toLowerCase())
        .map((entry) => entry.filterMatchString);

      expectThat(offenders.length === 0, `lowercase filterMatchStrings, but saw ${offenders.join(', ')}`, response, what);
    },

    async listAllowsAnyOrigin(origin) {
      const what = `listing recipes from origin ${origin}`;
      const response = await client.withHeaders({ origin }).get('/recipes');

      expectStatus(response, status.OK, what);
      expectHeader(response, 'access-control-allow-origin', '*', what);
    },

    async getReturnsFullRecipe(summary) {
      const what = `fetching recipe "${summary.recipeName}" (${summary.recipeId})`;
      const { response, recipe } = await getRecipe(summary.recipeId, what);
      const problems = recipeProblems(recipe);

      expectThat(recipe.recipeId === summary.recipeId, `recipeId ${summary.recipeId}`, response, what);
      expectThat(
        problems.length === 0,
        `a well-formed recipe; problems:\n    ${problems.join('\n    ')}`,
        response,
        what,
      );
    },

    /** Fetches every listed recipe; each must come back in full, as getReturnsFullRecipe checks. */
    async everyListedRecipeComesBackInFull() {
      const what = 'fetching every listed recipe';
      const { response, entries } = await listRecipes(what);
      const problems = [];

      // one at a time: the service answers from its cache, and this keeps failures in list order
      for (const summary of entries) {
        const detail = await client.get(`/recipes/${encodeURIComponent(summary.recipeId)}`);
        const label = `${summary.filename} (${summary.recipeId})`;

        if (detail.status !== status.OK) {
          problems.push(`${label}: status ${detail.status}`);
        } else {
          const found = recipeProblems(detail.body || {});
          if (detail.body && detail.body.recipeId !== summary.recipeId) found.push(`recipeId is ${detail.body.recipeId}`);
          if (found.length > 0) problems.push(`${label}: ${found.join(', ')}`);
        }
      }

      expectThat(
        problems.length === 0,
        `all ${entries.length} recipes well-formed; problems:\n    ${problems.join('\n    ')}`,
        response,
        what,
      );
    },

    /**
     * Each listed filterMatchString is built from the recipe's own name and
     * keywords -- not the name derived from its filename, which the list shows
     * as recipeName and which can differ.
     */
    async listSearchStringsMatchRecipes() {
      const what = 'the search string of every listed recipe';
      const { response, entries } = await listRecipes(what);
      const mismatches = [];

      for (const summary of entries) {
        const { recipe } = await getRecipe(summary.recipeId, `${what}: fetching ${summary.filename}`);
        const expected = expectedFilterMatchString(recipe);

        if (summary.filterMatchString !== expected) {
          mismatches.push(`${summary.filename}: expected "${expected}", listed "${summary.filterMatchString}"`);
        }
      }

      expectThat(
        mismatches.length === 0,
        `filterMatchStrings built from each recipe's name and keywords; mismatches:\n    ${mismatches.join('\n    ')}`,
        response,
        what,
      );
    },

    /** Replies 404 with a JSON error body naming RECIPE_NOT_FOUND. */
    async getOfUnknownIdIsNotFound(recipeId) {
      const what = `fetching unknown recipe "${recipeId}"`;
      const response = await client.get(`/recipes/${encodeURIComponent(recipeId)}`);

      expectStatus(response, status.NOT_FOUND, what);
      expectContentType(response, 'application/json', what);

      const { errors } = expectObjectBody(response, what);
      const [error] = Array.isArray(errors) ? errors : [];

      expectThat(
        error !== undefined && error.code === 'RECIPE_NOT_FOUND' && error.status === status.NOT_FOUND,
        `an errors list whose first entry has code RECIPE_NOT_FOUND and status ${status.NOT_FOUND}`,
        response,
        what,
      );
    },
  };
};

module.exports = {
  createRecipesDriver,
};
