const logger = require('./logging');

const refreshTimeout = 24 * 60 * 60 * 1000;

class RecipePrimer {
  constructor(recipesCache) {
    this.recipesCache = recipesCache;
  }

  async prime(exitOnFail = false) {
    logger.info('Priming recipe cache');

    try {
      await this.recipesCache.refreshCache();
      logger.info('Recipe cache primed');
    } catch (err) {
      logger.error('Error priming recipe cache');
      logger.error(err);
      if (exitOnFail) {
        process.exit(69);
      }
    }

    setTimeout(() => {
      this.prime();
    }, refreshTimeout);
  }
}

module.exports = RecipePrimer;
