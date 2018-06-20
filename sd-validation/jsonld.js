/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const walkObject = require('./helpers/walkObject');

// This list comes from the JSON-LD 1.1 spec: https://json-ld.org/spec/latest/json-ld/#syntax-tokens-and-keywords
const KEYWORDS = [
  '@base',
  '@container',
  '@context',
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
 * @param {string} keyName
 * @returns {string | null} error
 */
function validateKey(keyName) {
  if (keyName[0] === '@' && !validKeyword(keyName)) {
    return 'Unknown keyword';
  }

  return null;
}

/**
 * @param {Object} json
 * @returns {Array<{path: string, message: string}>}
 */
module.exports = function validateJsonLD(json) {
  /** @type {Array<{path: string, message: string}>} */
  const errors = [];

  walkObject(json, (name, value, path, object) => {
    const error = validateKey.call(null, name, value, path, object);

    if (error) {
      errors.push({
        path: path.join('/'),
        message: error,
      });
    }
  });

  return errors;
};
