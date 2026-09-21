const dataMapper = require('../../../lib/services/recipes/data-mapper');

describe('Recipes Data Mapper', () => {
  describe('#fromMetadata', () => {
    const sha = 'some-sha';

    it('should map a single word filename', () => {
      const result = dataMapper.fromMetadata({ name: 'pancakes.json', sha });

      expect(result).to.deep.equal({ name: 'Pancakes', filename: 'pancakes.json', sha });
    });

    it('should map a hyphenated filename to capitalized words', () => {
      const result = dataMapper.fromMetadata({ name: 'tomato-basil-soup.json', sha });

      expect(result.name).to.equal('Tomato Basil Soup');
    });

    it('should only use the part of the filename before the first dot', () => {
      const result = dataMapper.fromMetadata({ name: 'chili.v2.json', sha });

      expect(result.name).to.equal('Chili');
      expect(result.filename).to.equal('chili.v2.json');
    });
  });

  describe('#fromFileContents', () => {
    it('should decode and parse the file contents', () => {
      const recipe = { recipeName: 'Pancakes', keywords: ['breakfast'] };

      const result = dataMapper.fromFileContents({
        content: Buffer.from(JSON.stringify(recipe)).toString('base64'),
        encoding: 'base64',
      });

      expect(result).to.deep.equal(recipe);
    });

    it('should throw when the contents are not valid json', () => {
      expect(() => dataMapper.fromFileContents({
        content: Buffer.from('not json').toString('base64'),
        encoding: 'base64',
      })).to.throw(SyntaxError);
    });
  });
});
