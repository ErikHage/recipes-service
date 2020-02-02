const moment = require('moment');

const RecipesService = require('../../../lib/services/recipes');

const SOMETHING_WENT_WRONG = new Error('Something went wrong');
const ERROR_WAS_EXPECTED = new Error('An error was expected but was not thrown');

describe('Recipes Service', () => {
  let serviceInstance;
  let datasourceStub;
  let clock;

  const name = 'some-name';
  const filename = 'some-filename';
  const sha = 'some-sha';
  const recipeId = 'some-recipe-id';

  const recipePointer = {
    name,
    filename,
    sha,
  };
  const cachedRecipePointers = [recipePointer];

  const recipe = {
    name,
    filename,
  };

  beforeEach(() => {
    clock = sinon.useFakeTimers();

    datasourceStub = {
      getRecipes: sinon.stub(),
      getRecipe: sinon.stub(),
    };

    serviceInstance = new RecipesService(datasourceStub);
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  describe('#refreshCache', () => {
    describe('when cache has never been loaded', () => {
      it('should load the cache and update the refresh time', async () => {
        serviceInstance.cacheAll = undefined;
        datasourceStub.getRecipes.resolves(cachedRecipePointers);

        await serviceInstance.refreshCache();

        expect(serviceInstance.cacheRefreshTime).to.deep.equal(moment().utc().add(12, 'hours'));
        expect(serviceInstance.cacheAll).to.deep.equal([{
          name,
          filename,
          sha,
        }]);
        expect(serviceInstance.cache).to.deep.equal({
          [sha]: {
            name,
            filename,
            sha,
            refreshTime: moment().utc().subtract(1, 'minutes'),
          },
        });
        expect(datasourceStub.getRecipes).to.have.been.called();
      });
    });

    describe('when cache refresh time is in the past', () => {
      it('should load the cache and update the refresh time', async () => {
        serviceInstance.cacheAll = [''];
        serviceInstance.cacheRefreshTime = moment().utc().subtract(1, 'minutes');
        datasourceStub.getRecipes.resolves(cachedRecipePointers);

        await serviceInstance.refreshCache();

        expect(serviceInstance.cacheRefreshTime).to.deep.equal(moment().utc().add(12, 'hours'));
        expect(serviceInstance.cacheAll).to.deep.equal([{
          name,
          filename,
          sha,
        }]);
        expect(serviceInstance.cache).to.deep.equal({
          [sha]: {
            name,
            filename,
            sha,
            refreshTime: moment().utc().subtract(1, 'minutes'),
          },
        });
        expect(datasourceStub.getRecipes).to.have.been.called();
      });
    });

    describe('when cache refresh time is in the future', () => {
      it('should do nothing', async () => {
        serviceInstance.cacheAll = [''];
        serviceInstance.cacheRefreshTime = moment().utc().add(1, 'minutes');

        await serviceInstance.refreshCache();

        expect(serviceInstance.cacheRefreshTime).to.deep.equal(moment().utc().add(1, 'minutes'));
        expect(serviceInstance.cacheAll).to.deep.equal(['']);
        expect(serviceInstance.cache).to.deep.equal({});
        expect(datasourceStub.getRecipes).to.not.have.been.called();
      });
    });

    describe('when an error occurs', () => {
      it('should throw an error', async () => {
        serviceInstance.cacheAll = [''];
        serviceInstance.cacheRefreshTime = moment().utc().subtract(1, 'minutes');
        datasourceStub.getRecipes.rejects(SOMETHING_WENT_WRONG);

        try {
          await serviceInstance.refreshCache();
        } catch (err) {
          expect(err).to.be.equal(SOMETHING_WENT_WRONG);
          expect(serviceInstance.cacheRefreshTime).to.deep.equal(moment().utc().subtract(1, 'minutes'));
          expect(serviceInstance.cacheAll).to.deep.equal(['']);
          expect(serviceInstance.cache).to.deep.equal({});
          expect(datasourceStub.getRecipes).to.have.been.called();
          return;
        }
        throw ERROR_WAS_EXPECTED;
      });
    });
  });

  describe('#getAndCacheRecipe', () => {
    describe('when the refresh time is in the past', () => {
      it('should refresh the recipe and return it', async () => {
        serviceInstance.cache[recipeId] = {
          ...recipe,
          refreshTime: moment().utc().subtract(1, 'minutes'),
        };

        datasourceStub.getRecipe.resolves(recipe);

        const result = await serviceInstance.getAndCacheRecipe(recipeId);

        expect(result).to.deep.equal({
          ...recipe,
          sha: recipeId,
          refreshTime: moment().utc().add(12, 'hours'),
        });
        expect(datasourceStub.getRecipe).to.have.been.calledWith(filename);
      });
    });

    describe('when the refresh time is in the future', () => {
      it('should return the recipe without refreshing it', async () => {
        serviceInstance.cache[recipeId] = {
          ...recipe,
          sha,
          refreshTime: moment().utc().add(1, 'minutes'),
        };

        const result = await serviceInstance.getAndCacheRecipe(recipeId);

        expect(result).to.deep.equal({
          ...recipe,
          sha,
          refreshTime: moment().utc().add(1, 'minutes'),
        });
        expect(datasourceStub.getRecipe).to.not.have.been.called();
      });
    });
  });

  describe('#getRecipes', () => {
    it('should refresh the cache then return the cache contents', async () => {
      serviceInstance.refreshCache = sinon.stub().resolves();
      serviceInstance.cacheAll = cachedRecipePointers;

      const result = await serviceInstance.getRecipes();

      expect(result).to.be.equal(cachedRecipePointers);
      expect(serviceInstance.refreshCache).to.have.been.called();
    });
  });

  describe('#getRecipe', () => {
    it('should refresh the cache then return the cache contents', async () => {
      serviceInstance.refreshCache = sinon.stub().resolves();
      serviceInstance.getAndCacheRecipe = sinon.stub().resolves(recipe);

      const result = await serviceInstance.getRecipe(recipeId);

      expect(result).to.be.equal(recipe);
      expect(serviceInstance.refreshCache).to.have.been.called();
      expect(serviceInstance.getAndCacheRecipe).to.have.been.calledWith(recipeId);
    });

    it('bubbles up errors from #getAndCacheRecipe', async () => {
      serviceInstance.refreshCache = sinon.stub().resolves();
      serviceInstance.getAndCacheRecipe = sinon.stub().rejects(SOMETHING_WENT_WRONG);

      try {
        await serviceInstance.getRecipe(recipeId);
      } catch (err) {
        expect(err).to.be.equal(SOMETHING_WENT_WRONG);
        expect(serviceInstance.refreshCache).to.have.been.called();
        expect(serviceInstance.getAndCacheRecipe).to.have.been.calledWith(recipeId);
        return;
      }
      throw ERROR_WAS_EXPECTED;
    });
  });
});
