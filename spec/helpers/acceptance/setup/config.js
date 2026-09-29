const path = require('path');
const dotenv = require('dotenv');

/**
 * Configuration for the acceptance suite: how to reach a *running* service.
 *
 * Nothing under the acceptance dirs may require lib/ -- the suite is a
 * black-box client and knows the service only through HTTP.
 *
 * Every value is optional. Set them in the shell or in
 * spec/helpers/acceptance/.env.acceptance (see .env.acceptance.example).
 */

const ENV_FILE = path.resolve(__dirname, '..', '.env.acceptance');

const DEFAULT_BASE_URL = 'http://localhost:3000/api/recipes-service';
const DEFAULT_REQUEST_TIMEOUT_MS = 10000;

let cachedConfig;

const readValue = (key) => (process.env[key] || '').trim();

const loadConfig = () => {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }

  // does not override variables already set in the shell
  dotenv.config({ path: ENV_FILE });

  const timeout = Number(readValue('ACCEPTANCE_REQUEST_TIMEOUT_MS'));

  cachedConfig = {
    baseUrl: (readValue('ACCEPTANCE_BASE_URL') || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    requestTimeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_REQUEST_TIMEOUT_MS,
  };

  return cachedConfig;
};

module.exports = {
  loadConfig,
};
