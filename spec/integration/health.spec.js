const { createIntegrationDsl } = require('../helpers/integration/dsl/integration-dsl');

describe('GET /health (integration)', () => {
  const { health, cleanup } = createIntegrationDsl();

  afterEach(cleanup);

  it('reports that it is healthy, with nothing loaded from GitHub', async () => {
    await health.checkHealth();
  });
});
