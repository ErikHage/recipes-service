const { randomBytes } = require('crypto');
const { optional, parseDslArgs } = require('@feral-auth/ts-simple-dsl');

const { alias, named } = require('./params');

/**
 * Recipes, in words. Every step takes `"name: value"` strings, resolves the
 * names it is given through the world and hands plain values to the driver,
 * which does all the checking. Steps return nothing: a picked recipe goes into
 * the world under its name, not back to the spec.
 */
const createRecipesDsl = (world, recipes) => ({
  /** `recipe` (the alias), optional `named` (a listed recipeName; default: the first listed). */
  async pickRecipe(...args) {
    const params = parseDslArgs(args, { recipe: alias(), named: named() });

    world.nameRecipe(params.recipe, await recipes.findListed(params.named));
  },

  /** Every listed entry has a recipeId, filename, recipeName and filterMatchString. */
  async checkEveryListedRecipeIsSummarised(...args) {
    parseDslArgs(args, {});

    await recipes.listReturnsSummaries();
  },

  /** No recipeId appears twice in the list. */
  async checkListedIdsAreUnique(...args) {
    parseDslArgs(args, {});

    await recipes.listHasUniqueIds();
  },

  async checkSearchStringsAreLowercase(...args) {
    parseDslArgs(args, {});

    await recipes.listSearchStringsAreLowercase();
  },

  /** Optional `origin`: the Origin a browser would send. */
  async checkListAllowsAnyOrigin(...args) {
    const params = parseDslArgs(args, { origin: optional().withDefault('https://example.test') });

    await recipes.listAllowsAnyOrigin(params.origin);
  },

  /** `recipe`. Fetches it by id and checks it comes back in full. */
  async checkRecipe(...args) {
    const params = parseDslArgs(args, { recipe: alias() });

    await recipes.getReturnsFullRecipe(world.recipeNamed(params.recipe));
  },

  /** Fetches every listed recipe and checks each comes back in full. */
  async checkEveryListedRecipeComesBackInFull(...args) {
    parseDslArgs(args, {});

    await recipes.everyListedRecipeComesBackInFull();
  },

  /** Every listed filterMatchString is its recipe's own name and keywords, lowercased. */
  async checkSearchStringsMatchTheirRecipes(...args) {
    parseDslArgs(args, {});

    await recipes.listSearchStringsMatchRecipes();
  },

  /** Asks for an id no recipe has; nothing comes back. */
  async checkUnknownRecipeIsNotFound(...args) {
    parseDslArgs(args, {});

    await recipes.getOfUnknownIdIsNotFound(`acc-no-such-recipe-${randomBytes(3).toString('hex')}`);
  },
});

module.exports = {
  createRecipesDsl,
};
