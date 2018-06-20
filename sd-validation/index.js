/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const parseJSON = require('./json');
const validateJsonLD = require('./jsonld');
const promiseExpand = require('./expand');
const validateSchemaOrg = require('./schema');

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
      path: parseOutput.error.line,
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
      });
    });

    return errors;
  }

  return errors;
};
