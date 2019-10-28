/* eslint-disable no-param-reassign */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shuffleArray = async (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

module.exports = {
  sleep,
  shuffleArray,
};
