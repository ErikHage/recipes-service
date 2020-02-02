const moment = require('moment');

const logger = require('../../helpers/logging');

// todo add dog pile mitigation to this

class RecipesService {
  constructor(recipesDatasource) {
    this.recipesDatasource = recipesDatasource;

    this.cache = {};
    this.cacheRefreshTime = moment().utc();
  }

  async refreshCache() {
    try {
      if (!this.cacheAll || moment().utc().isAfter(this.cacheRefreshTime)) {
        logger.info('refreshing cache');
        this.cacheAll = await this.recipesDatasource.getRecipes();
        this.cacheRefreshTime = moment().utc().add(12, 'hours');

        this.cacheAll.forEach(entry => {
          this.cache[entry.sha] = {
            ...entry,
            refreshTime: moment().utc().subtract(1, 'minutes'),
          };
        });
      }
    } catch (err) {
      logger.error('Error refreshing cache', err);
      throw err;
    }
  }

  async getAndCacheRecipe(recipeId) {
    const cachedRecipe = this.cache[recipeId];

    if (moment().utc().isAfter(cachedRecipe.refreshTime)) {
      const recipe = await this.recipesDatasource.getRecipe(cachedRecipe.filename);

      this.cache[recipeId] = {
        ...recipe,
        sha: recipeId,
        refreshTime: moment().utc().add(12, 'hours'),
      };
    }

    return this.cache[recipeId];
  }

  async getRecipes() {
    await this.refreshCache();
    return this.cacheAll;
  }

  async getRecipe(recipeId) {
    try {
      await this.refreshCache();
      return await this.getAndCacheRecipe(recipeId);
    } catch (err) {
      logger.error('error getting recipe', err);
      throw err;
    }
  }
}

module.exports = RecipesService;
