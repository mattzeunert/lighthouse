/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const parseJSON = require('./json.js');
const validateJsonLD = require('./jsonld.js');
const promiseExpand = require('./expand.js');
const validateSchemaOrg = require('./schema.js');

/**
 * Validates JSON-LD input. Returns array of error objects.
 *
 * @param {string} textInput
 * @returns {Promise<Array<{path: ?string, validator: string, message: string}>>}
 */
module.exports = async function validate(textInput) {
  /** @type {Array<{path: ?string, validator: string, message: string}>} */
  const errors = [];

  // STEP 1: VALIDATE JSON
  const parseOutput = parseJSON(textInput);

  if (parseOutput.error) {
    errors.push({
      validator: 'json',
      line: parseOutput.error.line,
      message: parseOutput.error.message,
    });

    return errors;
  }

  const inputObject = parseOutput.result;

  // STEP 2: VALIDATE JSONLD
  const jsonLdErrors = validateJsonLD(inputObject);

  if (jsonLdErrors && jsonLdErrors.length) {
    jsonLdErrors.forEach(error => {
      errors.push({
        validator: 'json-ld',
        path: error.path,
        line: getLineNumberFromJsonPath(inputObject, error.path),
        message: error.message.toString(),
      });
    });

    return errors;
  }

  // STEP 3: EXPAND
  let expandedObj = null;
  try {
    expandedObj = await promiseExpand(inputObject);
  } catch (error) {
    errors.push({
      validator: 'json-ld-expand',
      path: null,
      message: error && error.toString(),
    });

    return errors;
  }

  // STEP 4: VALIDATE SCHEMA
  const schemaOrgErrors = validateSchemaOrg(expandedObj);

  if (schemaOrgErrors && schemaOrgErrors.length) {
    schemaOrgErrors.forEach(error => {
      errors.push({
        validator: 'schema-org',
        path: error.path,
        message: error.message,
        line: getLineNumberFromJsonPath(inputObject, error.path),
        types: error.types,
      });
    });

    return errors;
  }

  return errors;
};

function getLineNumberFromJsonPath(obj, path) {
  // To avoid having an extra dependency on a JSON parser we set a unique key in the
  // object and then use that to identify the correct line
  const searchKey = Math.random().toString();
  obj = JSON.parse(JSON.stringify(obj));

  setValueAtJsonLdPath(obj, path, searchKey);
  const jsonLines = JSON.stringify(obj, null, 2).split('\n');
  const lineIndex = jsonLines.findIndex(line => line.includes(searchKey));

  return lineIndex === -1 ? null : lineIndex + 1;
}

function setValueAtJsonLdPath(obj, path, value) {
  const pathParts = path.split('/').filter(p => !!p);
  let currentObj = obj;
  pathParts.forEach((pathPart, i) => {
    const isLastPart = pathParts.length - 1 === i;

    if (pathPart === '0' && !Array.isArray(currentObj)) {
      // jsonld expansion turns single values into arrays
      return;
    }

    let keyFound = false;
    for (const key of Object.keys(currentObj)) {
      // The actual key in JSON might be an absolute IRI like "http://schema.org/author"
      // but key provided by validator is "author"
      const keyParts = key.split('/');
      const relativeKey = keyParts[keyParts.length - 1];
      if (relativeKey === pathPart && currentObj[key] !== undefined) {
        // If we've arrived at the end of the provided path set the value, otherwise
        // continue iterating with the object at the key location
        if (isLastPart) {
          currentObj[key] = value;
        } else {
          currentObj = currentObj[key];
        }
        keyFound = true;
        return;
      }
    }

    if (!keyFound) {
      // Couldn't find the key we got from validation in the original object
      throw Error('Key not found: ' + pathPart);
    }
  });
}
