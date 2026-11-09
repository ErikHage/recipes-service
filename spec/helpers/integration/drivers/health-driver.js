const { expectBodyToEqual, expectStatus } = require('./assertions');
const { status } = require('../support/status-codes');

/** GET /health, which the Docker HEALTHCHECK calls. */
const createHealthDriver = (client) => ({
  /** Replies 200, saying the process is serving. */
  async getHealthReturnsOk() {
    const what = 'checking the service\'s health';
    const response = await client.get('/health');

    expectStatus(response, status.OK, what);
    expectBodyToEqual(response, { status: 'ok' }, what);
  },
});

module.exports = {
  createHealthDriver,
};
