const { createGithubDriver } = require('./github-driver');
const { createRecipeCacheDriver } = require('./recipe-cache-driver');
const { createRecipesDriver } = require('./recipes-driver');

/**
 * One driver per thing the suite talks to, built once per spec file.
 *
 * - recipes: the HTTP API, over the in-process client
 * - recipeCache: the app's cache refresh, over support/app.js
 * - github: the mocked GitHub repo the app loads from
 *
 * The service has no auth, so there is no caller to bind: a driver's methods
 * take only the values they check.
 */
const createDrivers = ({ client, recipeCache, githubMock }) => ({
  recipes: createRecipesDriver(client),
  recipeCache: createRecipeCacheDriver(recipeCache),
  github: createGithubDriver(githubMock),
});

module.exports = {
  createDrivers,
};
