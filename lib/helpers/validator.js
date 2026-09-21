const errorFactory = require('../error/error-factory');

const joiOptions = {
  stripUnknown: true,
};

const validate = (obj, schema, errOverride) => {
  const result = schema.validate(obj, joiOptions);

  if (result.error) {
    if (errOverride) {
      throw errOverride;
    } else {
      throw errorFactory.getErrorFromCode('VALIDATION_ERROR', { obj }, result.error);
    }
  }
};

module.exports = {
  validate,
};
