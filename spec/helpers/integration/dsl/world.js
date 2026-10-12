const { createTestContext } = require('../support/test-context');

/**
 * What a spec has named so far.
 *
 * The DSL modules are stateless; a recipe declared in one step (on GitHub) is
 * checked in another (over the API), so the names live here. A name stands
 * for the fixture the spec declared, which holds the sha the app will know it
 * by.
 *
 * Wraps the test context, which holds the plumbing underneath (drivers,
 * mocks, the app's cache). One world per spec file.
 */
const createWorld = (testContext = createTestContext()) => {
  const recipesByAlias = new Map();
  let listingFailure;

  return {
    /** So a DSL module can be handed the driver it drives. */
    drivers: testContext.drivers,

    nameRecipe(alias, recipe) {
      if (recipesByAlias.has(alias)) {
        throw new Error(`a recipe called "${alias}" is already declared in this test -- give the second one another name`);
      }
      recipesByAlias.set(alias, recipe);
    },

    recipeNamed(alias) {
      const recipe = recipesByAlias.get(alias);

      if (recipe === undefined) {
        throw new Error(`no recipe called "${alias}" in this test -- declare one first with github.hasRecipe('recipe: ${alias}')`);
      }

      return recipe;
    },

    nameListingFailure(status) {
      listingFailure = status;
    },

    listingFailure() {
      if (listingFailure === undefined) {
        throw new Error("GitHub has not been told to fail in this test -- declare it first with github.failsToList('status: 500')");
      }

      return listingFailure;
    },

    /**
     * Forgets every name and resets the app and its mocks. The two happen
     * together, or a later test could resolve a name the app no longer has.
     */
    async cleanup() {
      recipesByAlias.clear();
      listingFailure = undefined;

      await testContext.cleanup();
    },
  };
};

module.exports = {
  createWorld,
};
