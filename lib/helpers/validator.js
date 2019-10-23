const joi = require('joi');

const errorFactory = require('../error/error-factory');

const joiOptions = {
  stripUnknown: true,
};

const validate = (obj, schema, errOverride) => {
  const result = joi.validate(obj, schema, joiOptions);

  if (result.err) {
    if (errOverride) {
      throw errOverride;
    } else {
      throw errorFactory.getErrorFromCode('VALIDATION_ERROR', { obj }, result.err);
    }
  }
};

module.exports = {
  validate,
};
