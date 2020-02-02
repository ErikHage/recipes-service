'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const routes = require('./routes');
const errorLogger = require('./middleware/error-logger');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api/recipes-service', routes);

app.use(errorLogger);

module.exports = app;
