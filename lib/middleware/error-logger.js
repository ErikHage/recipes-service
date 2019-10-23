module.exports = (err, req, res, next) => {
  const message = err.toJSON ? err.toJSON() : err.toString();

  // eslint-disable-next-line no-console
  console.error(message, { js: 'middleware/error-logger.js' });
  next(err);
};
