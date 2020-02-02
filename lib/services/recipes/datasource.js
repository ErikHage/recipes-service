const request = require('superagent');

/**
 * Expects a filename in the format "recipe-name.json" and transforms it to "Recipe Name"
 * @param {*} filename
 */
const parseNameFromFileName = (filename) => {
  const [snakeCaseName] = filename.split('.');
  const words = snakeCaseName.split('-');

  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const fromResponse = (rawData) => ({
  name: parseNameFromFileName(rawData.name),
  filename: rawData.name,
  sha: rawData.sha,
});

const parseResponseBody = (body) => {
  const { content, encoding } = body;
  const buff = Buffer.from(content, encoding);
  return JSON.parse(buff.toString());
};

class RecipesDatasource {
  async getRecipes() {
    const res = await request
      .get('https://api.github.com/repos/ErikHage/my-recipes/contents/json?ref=master')
      .set('user-agent', 'ErikHage')
      .accept('application/json');

    return res.body.map(fromResponse);
  }

  async getRecipe(filename) {
    const { body } = await request
      .get(`http://api.github.com/repos/ErikHage/my-recipes/contents/json/${filename}?ref=master`)
      .set('user-agent', 'ErikHage')
      .accept('application/json');

    return parseResponseBody(body);
  }
}

module.exports = RecipesDatasource;
