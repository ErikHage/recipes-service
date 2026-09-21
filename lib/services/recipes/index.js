/* eslint-disable no-await-in-loop */

const logger = require('../../helpers/logging');
const errorFactory = require('../../error/error-factory');

class RecipesService {
  constructor(recipesCache) {
    this.recipesCache = recipesCache;
  }

  async getRecipe(recipeId) {
    let recipe;

    try {
      recipe = this.recipesCache.getRecipe(recipeId);
    } catch (err) {
      logger.error('error getting recipe', err);
      throw err;
    }

    if (!recipe) {
      throw errorFactory.getErrorFromCode('RECIPE_NOT_FOUND', { recipeId });
    }

    return recipe;
  }

  async getRecipes() {
    return this.recipesCache.getRecipesMetadata();
  }
}

module.exports = RecipesService;
