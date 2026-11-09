const { parseDslArgs } = require('@feral-auth/ts-simple-dsl');

/** The health route, in words. */
const createHealthDsl = (world, health) => ({
  /** Asserts the health route answers that the process is serving. */
  async checkHealth(...args) {
    parseDslArgs(args, {});

    await health.getHealthReturnsOk();
  },
});

module.exports = {
  createHealthDsl,
};
