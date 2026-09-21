const nock = require('nock');

const { githubConfig } = require('../../../lib/helpers/constants');

const GITHUB_API = 'https://api.github.com';
const CONTENTS_PATH = `/repos/${githubConfig.owner}/${githubConfig.recipesRepo}/contents/json`;

const recipes = [
  {
    filename: 'pancakes.json',
    sha: 'sha-pancakes',
    content: {
      recipeName: 'Pancakes',
      prep: { kind: 'minutes', value: 10 },
      cook: { kind: 'minutes', value: 15 },
      yield: { kind: 'servings', value: 4 },
      ingredients: [
        { quantity: { kind: 'cups', value: 2 }, name: 'flour', notes: 'sifted' },
        { quantity: { kind: 'whole', value: 2 }, name: 'eggs' },
      ],
      steps: [
        { id: 1, text: 'Mix everything' },
        { id: 2, text: 'Cook on a griddle' },
      ],
      keywords: ['breakfast', 'sweet'],
      nutrition: {
        calories: 250, fats: 8, carbohydrates: 35, sugars: 6, protein: 7,
      },
    },
  },
  {
    filename: 'tomato-soup.json',
    sha: 'sha-tomato-soup',
    content: {
      recipeName: 'Tomato Soup',
      prep: { kind: 'minutes', value: 5 },
      cook: { kind: 'minutes', value: 30 },
      yield: { kind: 'servings', value: 2 },
      ingredients: [
        { quantity: { kind: 'cans', value: 2 }, name: 'tomatoes' },
      ],
      steps: [
        { id: 1, text: 'Simmer' },
      ],
    },
  },
];

const toFileResponse = (recipe) => ({
  name: recipe.filename,
  sha: recipe.sha,
  encoding: 'base64',
  content: Buffer.from(JSON.stringify(recipe.content)).toString('base64'),
});

const mockRecipeListing = (list = recipes) => nock(GITHUB_API)
  .get(CONTENTS_PATH)
  .reply(200, list.map(({ filename, sha }) => ({ name: filename, sha })));

const mockRecipeFile = (recipe) => nock(GITHUB_API)
  .get(`${CONTENTS_PATH}/${recipe.filename}`)
  .reply(200, toFileResponse(recipe));

const mockAllRecipes = (list = recipes) => {
  mockRecipeListing(list);
  list.forEach(mockRecipeFile);
};

const mockListingError = (status = 500) => nock(GITHUB_API)
  .get(CONTENTS_PATH)
  .reply(status, { message: 'Server Error' });

module.exports = {
  recipes,
  mockRecipeListing,
  mockRecipeFile,
  mockAllRecipes,
  mockListingError,
};
