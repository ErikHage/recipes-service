const utilities = require('../../../lib/helpers/utilities');

describe('Utilities', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('#sleep', () => {
    it('should resolve only after the given time', async () => {
      const clock = sinon.useFakeTimers();
      const resolved = sinon.stub();

      const promise = utilities.sleep(1000).then(resolved);

      clock.tick(999);
      await Promise.resolve();
      expect(resolved).to.not.have.been.called();

      clock.tick(1);
      await promise;
      expect(resolved).to.have.been.calledOnce();

      clock.restore();
    });
  });

  describe('#shuffleArray', () => {
    it('should return an empty array unchanged', async () => {
      expect(await utilities.shuffleArray([])).to.deep.equal([]);
    });

    it('should return a single element array unchanged', async () => {
      expect(await utilities.shuffleArray(['a'])).to.deep.equal(['a']);
    });

    it('should shuffle the array in place', async () => {
      // random 0 always swaps the current element with the first
      sinon.stub(Math, 'random').returns(0);
      const arr = ['a', 'b', 'c'];

      const result = await utilities.shuffleArray(arr);

      expect(result).to.equal(arr);
      expect(result).to.deep.equal(['b', 'c', 'a']);
    });
  });
});
