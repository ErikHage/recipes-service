const dataMapper = require('./data-mapper');
const gitApiHelper = require('../../helpers/git-api-access');
const { githubConfig } = require('../../helpers/constants');

class RecipesDatasource {
  constructor() {
    this.octokit = gitApiHelper.getOctokit();
  }

  async getRecipes() {
    const result = await this.octokit.request('GET /repos/{owner}/{repo}/contents/json', {
      owner: githubConfig.owner,
      repo: githubConfig.recipesRepo,
    });

    return result.data.map(dataMapper.fromMetadata);
  }

  async getRecipe(filename) {
    const result = await this.octokit.request('GET /repos/{owner}/{repo}/contents/json/{filename}', {
      owner: githubConfig.owner,
      repo: githubConfig.recipesRepo,
      filename,
    });

    return dataMapper.fromFileContents(result.data);
  }
}

module.exports = RecipesDatasource;
