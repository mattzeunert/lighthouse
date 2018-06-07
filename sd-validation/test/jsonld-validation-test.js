/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env mocha */

const assert = require('assert');
const validateJSONLD = require('../');

describe('JSON-LD validation', () => {
  it('reports unknown keywords', async () => {
    const errors = await validateJSONLD(`{
      "@type": {},
      "@context": {},
      "@test": {}
    }`);

    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, 'Unknown keyword');
    assert.equal(errors[0].path, '@test');
  });

  it('reports invalid context', async () => {
    const errors = await validateJSONLD(`{
      "@context": {"x":"x"}
    }`);

    assert.equal(errors.length, 1);
    assert.ok(errors[0].message.indexOf('@context terms must define an @id') !== -1);
  });

  it('reports invalid keyword value', async () => {
    const errors = await validateJSONLD(`{
      "@context": "http://schema.org/",
      "@type": 23
    }`);

    assert.equal(errors.length, 1);
    assert.ok(errors[0].message.indexOf('"@type" value must a string') !== -1);
  });

  it('reports invalid id value', async () => {
    const errors = await validateJSONLD(`{
      "@context": {
        "image": {
          "@id": "@error"
        }
      }
    }`);

    assert.equal(errors.length, 1);
    assert.ok(errors[0].message.indexOf('@id value must be an absolute IRI') !== -1);
  });

  it('reports invalid context URL', async () => {
    const errors = await validateJSONLD(`{
      "@context": "http://"
    }`);

    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, 'Error parsing URL: http://');
  });
});
