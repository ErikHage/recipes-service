const logger = require('../helpers/logging');

const buildFilterMatchString = (recipe) => {
  let filterMatchString = recipe.recipeName.split(' ').join('.');

  if (recipe.keywords) {
    filterMatchString = `${filterMatchString}.${recipe.keywords.join('.')}`;
  }

  return filterMatchString.toLowerCase();
};

class RecipeCache {
  constructor(recipesDatasource) {
    this.recipesDatasource = recipesDatasource;
    this.cache = {};
  }

  async refreshCache() {
    try {
      logger.info('refreshing cache');

      const recipeMetadata = await this.recipesDatasource.getRecipes();

      logger.info(`fetched ${recipeMetadata.length} metadata records`);

      for (let i = 0; i < recipeMetadata.length; i++) {
        const metadata = recipeMetadata[i];
        // eslint-disable-next-line no-await-in-loop
        const recipe = await this.recipesDatasource.getRecipe(metadata.filename);
        this.addRecipe(metadata, recipe);

        if (i % 10 === 0 && i > 0) {
          logger.info(`fetched ${i} recipes`);
        }
      }

      logger.info(`fetched ${Object.keys(this.cache).length} recipes`);
    } catch (err) {
      logger.error('Error refreshing cache');
      logger.error(err);
      throw err;
    }
  }

  getRecipesMetadata() {
    return Object.values(this.cache).map(recipe => ({
      sha: recipe.sha,
      filename: recipe.filename,
      name: recipe.name,
      filterMatchString: recipe.filterMatchString,
    }));
  }

  getRecipe(recipeId) {
    return this.cache[recipeId];
  }

  addRecipe(metadata, recipe) {
    const filterMatchString = buildFilterMatchString(recipe);

    this.cache[metadata.sha] = {
      ...metadata,
      ...recipe,
      filterMatchString,
    };
  }
}

module.exports = RecipeCache;
