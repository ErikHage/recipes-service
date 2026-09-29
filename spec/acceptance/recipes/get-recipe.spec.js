const { createAcceptanceDsl } = require('../../helpers/acceptance/dsl/acceptance-dsl');

describe('GET /recipes/:recipeId (acceptance)', () => {
  const { recipes, cleanup } = createAcceptanceDsl();

  afterEach(cleanup);

  it('returns a listed recipe in full', async () => {
    await recipes.pickRecipe('recipe: any');

    await recipes.checkRecipe('recipe: any');
  });

  it('returns every listed recipe in full', async () => {
    await recipes.checkEveryListedRecipeComesBackInFull();
  });

  it('finds no recipe for an unknown id', async () => {
    await recipes.checkUnknownRecipeIsNotFound();
  });
});
