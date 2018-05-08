'use strict';

const parseJSON = require('./json');
const validateJsonLD = require('./jsonld');
const promiseExpand = require('./expand');
const validateSchemaOrg = require('./schema');

/**
 * @param {string} textInput
 * @returns {Promise<Array<{path: ?string, validator: string, message: string}>>}
 */
module.exports = async function validate(textInput) {
  /** @type Array<{path: ?string, validator: string, message: string}> */
  const errors = [];

  // / VALIDATE JSON
  let inputObject;

  try {
    inputObject = parseJSON(textInput);
  } catch (error) {
    errors.push({
      validator: 'json',
      path: null,
      message: error.message.toString(),
    });

    return errors;
  }

  // VALIDATE JSONLD
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

  // EXPAND
  let expandedObj = null;
  try {
    expandedObj = await promiseExpand(inputObject);
  } catch (error) {
    errors.push({
      validator: 'json-ld',
      path: null,
      message: error.message.toString(),
    });

    return errors;
  }

  // VALIDATE SCHEMA
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
