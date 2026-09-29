/**
 * The single seam between the acceptance suite and the service.
 *
 * This is the only module in the suite that calls fetch(). It never throws on
 * a non-2xx response and it never asserts -- it returns a plain record and
 * lets the drivers decide what the outcome means.
 *
 * Response shape: { status, headers, body, rawBody, method, path }, where
 * `body` is parsed JSON or undefined when the body was empty or not JSON, and
 * `headers` is a plain object with lowercase names.
 */

class ServiceUnreachableError extends Error {}

const parseBody = (rawBody) => {
  if (rawBody === '') {
    return undefined;
  }
  try {
    return JSON.parse(rawBody);
  } catch (err) {
    // Express's default error handler replies with an HTML page; callers get rawBody.
    return undefined;
  }
};

const createHttpClient = (options) => {
  const { baseUrl, timeoutMs, headers: extraHeaders = {} } = options;

  const send = async (method, path) => {
    const headers = { accept: 'application/json', ...extraHeaders };

    let response;

    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      const cause = err.cause && err.cause.code ? ` (${err.cause.code})` : '';

      throw new ServiceUnreachableError([
        `${method} ${path} could not be completed: ${err.message}${cause}`,
        '',
        `Is the service running and listening at ${baseUrl}?`,
        'Start it with `npm start`; it needs a valid GITHUB_API_TOKEN in .env to load recipes.',
        'Point the suite elsewhere with ACCEPTANCE_BASE_URL.',
      ].join('\n'));
    }

    const rawBody = await response.text();

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: parseBody(rawBody),
      rawBody,
      method,
      path,
    };
  };

  return {
    get: (path) => send('GET', path),
    /** A client that sends these headers on every request, e.g. an Origin. */
    withHeaders: (headers) => createHttpClient({
      ...options,
      headers: { ...extraHeaders, ...headers },
    }),
  };
};

module.exports = {
  createHttpClient,
  ServiceUnreachableError,
};
