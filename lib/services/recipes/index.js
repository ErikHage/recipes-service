const moment = require('moment');

const recipesDatasource = require('./datasource');
const logger = require('../../helpers/logging');

let cacheAll;
const cache = {};
let cacheRefreshTime = moment().utc();

// todo add dog pile mitigation to this
const refreshCache = async () => {
  try {
    if (!cacheAll || moment().utc().isAfter(cacheRefreshTime)) {
      logger.info('refreshing cache');
      cacheAll = await recipesDatasource.getRecipes();
      cacheRefreshTime = moment().utc().add(12, 'hours');

      cacheAll.forEach(entry => {
        cache[entry.sha] = {
          ...entry,
          refreshTime: moment().utc().subtract(1, 'minutes'),
        };
      });
    }
  } catch (err) {
    logger.error('Error refreshing cache', err);
    throw err;
  }
};

const getAndCacheRecipe = async (recipeId) => {
  const cachedRecipe = cache[recipeId];

  if (moment().utc().isAfter(cachedRecipe.refreshTime)) {
    const recipe = await recipesDatasource.getRecipe(cachedRecipe.filename);

    cache[recipeId] = {
      ...recipe,
      sha: recipeId,
      refreshTime: moment().utc().add(12, 'hours'),
    };
  }

  return cache[recipeId];
};

const getRecipes = async () => {
  await refreshCache();
  return cacheAll;
};

const getRecipe = async (recipeId) => {
  try {
    await refreshCache();
    return await getAndCacheRecipe(recipeId);
  } catch (err) {
    logger.error('error getting recipe', err);
    throw err;
  }
};

module.exports = {
  getRecipes,
  getRecipe,
};
