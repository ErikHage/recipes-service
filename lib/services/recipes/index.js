/* eslint-disable no-await-in-loop */

const logger = require('../../helpers/logging');

class RecipesService {
  constructor(recipesCache) {
    this.recipesCache = recipesCache;
  }

  async getRecipe(recipeId) {
    try {
      return this.recipesCache.getRecipe(recipeId);
    } catch (err) {
      logger.error('error getting recipe', err);
      throw err;
    }
  }

  async getRecipes() {
    return this.recipesCache.getRecipesMetadata();
  }
}

module.exports = RecipesService;
