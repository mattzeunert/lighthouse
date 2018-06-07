/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const walkObject = require('./helpers/walkObject');
// @ts-ignore
const schemaStructure = new Map(require('./assets/schema_google'));
const TYPE_KEYWORD = '@type';
const SCHEMA_ORG_URL = 'http://schema.org/';

/**
 * @param {string} uri
 * @returns {string}
 */
function cleanName(uri) {
  return uri.replace(SCHEMA_ORG_URL, '');
}

/**
 * @param {string} type
 * @returns {{props: Array<string>, required: ?Array<string>, recommended: ?Array<string>}}
 */
function getTypeSettingsForType(type) {
  const typeSettings = schemaStructure.get(type);

  return typeSettings;
}

/**
 * @param {string} type
 * @returns {boolean}
 */
function isKnownType(type) {
  return schemaStructure.has(type);
}

/**
 * Validates keys of given object based on it's type(s). Returns an array of error messages.
 *
 * @param {String|Array<String>} typeOrTypes
 * @param {Array<String>} keys
 * @returns {Array<String>}
 */
function validateObjectKeys(typeOrTypes, keys) {
  /** @type {Array<string>} */
  const errors = [];
  /** @type {Array<string>} */
  const safelist = [];
  /** @type {Array<string>} */
  const required = [];
  /** @type {Array<string>} */
  const recommended = [];

  let types = [];

  if (typeof typeOrTypes === 'string') {
    types.push(typeOrTypes);
  } else if (Array.isArray(typeOrTypes)) {
    types = typeOrTypes;
  } else {
    return ['Unknown value type'];
  }

  const unknownTypes = types.filter(t => !isKnownType(t));

  unknownTypes
    .forEach(type => {
      if (typeof type !== 'string' || type.indexOf(SCHEMA_ORG_URL) === 0) {
        errors.push(`Unrecognized schema.org type ${type}`);
      }
    });

  if (unknownTypes && unknownTypes.length) {
    return errors;
  }

  types.forEach(type => {
    const typeSettings = getTypeSettingsForType(type);

    if (typeSettings.props) {
      typeSettings.props.forEach(key => safelist.push(key));
    }

    if (typeSettings.required) {
      typeSettings.required.forEach(key => required.push(key));
    }

    if (typeSettings.recommended) {
      typeSettings.recommended.forEach(key => recommended.push(key));
    }
  });

  const cleanKeys = keys
    // skip JSON-LD keywords
    .filter(key => key.indexOf('@') !== 0)
    .map(key => cleanName(key));

  cleanKeys
    // remove Schema.org input/output constraints http://schema.org/docs/actions.html#part-4
    .map(key => key.replace(/-(input|output)$/, ''))
    .filter(key => !safelist.includes(key))
    .forEach(key => errors.push(`Unexpected property "${key}"`));

  required
    .filter(key => !cleanKeys.includes(key))
    .forEach(key => errors.push(`Missing required property "${key}"`));

  recommended
    .filter(key => !cleanKeys.includes(key))
    .forEach(key => errors.push(`Missing recommended property "${key}"`));

  return errors;
}

/**
 * @param {Object} expandedObj Valid JSON-LD object in expanded form
 */
module.exports = function validateSchemaOrg(expandedObj) {
  /** @type {Array<{path: string, message: string}>} */
  const errors = [];

  if (expandedObj === null) {
    return errors;
  }

  if (expandedObj.length === 1) {
    expandedObj = expandedObj[0];
  }

  walkObject(expandedObj, (name, value, path, obj) => {
    if (name === TYPE_KEYWORD) {
      const keyErrors = validateObjectKeys(value, Object.keys(obj));

      keyErrors.forEach(e =>
        errors.push({
          // get rid of the first chunk (/@type) as it's the same for all errors
          path: '/' + path.slice(0, -1).map(cleanName).join('/'),
          message: e,
        })
      );
    }
  });

  return errors;
};
