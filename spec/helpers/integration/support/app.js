/**
 * The in-process service, and the one module in the suite that requires lib/.
 *
 * Specs, DSL modules and drivers never require lib/; they reach the app through
 * the http client and through this module's refresh and reset. Only support/
 * and init.js may load the code under test, because something has to start it
 * and put it in a known state.
 *
 * init.js sets the environment the app needs before this file is first loaded.
 */
const app = require('../../../../lib/app');
const dependencies = require('../../../../lib/dependencies');

/**
 * The app's recipe cache, refreshed the way the running service refreshes it,
 * but never throwing: like the http client, it reports what happened and
 * leaves the verdict to the drivers.
 *
 * `beforeRefresh` runs first. The test context uses it to install the GitHub
 * mocks, so the listing they serve holds every recipe the spec has declared.
 */
const createRecipeCacheClient = ({ beforeRefresh = () => {} } = {}) => ({
  /** Resolves to `{ error }`, where `error` is undefined when the refresh succeeded. */
  async refresh() {
    beforeRefresh();

    try {
      await dependencies.recipeCache.refreshCache();
      return { error: undefined };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Empties the cache. refreshCache() only ever adds recipes, so without this
   * one test's recipes would still be listed in the next test. There is no
   * public way to clear it, so this reaches into the field.
   */
  reset() {
    dependencies.recipeCache.cache = {};
  },
});

module.exports = {
  app,
  createRecipeCacheClient,
};
