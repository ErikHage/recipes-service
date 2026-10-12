const nock = require('nock');

/**
 * mocha --require for the integration suite: the environment the in-process
 * app needs, set before anything loads lib/.
 *
 * Unlike the unit init, this sets up no global chai expect: only
 * drivers/assertions.js asserts.
 */

process.env.LOGGING_LEVEL = 'error';
// must be set before lib/ is loaded; dotenv will not override it with the real token
process.env.GITHUB_API_TOKEN = 'test-token';

// the app logger ignores LOGGING_LEVEL and writes to console + ./logs; silence it for tests
const logger = require('../../../lib/helpers/logging');

Object.values(logger.transports).forEach((transport) => {
  // eslint-disable-next-line no-param-reassign
  transport.silent = true;
});

// fail fast on any real outbound call, but allow supertest to reach the in-process app
nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');
