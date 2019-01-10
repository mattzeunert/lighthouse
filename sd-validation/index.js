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
  // eval('debugger');
  if (parseOutput.error) {
    errors.push({
      validator: 'json',
      line: parseFloat(parseOutput.error.line),
      message: parseOutput.error.message,
    });

    return errors;
  }

  const inputObject = parseOutput.result;

  // todo: make sure all three steps provide a line or are otherwise handled

  // todo: test show result for multiple errors in one snippet

  // STEP 2: VALIDATE JSONLD
  const jsonLdErrors = validateJsonLD(inputObject);

  if (jsonLdErrors && jsonLdErrors.length) {
    jsonLdErrors.forEach(error => {
      errors.push({
        validator: 'json-ld',
        path: error.path,
        line: getLineFromJsonPath(inputObject, error.path),
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
  // console.log(expandedObj);


  const compactedObj = await require('jsonld').compact(expandedObj, 'http://schema.org');


  if (schemaOrgErrors && schemaOrgErrors.length) {
    schemaOrgErrors.forEach(error => {
      errors.push({
        validator: 'schema-org',
        path: error.path,
        // stringify again here because stringified has different property order from input
        code2: JSON.stringify(inputObject, null, 4) + '(sdfakslfjld custom json from schem org validtor)',
        // todo: figure out if we can do this operation with inputobj instead of exp obj
        line: getLineFromJsonPath(inputObject, error.path),
        message: error.message,
      });
    });

    return errors;
  }

  return errors;
};

// todo: move this function maybe
function getLineFromJsonPath(obj, path) {
  try {
    console.log(obj);
    console.log({path});
    obj = JSON.parse(JSON.stringify(obj));
    const searchKey = Math.random().toString();
    // eval('debugger');
    const pathParts = path.split('/');
    let currentObj = obj;
    pathParts.forEach((pathComponent, i) => {
      if (!pathComponent.length) {
        return;
      }
      const isLast = pathParts.length - 1 === i;
      if (pathComponent === '0' && ! Array.isArray(currentObj)) {
      // jsonld expansion makes every value an array
        if (isLast) {
          currentObj.whatever = searchKey; // todo: should not be last, we should have the final path part
        }
        return;
      }


      if (isLast) {
        currentObj[pathComponent] = searchKey;
      } else {
        currentObj = currentObj[pathComponent];
      }
    });

    const jsonLines = JSON.stringify(obj, null, 4).split('\n');
    const lineIndex = jsonLines.findIndex(line => line.includes(searchKey));


    return lineIndex > -1 ? lineIndex + 1 : 1;
  } catch (err) {
    return 1;
  }
}
