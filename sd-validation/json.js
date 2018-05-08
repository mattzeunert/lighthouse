'use strict';

const jsonlint = require('jsonlint-mod');

/**
 * @param {string} input
 * @returns {Object}
 */
module.exports = function parseJSON(input) {
  jsonlint.parse(input);
  return JSON.parse(input);
};
