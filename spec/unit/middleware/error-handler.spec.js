const errorHandler = require('../../../lib/middleware/error-handler');
const errorFactory = require('../../../lib/error/error-factory');

describe('Error Handler Middleware', () => {
  const req = {};
  let res;
  let next;

  beforeEach(() => {
    res = {
      headersSent: false,
      status: sinon.stub(),
      json: sinon.stub(),
    };
    res.status.returns(res);
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('when the error comes from the error factory', () => {
    it('should reply with its status and its own error body', () => {
      const err = errorFactory.getErrorFromCode('RECIPE_NOT_FOUND');

      errorHandler(err, req, res, next);

      expect(res.status).to.have.been.calledWith(404);
      expect(res.json).to.have.been.calledWith({
        errors: [{
          status: 404,
          code: 'RECIPE_NOT_FOUND',
          source: 'recipes-service',
          message: 'Recipe not found',
        }],
      });
      expect(next).to.not.have.been.called();
    });
  });

  describe('when the error is a plain error', () => {
    it('should reply 500 with a generic message, hiding the internal one', () => {
      errorHandler(new Error('Bad credentials'), req, res, next);

      expect(res.status).to.have.been.calledWith(500);
      expect(res.json).to.have.been.calledWith({
        errors: [{ status: 500, message: 'Something went wrong' }],
      });
    });
  });

  describe('when a plain error carries a client status', () => {
    it('should keep the status and show the message only if it is marked as exposable', () => {
      const exposed = Object.assign(new Error('invalid json'), { status: 400, expose: true });
      const hidden = Object.assign(new Error('internal detail'), { status: 400 });

      errorHandler(exposed, req, res, next);
      errorHandler(hidden, req, res, next);

      expect(res.json.firstCall).to.have.been.calledWith({ errors: [{ status: 400, message: 'invalid json' }] });
      expect(res.json.secondCall).to.have.been.calledWith({ errors: [{ status: 400, message: 'Something went wrong' }] });
    });
  });

  describe('when the error carries a status outside 400-599', () => {
    it('should reply 500', () => {
      errorHandler(Object.assign(new Error('odd'), { status: 302 }), req, res, next);

      expect(res.status).to.have.been.calledWith(500);
    });
  });

  describe('when the response has already started', () => {
    it('should hand the error to the next handler without writing', () => {
      res.headersSent = true;
      const err = new Error('late');

      errorHandler(err, req, res, next);

      expect(next).to.have.been.calledWith(err);
      expect(res.status).to.not.have.been.called();
    });
  });
});
