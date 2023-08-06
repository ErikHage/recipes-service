const { Octokit } = require('@octokit/rest');

const logger = require('./logging');

require('dotenv').config();

const apiToken = process.env.GITHUB_API_TOKEN;

if (apiToken == null || apiToken === '') {
  logger.error('GITHUB_API_TOKEN required but not present');
  process.exit(1);
}

const octokit = new Octokit({
  auth: process.env.GITHUB_API_TOKEN,
});

const getOctokit = () => octokit;

module.exports = {
  getOctokit,
};
