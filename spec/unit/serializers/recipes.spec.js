const recipesSerializer = require('../../../lib/serializers/recipes');

describe('Recipes Serializer', () => {
  const recipeId = 'some-recipe-id';
  const filename = 'some-filename';
  const recipeName = 'some-recipe-name';

  describe('#getRecipes', () => {
    describe('#toResponse', () => {
      it('should format the recipes array for the response', async () => {
        const recipes = [{
          sha: recipeId,
          filename,
          name: recipeName,
        }];

        const result = recipesSerializer.getRecipes.toResponse(recipes);

        expect(result).to.deep.equal([{
          recipeId,
          filename,
          recipeName,
        }]);
      });
    });
  });

  describe('#getRecipe', () => {
    const kindValueObj = {
      kind: 'some-kind',
      value: 'some-value',
    };
    const ingredients = [{
      quantity: kindValueObj,
      name: 'some-ingredient-name',
      notes: 'some-notes',
    }];
    const steps = [{
      id: 'some-id',
      text: 'some-text',
    }];
    const keywords = ['some-keyword'];
    const nutrition = {
      calories: 'some-calories',
      fats: 'some-fats',
      carbohydrates: 'some-carbs',
      sugars: 'some-sugars',
      protein: 'some-protein',
    };

    describe('#toResponse', () => {
      it('should format the recipe for the response', async () => {
        const recipe = {
          sha: recipeId,
          filename,
          recipeName,
          prep: kindValueObj,
          cook: kindValueObj,
          yield: kindValueObj,
          ingredients,
          steps,
          keywords,
          nutrition,
        };

        const result = recipesSerializer.getRecipe.toResponse(recipe);

        expect(result).to.deep.equal({
          recipeId,
          recipeName,
          prep: kindValueObj,
          cook: kindValueObj,
          yield: kindValueObj,
          ingredients,
          steps,
          keywords,
          nutrition,
        });
      });
    });
  });
});
