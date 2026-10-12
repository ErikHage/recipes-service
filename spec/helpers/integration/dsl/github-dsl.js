const { optional, parseDslArgs, required } = require('@feral-auth/ts-simple-dsl');

const { alias } = require('./params');
const { aRecipe } = require('../support/github-mock');

/**
 * The GitHub repo the app loads from, in words. These steps arrange the world
 * a spec runs in; nothing reaches the app until the cache is refreshed.
 */
const createGithubDsl = (world, github) => ({
  /**
   * `recipe` (the alias, also the filename: `tomato-soup` -> tomato-soup.json),
   * optional `named` (the recipeName inside the file; default: the alias,
   * title-cased), `keywords` (comma-separated) and `nutrition: some | none`.
   */
  async hasRecipe(...args) {
    const params = parseDslArgs(args, {
      recipe: alias(),
      named: optional(),
      keywords: optional().multiple({ separator: ',' }),
      nutrition: optional().allowedValues('some', 'none').withDefault('some'),
    });

    world.nameRecipe(params.recipe, github.serves(aRecipe({
      alias: params.recipe,
      ...(params.named === undefined ? {} : { named: params.named }),
      keywords: params.keywords,
      nutrition: params.nutrition,
    })));
  },

  /** `status`: what GitHub replies when the app lists the repo. */
  async failsToList(...args) {
    const params = parseDslArgs(args, { status: required().asInteger() });

    world.nameListingFailure(params.status);
    github.listingFailsWith(params.status);
  },

  /** The last refresh fetched the listing and every recipe file it named. */
  async checkEveryFileWasFetched(...args) {
    parseDslArgs(args, {});

    github.everyServedFileWasFetched();
  },
});

module.exports = {
  createGithubDsl,
};
