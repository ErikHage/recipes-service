const { createIntegrationDsl } = require('../../helpers/integration/dsl/integration-dsl');

describe('GET /recipes (integration)', () => {
  const {
    github, recipeCache, recipes, cleanup,
  } = createIntegrationDsl();

  afterEach(cleanup);

  it('lists a summary of every recipe GitHub serves', async () => {
    await github.hasRecipe('recipe: pancakes', 'keywords: breakfast, sweet');
    await github.hasRecipe('recipe: tomato-soup');
    await recipeCache.refresh('expect: succeeds');

    await recipes.checkListIsExactly('recipes: pancakes, tomato-soup');
  });
});
