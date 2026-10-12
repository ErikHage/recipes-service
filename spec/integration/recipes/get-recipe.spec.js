const { createIntegrationDsl } = require('../../helpers/integration/dsl/integration-dsl');

describe('GET /recipes/:recipeId (integration)', () => {
  const {
    github, recipeCache, recipes, cleanup,
  } = createIntegrationDsl();

  afterEach(cleanup);

  it('returns the full recipe', async () => {
    await github.hasRecipe('recipe: pancakes', 'keywords: breakfast, sweet');
    await recipeCache.refresh('expect: succeeds');

    await recipes.checkRecipe('recipe: pancakes');
  });

  it('returns an empty nutrition object when the recipe has none', async () => {
    await github.hasRecipe('recipe: tomato-soup', 'nutrition: none');
    await recipeCache.refresh('expect: succeeds');

    await recipes.checkRecipe('recipe: tomato-soup');
  });

  it('finds no recipe for an unknown id', async () => {
    await github.hasRecipe('recipe: pancakes');
    await recipeCache.refresh('expect: succeeds');

    await recipes.checkUnknownRecipeIsNotFound();
  });
});
