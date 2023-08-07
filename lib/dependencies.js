const RecipesController = require('./controllers/recipes');
const RecipesService = require('./services/recipes');
const RecipeCache = require('./data/recipe-cache');
const RecipesDatasource = require('./services/recipes/datasource');
const RecipePrimer = require('./helpers/recipe-primer');

const recipesDatasource = new RecipesDatasource();
const recipeCache = new RecipeCache(recipesDatasource);
const recipesService = new RecipesService(recipeCache);
const recipesController = new RecipesController(recipesService);

const recipePrimer = new RecipePrimer(recipeCache);

module.exports = {
  recipesDatasource,
  recipePrimer,
  recipeCache,
  recipesService,
  recipesController,
};
