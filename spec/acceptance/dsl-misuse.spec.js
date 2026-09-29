const { createAcceptanceDsl } = require('../helpers/acceptance/dsl/acceptance-dsl');

describe('the acceptance DSL', () => {
  const { recipes, misuse, cleanup } = createAcceptanceDsl();

  afterEach(cleanup);

  it('rejects a misspelled parameter before calling the service', async () => {
    await misuse.expectStepRejected(
      () => recipes.pickRecipe('recipee: any'),
      "unknown parameter: 'recipee'",
      'missing required parameter: recipe',
    );
  });

  it('rejects a step that takes no parameters when given one', async () => {
    await misuse.expectStepRejected(
      () => recipes.checkUnknownRecipeIsNotFound('recipe: any'),
      "unknown parameter: 'recipe'",
    );
  });
});
