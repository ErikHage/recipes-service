const { expect } = require('chai');

/**
 * Low-level expectations shared by the drivers.
 *
 * This is the only file in the suite that requires chai's expect. Specs and
 * DSL modules must contain no assertions, no status codes and no JSON field
 * paths; the drivers express theirs through these primitives.
 *
 * Failure messages name the call, the status, the raw body and anything the
 * app logged while handling it, so a failing run explains itself without a
 * debugger.
 */

const MAX_BODY_IN_MESSAGE = 500;

const truncate = (text) => (text.length > MAX_BODY_IN_MESSAGE
  ? `${text.slice(0, MAX_BODY_IN_MESSAGE)}... (truncated)`
  : text);

const describeResponse = (response) => {
  const body = response.rawBody === '' ? '<empty body>' : truncate(response.rawBody);
  const log = response.serverLog && response.serverLog.length > 0
    ? `\n  server log: ${truncate(response.serverLog.join('\n    '))}`
    : '';

  return `${response.method} ${response.path} -> ${response.status}\n  body: ${body}${log}`;
};

const failureMessage = (what, expectation, response) => (
  `${what}\n  expected: ${expectation}\n  actual:   ${describeResponse(response)}`
);

const expectStatus = (response, expected, what) => {
  expect(response.status, failureMessage(what, `status ${expected}`, response)).to.equal(expected);
};

/** Header values carry parameters (`text/html; charset=utf-8`), so this matches the start. */
const expectContentType = (response, expectedType, what) => {
  const contentType = response.headers['content-type'] || '';

  expect(
    contentType.startsWith(expectedType),
    failureMessage(what, `content-type ${expectedType} (got "${contentType}")`, response),
  ).to.equal(true);
};

const expectListBody = (response, what) => {
  expect(Array.isArray(response.body), failureMessage(what, 'a JSON array body', response)).to.equal(true);

  return response.body;
};

/** The whole body, compared deeply with `expected`. chai appends the difference. */
const expectBodyToEqual = (response, expected, what) => {
  expect(response.body, failureMessage(what, JSON.stringify(expected), response))
    .to.deep.equal(expected);
};

/**
 * For conditions a driver has already worked out from the body. `expectation`
 * says, in words, what should have been true.
 */
const expectThat = (condition, expectation, response, what) => {
  expect(condition, failureMessage(what, expectation, response)).to.equal(true);
};

/**
 * For failures that have no response to report on -- a cache refresh, a mock
 * left uncalled, a DSL step called wrongly. `message` is the whole explanation.
 */
const expectTrue = (condition, message) => {
  expect(condition, message).to.equal(true);
};

module.exports = {
  expectStatus,
  expectContentType,
  expectListBody,
  expectBodyToEqual,
  expectThat,
  expectTrue,
};
