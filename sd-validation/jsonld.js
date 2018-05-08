'use strict';

const walkObject = require('./helpers/walkObject');

const CONTEXT = '@context';
const KEYWORDS = [
  '@base',
  '@container',
  CONTEXT,
  '@graph',
  '@id',
  '@index',
  '@language',
  '@list',
  '@nest',
  '@none',
  '@prefix',
  '@reverse',
  '@set',
  '@type',
  '@value',
  '@version',
  '@vocab',
];

/**
 * @param {string} fieldName
 * @returns boolean
 */
function validKeyword(fieldName) {
  return KEYWORDS.includes(fieldName);
}

/**
 * @param {string} name
 * @returns {string | null} error
 */
function validateField(name) {
  if (name[0] === '@' && !validKeyword(name)) {
    return 'Unknown keyword';
  }

  return null;
}

/**
 * @param {Object} json
 * @returns Array<{path: string, message: string}>
 */
module.exports = function validateJsonLD(json) {
  /** @type Array<{path: string, message: string}> */
  const errors = [];

  walkObject(json, (name, value, path, object) => {
    const error = validateField.call(null, name, value, path, object);

    if (error) {
      errors.push({
        path: path.join('/'),
        message: error,
      });
    }
  });

  return errors;
};
