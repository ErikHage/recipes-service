const dataMapper = require('./data-mapper');
const gitApiHelper = require('../../helpers/git-api-access');

class RecipesDatasource {
  constructor() {
    this.octokit = gitApiHelper.getOctokit();
  }

  async checkRateLimit() {
    const result = await this.octokit.rateLimit.get();

    // eslint-disable-next-line no-console
    console.log(result);
  }

  async getRecipes() {
    const result = await this.octokit.request('GET /repos/{owner}/{repo}/contents/json', {
      owner: 'ErikHage',
      repo: 'my-recipes',
    });

    return result.data.map(dataMapper.fromMetadata);
  }

  async getRecipe(filename) {
    const result = await this.octokit.request('GET /repos/{owner}/{repo}/contents/json/{filename}', {
      owner: 'ErikHage',
      repo: 'my-recipes',
      filename,
    });

    return dataMapper.fromFileContents(result.data);
  }
}

module.exports = RecipesDatasource;
