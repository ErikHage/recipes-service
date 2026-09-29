const { createRecipesDsl } = require('./recipes-dsl');
const { createWorld } = require('./world');
const { expectStepRejected } = require('./dsl-misuse');

/**
 * The one thing a spec requires.
 *
 * Everything a spec can say lives behind this, so the layering is checkable:
 * any other require in spec/acceptance is a spec reaching past the DSL.
 *
 * Create one per spec file and pass `cleanup` to afterEach, so each test
 * starts with no names.
 */
const createAcceptanceDsl = () => {
  const world = createWorld();

  return {
    recipes: createRecipesDsl(world, world.drivers.recipes),
    misuse: { expectStepRejected },
    cleanup: () => world.cleanup(),
  };
};

module.exports = {
  createAcceptanceDsl,
};
