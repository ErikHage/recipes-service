const { createAcceptanceDsl } = require('../helpers/acceptance/dsl/acceptance-dsl');

describe('GET /health (acceptance)', () => {
  const { health, cleanup } = createAcceptanceDsl();

  afterEach(cleanup);

  it('reports that it is healthy', async () => {
    await health.checkHealth();
  });
});
