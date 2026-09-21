const { createRecipesDriver } = require('./recipes-driver');

/**
 * One driver per API grouping, built once per spec file over the same client.
 *
 * The service has no auth, so unlike feral-authentication-service there is no
 * caller to bind: a driver's methods take only the values they check.
 */
const createDrivers = (client) => ({
  recipes: createRecipesDriver(client),
});

module.exports = {
  createDrivers,
};
