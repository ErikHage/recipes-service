const logger = require('../../../lib/helpers/logging');

const MODULE_PATH = '../../../lib/helpers/git-api-access';

// the token check runs at module load, so each test reloads the module
const loadModule = () => {
  delete require.cache[require.resolve(MODULE_PATH)];
  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(MODULE_PATH);
};

describe('Git API Access', () => {
  const originalToken = process.env.GITHUB_API_TOKEN;

  beforeEach(() => {
    sinon.stub(logger, 'error');
    sinon.stub(process, 'exit');
  });

  afterEach(() => {
    process.env.GITHUB_API_TOKEN = originalToken;
    sinon.restore();
    // restore a normally-loaded module for other specs
    loadModule();
  });

  describe('when the token is present', () => {
    it('should expose an octokit client without exiting', () => {
      process.env.GITHUB_API_TOKEN = 'some-token';

      const gitApiAccess = loadModule();

      expect(gitApiAccess.getOctokit()).to.have.property('request').that.is.a('function');
      expect(process.exit).to.not.have.been.called();
    });

    it('should return the same client on every call', () => {
      const gitApiAccess = loadModule();

      expect(gitApiAccess.getOctokit()).to.equal(gitApiAccess.getOctokit());
    });
  });

  describe('when the token is missing', () => {
    it('should log an error and exit with code 1', () => {
      delete process.env.GITHUB_API_TOKEN;
      // keep dotenv from loading a real token out of .env
      sinon.stub(require('dotenv'), 'config'); // eslint-disable-line global-require

      loadModule();

      expect(logger.error).to.have.been.calledWith('GITHUB_API_TOKEN required but not present');
      expect(process.exit).to.have.been.calledWith(1);
    });
  });

  describe('when the token is empty', () => {
    it('should log an error and exit with code 1', () => {
      process.env.GITHUB_API_TOKEN = '';

      loadModule();

      expect(logger.error).to.have.been.calledWith('GITHUB_API_TOKEN required but not present');
      expect(process.exit).to.have.been.calledWith(1);
    });
  });
});
