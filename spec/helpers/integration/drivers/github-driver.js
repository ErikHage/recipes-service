const { expectTrue } = require('./assertions');

/**
 * The mocked GitHub repo the app loads its recipes from.
 *
 * Arrangers add to what the mock serves and return the fixture, so the DSL can
 * name it; expectations check what the app asked GitHub for.
 */
const createGithubDriver = (githubMock) => ({
  /** Serves `recipe` (an aRecipe() fixture) from the repo, and returns it. */
  serves(recipe) {
    githubMock.serve(recipe);

    return recipe;
  },

  /** Makes listing the repo fail with `status`. */
  listingFailsWith(status) {
    githubMock.failListing(status);
  },

  /** The app fetched the listing and every file it named: no interceptor is left unused. */
  everyServedFileWasFetched() {
    const pending = githubMock.pendingCalls();

    expectTrue(
      pending.length === 0,
      `refreshing the recipe cache\n  expected: the listing and every recipe file fetched from GitHub\n  never fetched:\n    ${pending.join('\n    ')}`,
    );
  },
});

module.exports = {
  createGithubDriver,
};
