const errorLogger = require('../../../lib/middleware/error-logger');

describe('Error Logger Middleware', () => {
  const req = {};
  const res = {};
  let next;

  beforeEach(() => {
    next = sinon.stub();
    sinon.stub(console, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('when the error has toJSON', () => {
    it('should log the json and pass the error to next', () => {
      const err = new Error('some error');
      err.toJSON = () => '{"errors":[]}';

      errorLogger(err, req, res, next);

      // eslint-disable-next-line no-console
      expect(console.error).to.have.been.calledWith('{"errors":[]}');
      expect(next).to.have.been.calledWith(err);
    });
  });

  describe('when the error does not have toJSON', () => {
    it('should log the string form and pass the error to next', () => {
      const err = new Error('some error');

      errorLogger(err, req, res, next);

      // eslint-disable-next-line no-console
      expect(console.error).to.have.been.calledWith('Error: some error');
      expect(next).to.have.been.calledWith(err);
    });
  });
});
