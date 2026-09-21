const RecipesService = require('../../../lib/services/recipes');
const logger = require('../../../lib/helpers/logging');

const SOMETHING_WENT_WRONG = new Error('Something went wrong');
const ERROR_WAS_EXPECTED = new Error('An error was expected but was not thrown');

describe('Recipes Service', () => {
  let serviceInstance;
  let recipesCacheStub;

  const recipeId = 'some-recipe-id';
  const recipe = { sha: recipeId, recipeName: 'some-recipe-name' };

  beforeEach(() => {
    recipesCacheStub = {
      getRecipe: sinon.stub(),
      getRecipesMetadata: sinon.stub(),
    };
    sinon.stub(logger, 'error');

    serviceInstance = new RecipesService(recipesCacheStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('#getRecipes', () => {
    it('should return the metadata from the cache', async () => {
      const metadata = [{ sha: recipeId }];
      recipesCacheStub.getRecipesMetadata.returns(metadata);

      const result = await serviceInstance.getRecipes();

      expect(result).to.equal(metadata);
    });
  });

  describe('#getRecipe', () => {
    describe('when the recipe is cached', () => {
      it('should return the recipe', async () => {
        recipesCacheStub.getRecipe.returns(recipe);

        const result = await serviceInstance.getRecipe(recipeId);

        expect(result).to.equal(recipe);
        expect(recipesCacheStub.getRecipe).to.have.been.calledWith(recipeId);
      });
    });

    describe('when the recipe is not cached', () => {
      it('should throw a RECIPE_NOT_FOUND error', async () => {
        recipesCacheStub.getRecipe.returns(undefined);

        try {
          await serviceInstance.getRecipe(recipeId);
        } catch (err) {
          expect(err.code).to.equal('RECIPE_NOT_FOUND');
          expect(err.status).to.equal(404);
          expect(err.stack).to.include(recipeId);
          return;
        }
        throw ERROR_WAS_EXPECTED;
      });
    });

    describe('when the cache throws', () => {
      it('should log and rethrow the error', async () => {
        recipesCacheStub.getRecipe.throws(SOMETHING_WENT_WRONG);

        try {
          await serviceInstance.getRecipe(recipeId);
        } catch (err) {
          expect(err).to.equal(SOMETHING_WENT_WRONG);
          expect(logger.error).to.have.been.calledWith('error getting recipe', SOMETHING_WENT_WRONG);
          return;
        }
        throw ERROR_WAS_EXPECTED;
      });
    });
  });
});
