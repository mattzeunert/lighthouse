'use strict';

const {URL} = require('url');
const jsonld = require('jsonld');
const schemaOrgContext = require('./assets/jsonldcontext');
const SCHEMA_ORG_HOST = 'schema.org';

module.exports = function expand(inputObject) {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res; reject = rej;
  });

  jsonld.expand(inputObject, {
    documentLoader: (url, callback) => {
      let urlObj = null;

      try {
        urlObj = new URL(url, 'http://example.com');
      } catch (e) {
        reject('Error parsing URL: ' + url);
      }

      if (urlObj && urlObj.host === SCHEMA_ORG_HOST && urlObj.pathname === '/') {
        callback(null, {
          document: schemaOrgContext,
        });
      } else {
        // Unknown schema
        callback(null, {
          document: {},
        });
      }
    },
  }, (e, expanded) => {
    if (e) {
      reject('Expansion error: ' + e);
    } else {
      resolve(expanded);
    }
  });

  return promise;
};
