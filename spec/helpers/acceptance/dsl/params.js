const { optional, required } = require('@feral-auth/ts-simple-dsl');

/**
 * Parameter declarations shared across the DSL modules, so every module asks
 * the same question with the same word.
 */

/** The name a spec gives a recipe, to refer to it in a later step. */
const alias = () => required();

/** Picks a particular recipe by its listed recipeName; omitted means the first one listed. */
const named = () => optional();

module.exports = {
  alias,
  named,
};
