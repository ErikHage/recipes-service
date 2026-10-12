const { createIntegrationDsl } = require('../../helpers/integration/dsl/integration-dsl');

describe('Recipe cache refresh from GitHub (integration)', () => {
  const {
    github, recipeCache, recipes, cleanup,
  } = createIntegrationDsl();

  afterEach(cleanup);

  it('fetches the listing and every recipe file', async () => {
    await github.hasRecipe('recipe: pancakes');
    await github.hasRecipe('recipe: tomato-soup');

    await recipeCache.refresh('expect: succeeds');

    await github.checkEveryFileWasFetched();
    await recipes.checkRecipe('recipe: pancakes');
    await recipes.checkRecipe('recipe: tomato-soup');
  });

  it('fails when GitHub returns an error', async () => {
    await github.failsToList('status: 500');

    await recipeCache.refresh('expect: is rejected');
  });
});
