const { required } = require('@feral-auth/ts-simple-dsl');

/**
 * Parameter declarations shared across the DSL modules, so every module asks
 * the same question with the same word.
 */

/** The name a spec gives a recipe, to refer to it in a later step. */
const alias = () => required();

/** What a step should do, e.g. `expect: succeeds | is rejected`. A typo fails at parse time. */
const outcome = (...values) => required().allowedValues(...values);

module.exports = {
  alias,
  outcome,
};
