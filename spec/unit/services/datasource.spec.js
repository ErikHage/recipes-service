const RecipesDatasource = require('../../../lib/services/recipes/datasource');
const gitApiHelper = require('../../../lib/helpers/git-api-access');

const SOMETHING_WENT_WRONG = new Error('Something went wrong');
const ERROR_WAS_EXPECTED = new Error('An error was expected but was not thrown');

describe('Recipes Datasource', () => {
  let datasourceInstance;
  let octokitStub;

  const filename = 'some-name.json';
  const name = 'Some Name';
  const sha = 'some-sha';
  const repoParams = {
    owner: 'ErikHage',
    repo: 'my-recipes',
  };

  beforeEach(() => {
    octokitStub = {
      request: sinon.stub(),
    };
    sinon.stub(gitApiHelper, 'getOctokit').returns(octokitStub);

    datasourceInstance = new RecipesDatasource();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('#getRecipes', () => {
    describe('when a success response is received', () => {
      it('should return the mapped metadata', async () => {
        octokitStub.request.resolves({ data: [{ name: filename, sha }] });

        const result = await datasourceInstance.getRecipes();

        expect(result).to.deep.equal([{ name, filename, sha }]);
        expect(octokitStub.request).to.have.been.calledWith(
          'GET /repos/{owner}/{repo}/contents/json',
          repoParams,
        );
      });
    });

    describe('when an error response is received', () => {
      it('should bubble up the error', async () => {
        octokitStub.request.rejects(SOMETHING_WENT_WRONG);

        try {
          await datasourceInstance.getRecipes();
        } catch (err) {
          expect(err).to.equal(SOMETHING_WENT_WRONG);
          return;
        }
        throw ERROR_WAS_EXPECTED;
      });
    });
  });

  describe('#getRecipe', () => {
    const recipe = { recipeName: 'some-recipe-name' };

    describe('when a success response is received', () => {
      it('should return the decoded file contents', async () => {
        octokitStub.request.resolves({
          data: {
            content: Buffer.from(JSON.stringify(recipe)).toString('base64'),
            encoding: 'base64',
          },
        });

        const result = await datasourceInstance.getRecipe(filename);

        expect(result).to.deep.equal(recipe);
        expect(octokitStub.request).to.have.been.calledWith(
          'GET /repos/{owner}/{repo}/contents/json/{filename}',
          { ...repoParams, filename },
        );
      });
    });

    describe('when an error response is received', () => {
      it('should bubble up the error', async () => {
        octokitStub.request.rejects(SOMETHING_WENT_WRONG);

        try {
          await datasourceInstance.getRecipe(filename);
        } catch (err) {
          expect(err).to.equal(SOMETHING_WENT_WRONG);
          return;
        }
        throw ERROR_WAS_EXPECTED;
      });
    });
  });
});
