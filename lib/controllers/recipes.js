const tryDecorator = require('../middleware/try-decorator');
const recipesService = require('../services/recipes');
const serializer = require('../serializers/recipes');

const { statusCodes } = require('../helpers/constants');

const getRecipes = async (req, res) => {
  const recipes = await recipesService.getRecipes();
  const responseBody = serializer.getRecipes.toResponse(recipes);

  res.status(statusCodes.OK).send(responseBody);
};

const getRecipe = async (req, res) => {
  const { recipeId } = req.params;

  const recipe = await recipesService.getRecipe(recipeId);
  const responseBody = serializer.getRecipe.toResponse(recipe);

  res.status(statusCodes.OK).send(responseBody);
};

module.exports = {
  getRecipes: tryDecorator(getRecipes),
  getRecipe: tryDecorator(getRecipe),
};
