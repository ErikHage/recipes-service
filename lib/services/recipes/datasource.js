const request = require('superagent');
const dataMapper = require('./data-mapper');

class RecipesDatasource {
  async getRecipes() {
    const res = await request
      .get('https://api.github.com/repos/ErikHage/my-recipes/contents/json?ref=master')
      .set('user-agent', 'ErikHage')
      .accept('application/json');

    return res.body.map(dataMapper.fromMetadata);
  }

  async getRecipe(filename) {
    const { body } = await request
      .get(`http://api.github.com/repos/ErikHage/my-recipes/contents/json/${filename}?ref=master`)
      .set('user-agent', 'ErikHage')
      .accept('application/json');

    return dataMapper.fromFileContents(body);
  }
}

module.exports = RecipesDatasource;
