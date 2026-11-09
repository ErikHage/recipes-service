const HealthController = require('../../../lib/controllers/health');

describe('Health Controller', () => {
  let healthControllerInstance;
  let res;
  let next;

  beforeEach(() => {
    res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
    next = sinon.stub();

    healthControllerInstance = new HealthController();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('#getHealth', () => {
    it('should answer that the process is serving', async () => {
      await healthControllerInstance.getHealth({}, res, next);

      expect(res.status).to.have.been.calledWith(200);
      expect(res.send).to.have.been.calledWith({ status: 'ok' });
      expect(next).to.not.have.been.called();
    });
  });
});
