const errorFactory = require('../../../lib/error/error-factory');
const errorMessages = require('../../../lib/config/errors.json');

const NO_STATUS_CODE = 'TEST_NO_STATUS';

describe('Error Factory', () => {
  describe('#getErrorFromCode', () => {
    describe('when the code is not configured', () => {
      it('should throw', () => {
        expect(() => errorFactory.getErrorFromCode('NOT_A_CODE'))
          .to.throw('[ERROR_FACTORY] invalid error code passed in');
      });
    });

    describe('when the code is configured with a status', () => {
      it('should build the error from the config', () => {
        const err = errorFactory.getErrorFromCode('RECIPE_NOT_FOUND');

        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('Recipe not found');
        expect(err.status).to.equal(404);
        expect(err.code).to.equal('RECIPE_NOT_FOUND');
        expect(err.type).to.equal('NotFound');
        expect(err.source).to.equal('recipes-service');
      });

      it('should keep the configured status over the cause status', () => {
        const err = errorFactory.getErrorFromCode('RECIPE_NOT_FOUND', undefined, { status: 503 });

        expect(err.status).to.equal(404);
      });
    });

    describe('when the code is configured without a status', () => {
      beforeEach(() => {
        errorMessages[NO_STATUS_CODE] = { message: 'No status configured' };
      });

      afterEach(() => {
        delete errorMessages[NO_STATUS_CODE];
      });

      it('should use the status of the appended error', () => {
        const err = errorFactory.getErrorFromCode(NO_STATUS_CODE, undefined, { status: 502 });

        expect(err.status).to.equal(502);
      });

      it('should default to 500 when the appended error has no status', () => {
        const err = errorFactory.getErrorFromCode(NO_STATUS_CODE, undefined, new Error('cause'));

        expect(err.status).to.equal(500);
      });

      it('should default to 500 when there is no appended error', () => {
        const err = errorFactory.getErrorFromCode(NO_STATUS_CODE);

        expect(err.status).to.equal(500);
      });
    });

    describe('debug params', () => {
      it('should include the debug params in the stack when given', () => {
        const err = errorFactory.getErrorFromCode('RECIPE_NOT_FOUND', { recipeId: 'some-recipe-id' });

        expect(err.stack).to.include('some-recipe-id');
      });

      it('should not add debug params when not given', () => {
        const err = errorFactory.getErrorFromCode('RECIPE_NOT_FOUND');

        expect(err.stack).to.not.include('recipeId');
      });
    });

    describe('causedBy', () => {
      it('should reference the appended error without making it enumerable', () => {
        const cause = new Error('cause');

        const err = errorFactory.getErrorFromCode('RECIPE_NOT_FOUND', undefined, cause);

        expect(err.causedBy).to.equal(cause);
        expect(Object.keys(err)).to.not.include('causedBy');
      });
    });

    describe('#toObject and #toJSON', () => {
      it('should list only the error itself when there is no cause', () => {
        const err = errorFactory.getErrorFromCode('RECIPE_NOT_FOUND');

        expect(err.toObject()).to.deep.equal({
          errors: [{
            status: 404,
            code: 'RECIPE_NOT_FOUND',
            source: 'recipes-service',
            message: 'Recipe not found',
          }],
        });
      });

      it('should walk the cause chain', () => {
        const cause = errorFactory.getErrorFromCode('RECIPE_NOT_FOUND');
        const err = errorFactory.getErrorFromCode('VALIDATION_ERROR', undefined, cause);

        expect(err.toObject().errors.map(e => e.code))
          .to.deep.equal(['VALIDATION_ERROR', 'RECIPE_NOT_FOUND']);
        expect(err.toJSON()).to.equal(JSON.stringify(err.toObject()));
      });
    });
  });
});
