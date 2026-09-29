/**
 * HTTP status codes the drivers expect from the service.
 *
 * Deliberately a copy rather than an import from lib/: the acceptance suite is
 * a black-box client and must not depend on the code it is testing. If the
 * service ever changed a code, importing it would make the test agree with the
 * change instead of catching it.
 */
const status = {
  OK: 200,
  NOT_FOUND: 404,
};

module.exports = {
  status,
};
