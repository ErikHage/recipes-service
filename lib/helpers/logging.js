const winston = require('winston');

const LOG_LEVEL_PADDING = (new Array(6)).join(' ');
const FILE_NAME_PADDING = (new Array(60)).join(' ');

const pad = (val, str, padLeft) => {
  if (typeof str === 'undefined') {
    return val;
  } else if (padLeft) {
    return (val + str).slice(-val.length);
  }
  return (str + val).substring(0, val.length);
};

const logFormatter = (options) => `${options.timestamp()} - ${pad(LOG_LEVEL_PADDING, options.level.toUpperCase(), true)}[${((options.meta && options.meta.js) ? pad(FILE_NAME_PADDING, options.meta.js, true) : pad(FILE_NAME_PADDING, '', true))}] - ${(options.message ? options.message : '')}`;

const DEFAULT_OPTIONS = {
  json: false,
  colorize: true,
  timestamp: () => new Date().toISOString(),
  formatter: logFormatter,
  handleExceptions: true,
};

const getConsoleProperties = () => {
  const consoleOptions = DEFAULT_OPTIONS;
  consoleOptions.level = 'debug';
  return consoleOptions;
};

const getFileProperties = () => {
  const fileOptions = DEFAULT_OPTIONS;
  fileOptions.maxsize = 10000000;
  fileOptions.maxFiles = 10;
  fileOptions.dirname = './logs';
  fileOptions.filename = 'rwb.log';
  fileOptions.eol = '\n';
  fileOptions.level = 'info';
  return fileOptions;
};

module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(getConsoleProperties()),
    new (winston.transports.File)(getFileProperties()),
  ],
});
