const { DslParamsError } = require('@feral-auth/ts-simple-dsl');

const { expectTrue } = require('../drivers/assertions');

/**
 * Expectations about the DSL itself rather than about the service: a step
 * called wrongly must say so clearly, or a mistyped parameter name would look
 * like a service failure.
 *
 * The one DSL-layer file that asserts, because its subject is a broken call,
 * which no driver sees. It still goes through drivers/assertions.js.
 */

const indent = (text) => text.split('\n').map((line) => `  ${line}`).join('\n');

/**
 * Runs a step that should be rejected before it reaches the service and checks
 * it reported exactly the expected problems (each matched as a substring).
 */
const expectStepRejected = async (step, ...expectedProblems) => {
  let caught;

  try {
    await step();
  } catch (err) {
    caught = err;
  }

  expectTrue(
    caught instanceof DslParamsError,
    `expected the step to be rejected before it reached the service, but got: ${caught === undefined ? 'no error' : caught}`,
  );

  const reported = indent(caught.problems.join('\n'));

  expectedProblems.forEach((expected) => {
    expectTrue(
      caught.problems.some((problem) => problem.includes(expected)),
      `expected a problem mentioning:\n  ${expected}\nbut the step reported:\n${reported}`,
    );
  });

  expectTrue(
    caught.problems.length === expectedProblems.length,
    `expected exactly ${expectedProblems.length} problem(s), but the step reported:\n${reported}`,
  );
};

module.exports = {
  expectStepRejected,
};
