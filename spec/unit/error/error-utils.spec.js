const errorUtils = require('../../../lib/error/error-utils');

describe('Error Utils', () => {
  describe('#filter', () => {
    describe('when the input is not an object', () => {
      it('should throw a TypeError for a string', () => {
        expect(() => errorUtils.filter('some-error'))
          .to.throw(TypeError, "Function parameter expects 'object' but was string");
      });

      it('should throw a TypeError for null', () => {
        expect(() => errorUtils.filter(null)).to.throw(TypeError);
      });
    });

    describe('when no props are given', () => {
      it('should keep only the default error fields', () => {
        const err = {
          status: 404,
          code: 'SOME_CODE',
          source: 'some-source',
          details: 'some-details',
          message: 'some-message',
          other: 'dropped',
        };

        expect(errorUtils.filter(err)).to.deep.equal({
          status: 404,
          code: 'SOME_CODE',
          source: 'some-source',
          details: 'some-details',
          message: 'some-message',
        });
      });
    });

    describe('when props are given', () => {
      it('should keep only those props', () => {
        expect(errorUtils.filter({ a: 1, b: 2, c: 3 }, ['a', 'c'])).to.deep.equal({ a: 1, c: 3 });
      });
    });

    describe('when props are missing or inherited', () => {
      it('should skip them', () => {
        const err = Object.create({ status: 500 });
        err.code = 'SOME_CODE';

        expect(errorUtils.filter(err)).to.deep.equal({ code: 'SOME_CODE' });
      });
    });
  });
});
