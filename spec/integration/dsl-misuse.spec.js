const { createIntegrationDsl } = require('../helpers/integration/dsl/integration-dsl');

describe('the integration DSL', () => {
  const {
    recipeCache, recipes, misuse, cleanup,
  } = createIntegrationDsl();

  afterEach(cleanup);

  it('rejects a misspelled parameter before calling the app', async () => {
    await misuse.expectStepRejected(
      () => recipes.checkRecipe('recipee: pancakes'),
      "unknown parameter: 'recipee'",
      'missing required parameter: recipe',
    );
  });

  it('rejects a step that takes no parameters when given one', async () => {
    await misuse.expectStepRejected(
      () => recipes.checkUnknownRecipeIsNotFound('recipe: pancakes'),
      "unknown parameter: 'recipe'",
    );
  });

  it('rejects an outcome it does not know', async () => {
    await misuse.expectStepRejected(
      () => recipeCache.refresh('expect: works'),
      "'works'",
    );
  });
});
