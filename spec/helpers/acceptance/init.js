const { createHttpClient, ServiceUnreachableError } = require('./support/http-client');
const { loadConfig } = require('./setup/config');
const { status } = require('./support/status-codes');

/**
 * mocha --require for the acceptance suite.
 *
 * Unlike the integration init, this loads no nock and no lib/: the suite makes
 * real HTTP calls to a service that is already running.
 *
 * The global setup runs once before any spec and turns the ways the suite can
 * be pointed at the wrong thing into a message that names the fix, rather
 * than a wall of identical failures.
 */
const mochaGlobalSetup = async () => {
  const config = loadConfig();
  const client = createHttpClient({ baseUrl: config.baseUrl, timeoutMs: config.requestTimeoutMs });

  let response;

  try {
    response = await client.get('/recipes');
  } catch (err) {
    if (err instanceof ServiceUnreachableError) {
      throw new Error(`Acceptance preflight failed.\n\n${err.message}`);
    }
    throw err;
  }

  if (response.status !== status.OK) {
    throw new Error([
      `Acceptance preflight failed: GET ${config.baseUrl}/recipes returned ${response.status}, expected ${status.OK}.`,
      `Response body: ${response.rawBody}`,
      '',
      'Check that ACCEPTANCE_BASE_URL includes the /api/recipes-service base path.',
    ].join('\n'));
  }

  if (!Array.isArray(response.body) || response.body.length === 0) {
    throw new Error([
      `Acceptance preflight failed: GET ${config.baseUrl}/recipes returned no recipes.`,
      `Response body: ${response.rawBody}`,
      '',
      'The service loads recipes from GitHub at startup; check the recipes repo has files under json/.',
    ].join('\n'));
  }
};

module.exports = {
  mochaGlobalSetup,
};
