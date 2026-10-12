const request = require('supertest');

const { app } = require('./app');

/**
 * The single seam between the integration suite and the service's HTTP API.
 *
 * The integration counterpart of the acceptance suite's http client: the same
 * response record, but the app runs in-process through supertest instead of
 * over the network. This is the only module in the suite that issues a
 * request. It never throws on a non-2xx response and it never asserts.
 *
 * Response shape: { status, headers, body, rawBody, method, path, serverLog },
 * where `body` is parsed JSON or undefined when the body was empty or not JSON,
 * `headers` is a plain object with lowercase names, and `serverLog` is what the
 * app wrote to console.error while handling the request.
 */

const BASE_PATH = '/api/recipes-service';

const parseBody = (rawBody) => {
  if (rawBody === '') {
    return undefined;
  }
  try {
    return JSON.parse(rawBody);
  } catch (err) {
    return undefined;
  }
};

/**
 * The error-logger middleware writes every handled error to console.error,
 * which in-process is the test run's own output. Captured here rather than
 * printed, so a passing 404 test stays quiet and a failing one can show it.
 */
const capturingConsoleError = async (send) => {
  const serverLog = [];
  // eslint-disable-next-line no-console
  const original = console.error;

  // eslint-disable-next-line no-console
  console.error = (...args) => serverLog.push(args.map((arg) => (
    typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '));

  try {
    return { res: await send(), serverLog };
  } finally {
    // eslint-disable-next-line no-console
    console.error = original;
  }
};

const createHttpClient = () => {
  const send = async (method, path) => {
    const { res, serverLog } = await capturingConsoleError(() => request(app)[method.toLowerCase()](`${BASE_PATH}${path}`)
      .set('accept', 'application/json'));
    const rawBody = res.text || '';

    return {
      status: res.status,
      headers: res.headers,
      body: parseBody(rawBody),
      rawBody,
      method,
      path,
      serverLog,
    };
  };

  return {
    get: (path) => send('GET', path),
  };
};

module.exports = {
  createHttpClient,
};
