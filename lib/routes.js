const router = require('express').Router();
const dependencies = require('./dependencies');

router.get(
  '/recipes',
  dependencies.recipesController.getRecipes,
);

router.get(
  '/recipes/:recipeId',
  dependencies.recipesController.getRecipe,
);

module.exports = router;
