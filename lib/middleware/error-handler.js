const GENERIC_MESSAGE = 'Something went wrong';

const statusOf = (err) => (Number.isInteger(err.status) && err.status >= 400 && err.status < 600
  ? err.status
  : 500);

// errors from the error factory describe themselves; anything else gets a generic body
// so internal messages (e.g. from GitHub) never reach the client
const bodyOf = (err, status) => {
  if (typeof err.toObject === 'function') {
    return err.toObject();
  }

  const message = status < 500 && err.expose ? err.message : GENERIC_MESSAGE;
  return { errors: [{ status, message }] };
};

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const status = statusOf(err);

  res.status(status).json(bodyOf(err, status));
};
