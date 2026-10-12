const { createGithubDsl } = require('./github-dsl');
const { createRecipeCacheDsl } = require('./recipe-cache-dsl');
const { createRecipesDsl } = require('./recipes-dsl');
const { createWorld } = require('./world');
const { expectStepRejected } = require('./dsl-misuse');

/**
 * The one thing a spec requires.
 *
 * Everything a spec can say lives behind this, so the layering is checkable:
 * any other require in spec/integration is a spec reaching past the DSL.
 *
 * Create one per spec file and pass `cleanup` to afterEach, so each test
 * starts with no names, no GitHub mocks and an empty recipe cache.
 */
const createIntegrationDsl = () => {
  const world = createWorld();
  const { github, recipeCache, recipes } = world.drivers;

  return {
    github: createGithubDsl(world, github),
    recipeCache: createRecipeCacheDsl(world, recipeCache),
    recipes: createRecipesDsl(world, recipes),
    misuse: { expectStepRejected },
    cleanup: () => world.cleanup(),
  };
};

module.exports = {
  createIntegrationDsl,
};
