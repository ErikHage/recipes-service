const RecipePrimer = require('../../../lib/helpers/recipe-primer');
const logger = require('../../../lib/helpers/logging');

const SOMETHING_WENT_WRONG = new Error('Something went wrong');
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe('Recipe Primer', () => {
  let primerInstance;
  let recipeCacheStub;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    recipeCacheStub = {
      refreshCache: sinon.stub(),
    };
    sinon.stub(logger, 'info');
    sinon.stub(logger, 'error');
    sinon.stub(process, 'exit');

    primerInstance = new RecipePrimer(recipeCacheStub);
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  describe('#prime', () => {
    describe('when the refresh succeeds', () => {
      it('should refresh the cache and log that it was primed', async () => {
        recipeCacheStub.refreshCache.resolves();

        await primerInstance.prime();

        expect(recipeCacheStub.refreshCache).to.have.been.calledOnce();
        expect(logger.info).to.have.been.calledWith('Recipe cache primed');
        expect(logger.error).to.not.have.been.called();
      });

      it('should prime again after 24 hours', async () => {
        recipeCacheStub.refreshCache.resolves();

        await primerInstance.prime();
        clock.tick(ONE_DAY_MS - 1);
        expect(recipeCacheStub.refreshCache).to.have.been.calledOnce();

        clock.tick(1);
        expect(recipeCacheStub.refreshCache).to.have.been.calledTwice();
      });
    });

    describe('when the refresh fails and exitOnFail is false', () => {
      it('should log the error without exiting or logging that it was primed', async () => {
        recipeCacheStub.refreshCache.rejects(SOMETHING_WENT_WRONG);

        await primerInstance.prime();

        expect(logger.error).to.have.been.calledWith('Error priming recipe cache');
        expect(logger.error).to.have.been.calledWith(SOMETHING_WENT_WRONG);
        expect(logger.info).to.not.have.been.calledWith('Recipe cache primed');
        expect(process.exit).to.not.have.been.called();
      });

      it('should still prime again after 24 hours', async () => {
        recipeCacheStub.refreshCache.rejects(SOMETHING_WENT_WRONG);

        await primerInstance.prime();
        clock.tick(ONE_DAY_MS);

        expect(recipeCacheStub.refreshCache).to.have.been.calledTwice();
      });
    });

    describe('when the refresh fails and exitOnFail is true', () => {
      it('should exit the process with code 69', async () => {
        recipeCacheStub.refreshCache.rejects(SOMETHING_WENT_WRONG);

        await primerInstance.prime(true);

        expect(process.exit).to.have.been.calledWith(69);
        expect(logger.info).to.not.have.been.calledWith('Recipe cache primed');
      });
    });
  });
});
