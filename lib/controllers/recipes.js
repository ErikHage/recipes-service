const tryDecorator = require('../middleware/try-decorator');
const serializer = require('../serializers/recipes');

const { statusCodes } = require('../helpers/constants');

class RecipesController {
  constructor(recipesService) {
    this.recipesService = recipesService;

    this.getRecipes = tryDecorator(this.getRecipesRaw.bind(this));
    this.getRecipe = tryDecorator(this.getRecipeRaw.bind(this));
  }

  async getRecipesRaw(req, res) {
    const recipes = await this.recipesService.getRecipes();
    const responseBody = serializer.getRecipes.toResponse(recipes);

    res.status(statusCodes.OK).send(responseBody);
  }

  async getRecipeRaw(req, res) {
    const { recipeId } = req.params;

    const recipe = await this.recipesService.getRecipe(recipeId);
    const responseBody = serializer.getRecipe.toResponse(recipe);

    res.status(statusCodes.OK).send(responseBody);
  }
}

module.exports = RecipesController;
