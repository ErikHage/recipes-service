const getRecipes = {
  toResponse: (recipes) => recipes.map(entry => ({
    recipeId: entry.sha,
    filename: entry.filename,
    recipeName: entry.name,
  })),
};

const toIngredientResponse = (ingredient) => ({
  quantity: {
    kind: ingredient.quantity.kind,
    value: ingredient.quantity.value,
  },
  name: ingredient.name,
  notes: ingredient.notes,
});

const toStepResponse = (step) => ({
  id: step.id,
  text: step.text,
});

const getRecipe = {
  toResponse: (recipe) => ({
    recipeId: recipe.sha,
    recipeName: recipe.recipeName,
    prep: {
      kind: recipe.prep.kind,
      value: recipe.prep.value,
    },
    cook: {
      kind: recipe.cook.kind,
      value: recipe.cook.value,
    },
    yield: {
      kind: recipe.yield.kind,
      value: recipe.yield.value,
    },
    ingredients: recipe.ingredients.map(toIngredientResponse),
    steps: recipe.steps.map(toStepResponse),
    keywords: recipe.keywords,
    nutrition: {
      calories: recipe.nutrition.calories,
      fats: recipe.nutrition.fats,
      carbohydrates: recipe.nutrition.carbohydrates,
      sugars: recipe.nutrition.sugars,
      protein: recipe.nutrition.protein,
    },
  }),
};

module.exports = {
  getRecipes,
  getRecipe,
};
