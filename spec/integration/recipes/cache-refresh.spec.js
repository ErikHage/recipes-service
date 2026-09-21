const nock = require('nock');

const dependencies = require('../../../lib/dependencies');
const githubMock = require('../../helpers/integration/github-mock');

describe('Recipe cache refresh from github (integration)', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('when github responds successfully', () => {
    it('should fetch the listing and every recipe file', async () => {
      githubMock.mockAllRecipes();

      await dependencies.recipeCache.refreshCache();

      expect(nock.pendingMocks()).to.be.empty();
      githubMock.recipes.forEach(({ sha }) => {
        expect(dependencies.recipeCache.getRecipe(sha)).to.exist();
      });
    });
  });

  describe('when github returns an error', () => {
    it('should reject refreshCache', async () => {
      githubMock.mockListingError(500);

      let error;
      try {
        await dependencies.recipeCache.refreshCache();
      } catch (err) {
        error = err;
      }

      expect(error).to.exist();
      expect(error.status).to.equal(500);
    });
  });
});
