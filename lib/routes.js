const router = require('express').Router();

const recipesController = require('./controllers/recipes');

router.get('/recipes', recipesController.getRecipes);
router.get('/recipes/:recipeId', recipesController.getRecipe);

module.exports = router;
