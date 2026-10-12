const { createDrivers } = require('../drivers/drivers');
const { createGithubMock } = require('./github-mock');
const { createHttpClient } = require('./http-client');
const { createRecipeCacheClient } = require('./app');

/**
 * Per-spec plumbing: the in-process app, the GitHub mock it loads from, the
 * drivers built over them, and the reset that puts all of it back.
 *
 * Knows nothing about the names a spec uses -- that is dsl/world.js, which
 * wraps one of these. Specs never see it.
 */
const createTestContext = () => {
  const githubMock = createGithubMock();
  const recipeCache = createRecipeCacheClient({ beforeRefresh: () => githubMock.install() });

  return {
    /** Built once; stateless, so one set serves the whole spec. */
    drivers: createDrivers({ client: createHttpClient(), recipeCache, githubMock }),

    /** Empties the app's recipe cache and removes every GitHub mock. */
    async cleanup() {
      githubMock.reset();
      recipeCache.reset();
    },
  };
};

module.exports = {
  createTestContext,
};
