const RecipeCache = require('../../../lib/data/recipe-cache');
const logger = require('../../../lib/helpers/logging');

const SOMETHING_WENT_WRONG = new Error('Something went wrong');
const ERROR_WAS_EXPECTED = new Error('An error was expected but was not thrown');

describe('Recipe Cache', () => {
  let cacheInstance;
  let datasourceStub;

  const buildMetadata = (i) => ({
    name: `Recipe ${i}`,
    filename: `recipe-${i}.json`,
    sha: `sha-${i}`,
  });

  const pancakesMetadata = { name: 'Pancakes', filename: 'pancakes.json', sha: 'sha-pancakes' };
  const pancakes = { recipeName: 'Fluffy Pancakes', keywords: ['Breakfast', 'sweet'] };

  beforeEach(() => {
    datasourceStub = {
      getRecipes: sinon.stub(),
      getRecipe: sinon.stub(),
    };
    sinon.stub(logger, 'info');
    sinon.stub(logger, 'error');

    cacheInstance = new RecipeCache(datasourceStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('#refreshCache', () => {
    describe('when there are no recipes', () => {
      it('should leave the cache empty', async () => {
        datasourceStub.getRecipes.resolves([]);

        await cacheInstance.refreshCache();

        expect(cacheInstance.cache).to.deep.equal({});
        expect(datasourceStub.getRecipe).to.not.have.been.called();
      });
    });

    describe('when there are recipes', () => {
      it('should fetch and cache each recipe by sha', async () => {
        datasourceStub.getRecipes.resolves([pancakesMetadata]);
        datasourceStub.getRecipe.withArgs('pancakes.json').resolves(pancakes);

        await cacheInstance.refreshCache();

        expect(cacheInstance.cache).to.deep.equal({
          'sha-pancakes': {
            ...pancakesMetadata,
            ...pancakes,
            filterMatchString: 'fluffy.pancakes.breakfast.sweet',
          },
        });
      });
    });

    describe('when there are more than 10 recipes', () => {
      it('should cache all of them and log progress every 10', async () => {
        const metadata = [...Array(12).keys()].map(buildMetadata);
        datasourceStub.getRecipes.resolves(metadata);
        datasourceStub.getRecipe.resolves({ recipeName: 'Some Recipe' });

        await cacheInstance.refreshCache();

        expect(Object.keys(cacheInstance.cache)).to.have.length(12);
        expect(logger.info).to.have.been.calledWith('fetched 10 recipes');
        expect(logger.info).to.have.been.calledWith('fetched 12 recipes');
      });
    });

    describe('when fetching the recipe list fails', () => {
      it('should log and rethrow the error', async () => {
        datasourceStub.getRecipes.rejects(SOMETHING_WENT_WRONG);

        try {
          await cacheInstance.refreshCache();
        } catch (err) {
          expect(err).to.equal(SOMETHING_WENT_WRONG);
          expect(logger.error).to.have.been.calledWith('Error refreshing cache');
          expect(logger.error).to.have.been.calledWith(SOMETHING_WENT_WRONG);
          expect(cacheInstance.cache).to.deep.equal({});
          return;
        }
        throw ERROR_WAS_EXPECTED;
      });
    });

    describe('when fetching a recipe fails partway through', () => {
      it('should rethrow and keep the recipes cached before the failure', async () => {
        datasourceStub.getRecipes.resolves([buildMetadata(0), buildMetadata(1)]);
        datasourceStub.getRecipe.withArgs('recipe-0.json').resolves({ recipeName: 'Recipe Zero' });
        datasourceStub.getRecipe.withArgs('recipe-1.json').rejects(SOMETHING_WENT_WRONG);

        try {
          await cacheInstance.refreshCache();
        } catch (err) {
          expect(err).to.equal(SOMETHING_WENT_WRONG);
          expect(Object.keys(cacheInstance.cache)).to.deep.equal(['sha-0']);
          return;
        }
        throw ERROR_WAS_EXPECTED;
      });
    });
  });

  describe('#addRecipe', () => {
    describe('when the recipe has keywords', () => {
      it('should include them in the filterMatchString', () => {
        cacheInstance.addRecipe(pancakesMetadata, pancakes);

        expect(cacheInstance.cache['sha-pancakes'].filterMatchString)
          .to.equal('fluffy.pancakes.breakfast.sweet');
      });
    });

    describe('when the recipe has no keywords', () => {
      it('should build the filterMatchString from the name only', () => {
        cacheInstance.addRecipe(pancakesMetadata, { recipeName: 'Fluffy Pancakes' });

        expect(cacheInstance.cache['sha-pancakes'].filterMatchString).to.equal('fluffy.pancakes');
      });
    });

    describe('when the sha is already cached', () => {
      it('should replace the existing entry', () => {
        cacheInstance.addRecipe(pancakesMetadata, pancakes);
        cacheInstance.addRecipe(pancakesMetadata, { recipeName: 'Thin Pancakes' });

        expect(cacheInstance.cache['sha-pancakes'].recipeName).to.equal('Thin Pancakes');
        expect(cacheInstance.cache['sha-pancakes'].keywords).to.be.undefined();
      });
    });
  });

  describe('#getRecipesMetadata', () => {
    it('should return only the metadata fields of each cached recipe', () => {
      cacheInstance.addRecipe(pancakesMetadata, pancakes);

      expect(cacheInstance.getRecipesMetadata()).to.deep.equal([{
        sha: 'sha-pancakes',
        filename: 'pancakes.json',
        name: 'Pancakes',
        filterMatchString: 'fluffy.pancakes.breakfast.sweet',
      }]);
    });

    it('should return an empty array when nothing is cached', () => {
      expect(cacheInstance.getRecipesMetadata()).to.deep.equal([]);
    });
  });

  describe('#getRecipe', () => {
    it('should return the cached recipe', () => {
      cacheInstance.addRecipe(pancakesMetadata, pancakes);

      expect(cacheInstance.getRecipe('sha-pancakes').recipeName).to.equal('Fluffy Pancakes');
    });

    it('should return undefined when the recipe is not cached', () => {
      expect(cacheInstance.getRecipe('missing')).to.be.undefined();
    });
  });
});
