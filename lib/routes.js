const router = require('express').Router();

const RecipesController = require('./controllers/recipes');
const RecipesService = require('./services/recipes');
const RecipesDatasource = require('./services/recipes/datasource');

const recipesController = new RecipesController(new RecipesService(new RecipesDatasource()));

router.get('/recipes', recipesController.getRecipes);
router.get('/recipes/:recipeId', recipesController.getRecipe);

module.exports = router;
