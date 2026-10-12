const { parseDslArgs } = require('@feral-auth/ts-simple-dsl');

const { outcome } = require('./params');

/**
 * The app's recipe cache, in words. A spec refreshes it once it has declared
 * what GitHub serves; until then the app knows no recipes.
 */
const createRecipeCacheDsl = (world, recipeCache) => ({
  /**
   * `expect: succeeds | is rejected`. Loads what GitHub serves into the app.
   * `is rejected` needs a failure declared with github.failsToList(...), and
   * checks the refresh passes on its status.
   */
  async refresh(...args) {
    const params = parseDslArgs(args, { expect: outcome('succeeds', 'is rejected') });

    if (params.expect === 'is rejected') {
      return recipeCache.refreshIsRejectedWithStatus(world.listingFailure());
    }
    return recipeCache.refreshSucceeds();
  },
});

module.exports = {
  createRecipeCacheDsl,
};
