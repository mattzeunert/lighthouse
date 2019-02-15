/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env mocha */

const assert = require('assert');
const validateJSONLD = require('../');

describe('JSON validation', () => {
  it('reports missing closing bracket', async () => {
    const errors = await validateJSONLD(`{
      "test": "test"
    `);

    assert.equal(errors.length, 1);
    assert.equal(errors[0].line, 2);
    assert.ok(errors[0].message.indexOf(`Expecting '}'`) === 0);
  });

  it('reports missing comma', async () => {
    const errors = await validateJSONLD(`{
      "test": "test"
      "test2": "test2"
    }`);

    assert.equal(errors.length, 1);
    assert.equal(errors[0].line, 2);
    assert.ok(errors[0].message.indexOf(`Expecting 'EOF', '}', ':', ',', ']'`) === 0);
  });

  it('reports duplicated property', async () => {
    const errors = await validateJSONLD(`{
      "test": "test",
      "test2": {
        "test2-1": "test",
        "test2-1": "test2"
      }
    }`);

    assert.equal(errors.length, 1);
    assert.ok(errors[0].message, `Duplicate key 'test2-1'`);
  });

  it('parses valid json', async () => {
    const errors = await validateJSONLD(`{
      "test": "test",
      "test2": {
        "test2-1": "test",
        "test2-2": "test2"
      },
      "test3": null,
"test4": 123,
      "test5": [1,2,3]
    }`);

    assert.equal(errors.length, 0);
  });
});
