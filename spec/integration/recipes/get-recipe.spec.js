const request = require('supertest');
const sinon = require('sinon');

const app = require('../../../lib/app');
const githubMock = require('../../helpers/integration/github-mock');
const { primeRecipeCache } = require('../../helpers/integration/recipe-cache');

const BASE_PATH = '/api/recipes-service';

describe('GET /recipes/:recipeId (integration)', () => {
  const [pancakes, tomatoSoup] = githubMock.recipes;

  before(async () => {
    await primeRecipeCache();
  });

  it('should return the full recipe', async () => {
    const res = await request(app)
      .get(`${BASE_PATH}/recipes/${pancakes.sha}`)
      .expect(200);

    expect(res.body).to.deep.equal({
      recipeId: pancakes.sha,
      ...pancakes.content,
    });
  });

  it('should return an empty nutrition object when the recipe has none', async () => {
    const res = await request(app)
      .get(`${BASE_PATH}/recipes/${tomatoSoup.sha}`)
      .expect(200);

    expect(res.body.recipeName).to.equal('Tomato Soup');
    expect(res.body.nutrition).to.deep.equal({});
  });

  describe('when the recipe does not exist', () => {
    let consoleErrorStub;

    beforeEach(() => {
      // error-logger middleware writes to console.error; keep test output clean
      consoleErrorStub = sinon.stub(console, 'error');
    });

    afterEach(() => {
      consoleErrorStub.restore();
    });

    it('should respond with a 404 and a JSON error body', async () => {
      const res = await request(app)
        .get(`${BASE_PATH}/recipes/does-not-exist`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(res.body).to.deep.equal({
        errors: [{
          status: 404,
          code: 'RECIPE_NOT_FOUND',
          source: 'recipes-service',
          message: 'Recipe not found',
        }],
      });
    });
  });
});
