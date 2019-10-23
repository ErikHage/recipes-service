const moment = require('moment');

const recipesDatasource = require('./datasource');

let cacheAll;
const cache = {};
let cacheRefreshTime = moment().utc();

// todo add dog pile mitigation to this
const refreshCache = async () => {
  try {
    if (!cacheAll || moment().utc().isAfter(cacheRefreshTime)) {
      console.log('refreshing cache');
      cacheAll = await recipesDatasource.getRecipes();
      cacheRefreshTime = moment().utc().add(12, 'hours');

      cacheAll.forEach(entry => {
        cache[entry.sha] = {
          ...entry,
          refreshTime: moment().utc().subtract(1, 'minutes'),
        };

        console.log('cached key', cache[entry.sha]);
      });
    }
  } catch (err) {
    console.error('Error refreshing cache', err);
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

  console.log('recipe', cache[recipeId]);
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
    console.error('error getting recipe', err);
    throw err;
  }
};

module.exports = {
  getRecipes,
  getRecipe,
};
