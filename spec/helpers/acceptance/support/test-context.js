const { createDrivers } = require('../drivers/drivers');
const { createHttpClient } = require('./http-client');
const { loadConfig } = require('../setup/config');

/**
 * Per-spec plumbing: how to reach the service, the drivers built over it, and
 * whatever the spec has created on the server that needs tearing down.
 *
 * Knows nothing about the names a spec uses -- that is dsl/world.js, which
 * wraps one of these. Specs never see it.
 *
 * Today the service has no auth and no write endpoints, so there are no
 * identities to hand out and nothing to delete. If that changes, logins (an
 * `admin()` that caches its token, say) and a registry of created resources
 * belong here, as in feral-authentication-service.
 */
const createTestContext = () => {
  const config = loadConfig();
  const client = createHttpClient({ baseUrl: config.baseUrl, timeoutMs: config.requestTimeoutMs });

  return {
    /** Built once; stateless, so one set serves the whole spec. */
    drivers: createDrivers(client),

    /** Tears down what the spec created on the server. Nothing, today. */
    async cleanup() {},
  };
};

module.exports = {
  createTestContext,
};
