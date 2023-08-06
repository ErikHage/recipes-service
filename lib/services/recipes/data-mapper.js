/**
 * Expects a filename in the format "recipe-name.json" and transforms it to "Recipe Name"
 * @param {*} filename
 */
const parseNameFromFileName = (filename) => {
  const [snakeCaseName] = filename.split('.');
  const words = snakeCaseName.split('-');

  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const fromMetadata = (rawData) => ({
  name: parseNameFromFileName(rawData.name),
  filename: rawData.name,
  sha: rawData.sha,
});

const fromFileContents = (body) => {
  const { content, encoding } = body;
  const buff = Buffer.from(content, encoding);
  return JSON.parse(buff.toString());
};

module.exports = {
  fromMetadata,
  fromFileContents,
};
