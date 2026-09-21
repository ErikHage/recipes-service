const { createTestContext } = require('../support/test-context');

/**
 * What a spec has named so far.
 *
 * The DSL modules are stateless; a name given in one step is used by the
 * next, so it lives here. The recipes are live data, so a spec cannot know
 * their ids in advance -- it picks one from the list and names it, and later
 * steps refer to the same recipe by that name.
 *
 * Wraps the test context, which holds the plumbing underneath (drivers,
 * teardown). One world per spec file.
 */
const createWorld = (testContext = createTestContext()) => {
  const recipesByAlias = new Map();

  return {
    /** So a DSL module can be handed the driver it drives. */
    drivers: testContext.drivers,

    nameRecipe(alias, summary) {
      recipesByAlias.set(alias, summary);
    },

    recipeNamed(alias) {
      const summary = recipesByAlias.get(alias);

      if (summary === undefined) {
        throw new Error(`no recipe called "${alias}" in this test -- pick one first with pickRecipe('recipe: ${alias}')`);
      }

      return summary;
    },

    /**
     * Forgets every name and tears down what the spec created. The two happen
     * together, or a later test could resolve a name to something deleted.
     */
    async cleanup() {
      recipesByAlias.clear();

      await testContext.cleanup();
    },
  };
};

module.exports = {
  createWorld,
};
