const joi = require('joi');

const validator = require('../../../lib/helpers/validator');

const ERROR_WAS_EXPECTED = new Error('An error was expected but was not thrown');

describe('Validator', () => {
  const schema = joi.object({
    name: joi.string().required(),
  });

  describe('#validate', () => {
    describe('when the object is valid', () => {
      it('should not throw', () => {
        expect(() => validator.validate({ name: 'some-name', extra: true }, schema)).to.not.throw();
      });
    });

    describe('when the object is invalid', () => {
      it('should throw a VALIDATION_ERROR caused by the joi error', () => {
        const obj = { name: 123 };

        try {
          validator.validate(obj, schema);
        } catch (err) {
          expect(err.code).to.equal('VALIDATION_ERROR');
          expect(err.status).to.equal(400);
          expect(err.causedBy.isJoi).to.be.true();
          return;
        }
        throw ERROR_WAS_EXPECTED;
      });
    });

    describe('when the object is invalid and an override is given', () => {
      it('should throw the override', () => {
        const override = new Error('some override');

        expect(() => validator.validate({}, schema, override)).to.throw(override);
      });
    });
  });
});
