const tryDecorator = require('../../../lib/middleware/try-decorator');

const SOMETHING_WENT_WRONG = new Error('Something went wrong');

describe('Try Decorator', () => {
  const req = {};
  const res = {};
  let next;

  beforeEach(() => {
    next = sinon.stub();
  });

  describe('when the handler resolves', () => {
    it('should call the handler and not call next', async () => {
      const handler = sinon.stub().resolves();

      await tryDecorator(handler)(req, res, next);

      expect(handler).to.have.been.calledWith(req, res, next);
      expect(next).to.not.have.been.called();
    });
  });

  describe('when the handler rejects', () => {
    it('should pass the error to next', async () => {
      const handler = sinon.stub().rejects(SOMETHING_WENT_WRONG);

      await tryDecorator(handler)(req, res, next);

      expect(next).to.have.been.calledWith(SOMETHING_WENT_WRONG);
    });
  });

  describe('when the handler throws synchronously', () => {
    it('should pass the error to next', async () => {
      const handler = sinon.stub().throws(SOMETHING_WENT_WRONG);

      await tryDecorator(handler)(req, res, next);

      expect(next).to.have.been.calledWith(SOMETHING_WENT_WRONG);
    });
  });
});
