const tryDecorator = require('../middleware/try-decorator');

const { statusCodes } = require('../helpers/constants');

/**
 * Answers "is this process serving?" for the Docker HEALTHCHECK. It touches
 * neither GitHub nor the recipe cache, so a GitHub outage doesn't mark the
 * container unhealthy.
 */
class HealthController {
  constructor() {
    this.getHealth = tryDecorator(this.getHealthRaw.bind(this));
  }

  getHealthRaw(req, res) {
    res.status(statusCodes.OK).send({ status: 'ok' });
  }
}

module.exports = HealthController;
