const nock = require('nock');

const RecipesDatasource = require('../../../lib/services/recipes/datasource');

const SOMETHING_WENT_WRONG = new Error('Something went wrong');
const ERROR_WAS_EXPECTED = new Error('An error was expected but was not thrown');

describe('Recipes Datasource', () => {
  let datasourceInstance;

  const filename = 'some-name.json';
  const name = 'Some Name';
  const sha = 'some-sha';

  beforeEach(() => {
    datasourceInstance = new RecipesDatasource();
  });

  after(() => {
    nock.restore();
  });

  describe('#getRecipes', () => {
    describe('when a success response is received', () => {
      it('should return the mapped response body', async () => {
        const req = nock('https://api.github.com')
          .get('/repos/ErikHage/my-recipes/contents/json?ref=master')
          .reply(200, [{
            name: filename,
            sha,
          }]);

        const result = await datasourceInstance.getRecipes();

        expect(result).to.deep.equal([{
          name,
          filename,
          sha,
        }]);
        expect(req.isDone()).to.be.true();
      });
    });

    describe('when an error response is received', () => {
      it('should bubble up the error', async () => {
        const req = nock('https://api.github.com')
          .get('/repos/ErikHage/my-recipes/contents/json?ref=master')
          .replyWithError(SOMETHING_WENT_WRONG);

        try {
          await datasourceInstance.getRecipes();
        } catch (err) {
          expect(err).to.be.equal(SOMETHING_WENT_WRONG);
          expect(req.isDone()).to.be.true();
          return;
        }
        throw ERROR_WAS_EXPECTED;
      });
    });
  });

  describe('#getRecipe', () => {
    const recipe = {
      recipeName: 'some-recipe-name',
    };
    const recipeJson = JSON.stringify(recipe);

    describe('when a success response is received', () => {
      it('should return the mapped response body', async () => {
        const req = nock('https://api.github.com')
          .get(`/repos/ErikHage/my-recipes/contents/json/${filename}?ref=master`)
          .reply(200, {
            content: recipeJson,
            encoding: 'UTF-8',
          });

        const result = await datasourceInstance.getRecipe(filename);

        expect(result).to.deep.equal(recipe);
        expect(req.isDone()).to.be.true();
      });
    });

    describe('when an error response is received', () => {
      it('should bubble up the error', async () => {
        const req = nock('https://api.github.com')
          .get(`/repos/ErikHage/my-recipes/contents/json/${filename}?ref=master`)
          .replyWithError(SOMETHING_WENT_WRONG);

        try {
          await datasourceInstance.getRecipe(filename);
        } catch (err) {
          expect(err).to.be.equal(SOMETHING_WENT_WRONG);
          expect(req.isDone()).to.be.true();
          return;
        }
        throw ERROR_WAS_EXPECTED;
      });
    });
  });
});
