const RecipesController = require('../../../lib/controllers/recipes');

const serializer = require('../../../lib/serializers/recipes');

const SOMETHING_WENT_WRONG = new Error('Something went wrong');

describe('Recipes Controller', () => {
  let recipesControllerInstance;
  let recipesServiceStub;
  let req;
  let res;
  let next;

  const recipeId = 'some-recipe-id';

  beforeEach(() => {
    recipesServiceStub = {
      getRecipes: sinon.stub(),
      getRecipe: sinon.stub(),
    };
    res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
    next = sinon.stub();

    recipesControllerInstance = new RecipesController(recipesServiceStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('#getRecipes', () => {
    it('should fetch the recipe names and ids', async () => {
      const serviceResponse = {};
      const serializerResponse = {};

      sinon.stub(serializer.getRecipes, 'toResponse').returns(serializerResponse);
      recipesServiceStub.getRecipes.resolves(serviceResponse);

      req = {};

      await recipesControllerInstance.getRecipes(req, res, next);

      expect(res.status).to.have.been.calledWith(200);
      expect(res.send).to.have.been.calledWith(serializerResponse);
      expect(next).to.not.have.been.called();
      expect(recipesServiceStub.getRecipes).to.have.been.called();
      expect(serializer.getRecipes.toResponse).to.have.been.calledWith(serviceResponse);
    });

    it('should pass errors to next', async () => {
      recipesServiceStub.getRecipes.rejects(SOMETHING_WENT_WRONG);

      req = {};

      await recipesControllerInstance.getRecipes(req, res, next);

      expect(res.status).to.not.have.been.called();
      expect(res.send).to.not.have.been.called();
      expect(next).to.have.been.calledWith(SOMETHING_WENT_WRONG);
      expect(recipesServiceStub.getRecipes).to.have.been.called();
    });
  });

  describe('#getRecipe', () => {
    it('should fetch the recipe for the given id', async () => {
      const serviceResponse = {};
      const serializerResponse = {};

      sinon.stub(serializer.getRecipe, 'toResponse').returns(serializerResponse);
      recipesServiceStub.getRecipe.resolves(serviceResponse);

      req = {
        params: {
          recipeId,
        },
      };

      await recipesControllerInstance.getRecipe(req, res, next);

      expect(res.status).to.have.been.calledWith(200);
      expect(res.send).to.have.been.calledWith(serializerResponse);
      expect(next).to.not.have.been.called();
      expect(recipesServiceStub.getRecipe).to.have.been.calledWith(recipeId);
      expect(serializer.getRecipe.toResponse).to.have.been.calledWith(serviceResponse);
    });

    it('should pass errors to next', async () => {
      recipesServiceStub.getRecipe.rejects(SOMETHING_WENT_WRONG);

      req = {
        params: {
          recipeId,
        },
      };

      await recipesControllerInstance.getRecipe(req, res, next);

      expect(res.status).to.not.have.been.called();
      expect(res.send).to.not.have.been.called();
      expect(next).to.have.been.calledWith(SOMETHING_WENT_WRONG);
      expect(recipesServiceStub.getRecipe).to.have.been.calledWith(recipeId);
    });
  });
});
