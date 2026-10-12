const { expectTrue } = require('./assertions');

/**
 * The app's recipe cache, refreshed from GitHub as the running service does on
 * startup and every 24 hours.
 */

const describeError = (error) => (error === undefined
  ? 'no error'
  : `${error.name}: ${error.message} (status ${error.status})`);

const createRecipeCacheDriver = (recipeCache) => ({
  /** Arranger: refreshes the cache and asserts it worked. */
  async refreshSucceeds() {
    const { error } = await recipeCache.refresh();

    expectTrue(
      error === undefined,
      `refreshing the recipe cache\n  expected: success\n  actual:   ${describeError(error)}`,
    );
  },

  /** The refresh rejects, passing on the status GitHub replied with. */
  async refreshIsRejectedWithStatus(status) {
    const { error } = await recipeCache.refresh();

    expectTrue(
      error !== undefined && error.status === status,
      `refreshing the recipe cache\n  expected: rejected with status ${status}\n  actual:   ${describeError(error)}`,
    );
  },
});

module.exports = {
  createRecipeCacheDriver,
};
