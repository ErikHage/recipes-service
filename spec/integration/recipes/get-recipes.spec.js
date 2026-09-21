const request = require('supertest');

const app = require('../../../lib/app');
const githubMock = require('../../helpers/integration/github-mock');
const { primeRecipeCache } = require('../../helpers/integration/recipe-cache');

const BASE_PATH = '/api/recipes-service';

describe('GET /recipes (integration)', () => {
  const [pancakes, tomatoSoup] = githubMock.recipes;

  before(async () => {
    await primeRecipeCache();
  });

  it('should return metadata for every recipe', async () => {
    const res = await request(app)
      .get(`${BASE_PATH}/recipes`)
      .expect(200);

    expect(res.body).to.have.deep.members([
      {
        recipeId: pancakes.sha,
        filename: pancakes.filename,
        recipeName: 'Pancakes',
        filterMatchString: 'pancakes.breakfast.sweet',
      },
      {
        recipeId: tomatoSoup.sha,
        filename: tomatoSoup.filename,
        recipeName: 'Tomato Soup',
        filterMatchString: 'tomato.soup',
      },
    ]);
  });
});
