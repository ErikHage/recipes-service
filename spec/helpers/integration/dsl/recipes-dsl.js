const { randomBytes } = require('crypto');
const { parseDslArgs, required } = require('@feral-auth/ts-simple-dsl');

const { alias } = require('./params');

/**
 * The recipes API, in words. Every step takes `"name: value"` strings, resolves
 * the names it is given through the world and hands the fixtures to the
 * driver, which does all the checking.
 */
const createRecipesDsl = (world, recipes) => ({
  /** `recipes` (comma-separated aliases): the list holds exactly these, in any order. */
  async checkListIsExactly(...args) {
    const params = parseDslArgs(args, { recipes: required().multiple({ separator: ',' }) });

    await recipes.listIsExactly(params.recipes.map((name) => world.recipeNamed(name)));
  },

  /** `recipe`. Fetches it by id and checks it comes back as GitHub served it. */
  async checkRecipe(...args) {
    const params = parseDslArgs(args, { recipe: alias() });

    await recipes.getReturnsRecipe(world.recipeNamed(params.recipe));
  },

  /** Asks for an id no recipe has; nothing comes back. */
  async checkUnknownRecipeIsNotFound(...args) {
    parseDslArgs(args, {});

    await recipes.getOfUnknownIdIsNotFound(`int-no-such-recipe-${randomBytes(3).toString('hex')}`);
  },
});

module.exports = {
  createRecipesDsl,
};
