const { createAcceptanceDsl } = require('../../helpers/acceptance/dsl/acceptance-dsl');

describe('GET /recipes (acceptance)', () => {
  const { recipes, cleanup } = createAcceptanceDsl();

  afterEach(cleanup);

  it('lists every recipe as a summary', async () => {
    await recipes.checkEveryListedRecipeIsSummarised();
  });

  it('lists each recipe once', async () => {
    await recipes.checkListedIdsAreUnique();
  });

  it('gives every recipe a lowercase search string', async () => {
    await recipes.checkSearchStringsAreLowercase();
  });

  it('builds each search string from the recipe name and keywords', async () => {
    await recipes.checkSearchStringsMatchTheirRecipes();
  });

  it('can be called from any origin', async () => {
    await recipes.checkListAllowsAnyOrigin('origin: https://example.test');
  });
});
