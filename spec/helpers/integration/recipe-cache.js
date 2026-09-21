const nock = require('nock');

const dependencies = require('../../../lib/dependencies');
const githubMock = require('./github-mock');

// fills the app's singleton recipe cache from the mocked github responses
const primeRecipeCache = async (list = githubMock.recipes) => {
  githubMock.mockAllRecipes(list);
  await dependencies.recipeCache.refreshCache();
  nock.cleanAll();
};

module.exports = {
  primeRecipeCache,
};
