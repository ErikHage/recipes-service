const { randomBytes } = require('crypto');
const nock = require('nock');

/**
 * The GitHub contents API, mocked with nock: the recipes repo the app loads
 * from, as a spec has declared it.
 *
 * The mock collects what it should serve and installs the interceptors only
 * when the app is about to refresh, because the listing has to name every
 * recipe at once. init.js disables real network access, so a call this mock
 * does not answer fails rather than reaching GitHub.
 *
 * The repo path is re-declared here rather than read from lib/, like the
 * status codes: if the app changed where it looks, the mocks should stop
 * answering instead of following it.
 */

const GITHUB_API = 'https://api.github.com';
const CONTENTS_PATH = '/repos/ErikHage/my-recipes/contents/json';

const FIXTURE_PREFIX = 'int';

const uniqueSuffix = () => randomBytes(3).toString('hex');

const titleCase = (alias) => alias
  .split('-')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

/**
 * A recipe file as it sits in the repo: `{ filename, sha, content }`, where
 * `content` is the recipe JSON. The file is named after the alias
 * (`tomato-soup` -> `tomato-soup.json`); the sha gets a prefix and a random
 * suffix, since it is the recipe's id in the API.
 *
 * `named` is the recipeName inside the file (default: the alias, title-cased);
 * `nutrition: 'none'` leaves the nutrition block out.
 */
const aRecipe = ({
  alias, named = titleCase(alias), keywords = [], nutrition = 'some',
}) => ({
  filename: `${alias}.json`,
  sha: `${FIXTURE_PREFIX}-${alias}-${uniqueSuffix()}`,
  content: {
    recipeName: named,
    prep: { kind: 'minutes', value: 10 },
    cook: { kind: 'minutes', value: 15 },
    yield: { kind: 'servings', value: 4 },
    ingredients: [
      { quantity: { kind: 'cups', value: 2 }, name: 'flour', notes: 'sifted' },
      { quantity: { kind: 'whole', value: 2 }, name: 'eggs' },
    ],
    steps: [
      { id: 1, text: 'Mix everything' },
      { id: 2, text: 'Cook it' },
    ],
    ...(keywords.length > 0 ? { keywords } : {}),
    ...(nutrition === 'none' ? {} : {
      nutrition: {
        calories: 250, fats: 8, carbohydrates: 35, sugars: 6, protein: 7,
      },
    }),
  },
});

const toFileResponse = (recipe) => ({
  name: recipe.filename,
  sha: recipe.sha,
  encoding: 'base64',
  content: Buffer.from(JSON.stringify(recipe.content)).toString('base64'),
});

const createGithubMock = () => {
  let served = [];
  let listingFailure;

  return {
    /** Adds a recipe file to the repo. */
    serve(recipe) {
      served.push(recipe);
    },

    /** Makes the listing fail with this status, whatever else is served. */
    failListing(status) {
      listingFailure = status;
    },

    /** Installs the interceptors for one refresh: the listing, then each file. */
    install() {
      const github = nock(GITHUB_API);

      if (listingFailure !== undefined) {
        github.get(CONTENTS_PATH).reply(listingFailure, { message: 'Server Error' });
        return;
      }

      github.get(CONTENTS_PATH)
        .reply(200, served.map(({ filename, sha }) => ({ name: filename, sha })));
      served.forEach((recipe) => {
        github.get(`${CONTENTS_PATH}/${recipe.filename}`).reply(200, toFileResponse(recipe));
      });
    },

    /** Calls the mock was set up to answer but the app has not made, e.g. `GET https://api.github.com:443/...`. */
    pendingCalls() {
      return nock.pendingMocks();
    },

    /** Forgets what is served and removes every interceptor. */
    reset() {
      served = [];
      listingFailure = undefined;
      nock.cleanAll();
    },
  };
};

module.exports = {
  aRecipe,
  createGithubMock,
};
