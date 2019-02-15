/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env mocha */

const assert = require('assert');
const validateJSONLD = require('../');

describe('schema.org validation', () => {
  it('reports unknown types', async () => {
    const errors = await validateJSONLD(`{
      "@context": "http://schema.org",
      "@type": "Cat"
    }`);

    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, 'Unrecognized schema.org type http://schema.org/Cat');
  });

  it('reports unknown types for objects with multiple types', async () => {
    const errors = await validateJSONLD(`{
      "@context": "http://schema.org",
      "@type": ["Article", "Dog"]
    }`);

    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, 'Unrecognized schema.org type http://schema.org/Dog');
    assert.equal(errors[0].line, 3);
  });

  it('reports unexpected fields', async () => {
    const errors = await validateJSONLD(`{
      "@context": "https://schema.org",
      "@type": "Article",
      "author": "Cat",
      "datePublished": "Oct 29th 2017",
      "dateModified": "Oct 29th 2017",
      "headline": "Human's New Best Friend - Cat",
      "image": "https://cats.rock/cat.bmp",
      "publisher": "Cat Magazine",
      "mainEntityOfPage": "https://cats.rock/magazine.html",
      "controversial": true
    }`);

    assert.equal(errors.length, 1);
    assert.equal(errors[0].types[0], 'http://schema.org/Article');
    assert.equal(errors[0].message, 'Unexpected property "controversial"');
    assert.equal(errors[0].line, 11);
  });

  it('passes if non-schema.org context', async () => {
    const errors = await validateJSONLD(`{
      "@context": "http://www.w3.org/ns/activitystreams",
      "@type": "Create",
      "actor": {
        "@type": "Person",
        "@id": "acct:sally@example.org",
        "displayName": "Sally"
      },
      "object": {
        "@type": "Note",
        "content": "This is a simple note"
      },
      "published": "2015-01-25T12:34:56Z"
    }`);

    assert.equal(errors.length, 0);
  });

  it('passes if everything is OK', async () => {
    const errors = await validateJSONLD(`{
      "@context": "http://schema.org",
      "@type": "Article",
      "author": "Cat",
      "datePublished": "Oct 29th 2017",
      "dateModified": "Oct 29th 2017",
      "headline": "Human's New Best Friend - Cat",
      "image": "https://cats.rock/cat.bmp",
      "publisher": "Cat Magazine",
      "mainEntityOfPage": "https://cats.rock/magazine.html"
    }`);

    assert.equal(errors.length, 0);
  });

  it('passes if valid json-ld uses absolute IRIs as keys', async () => {
    const errors = await validateJSONLD(`{
      "@type": "http://schema.org/Article",
      "http://schema.org/author": {
        "@type": "Person",
        "http://schema.org/name": "Cat"
      },
      "http://schema.org/datePublished": "Oct 29th 2017",
      "http://schema.org/dateModified": "Oct 29th 2017"
    }`);

    assert.equal(errors.length, 0);
  });

  it('fails if invalid json-ld uses absolute IRIs as keys', async () => {
    const errors = await validateJSONLD(`{
      "@type": "http://schema.org/Article",
      "http://schema.org/author": {
        "@type": "http://schema.org/Person",
        "http://schema.org/invalidProperty": "",
        "http://schema.org/name": "Cat"
      },
      "http://schema.org/datePublished": "Oct 29th 2017",
      "http://schema.org/dateModified": "Oct 29th 2017"
    }`);

    assert.equal(errors.length, 1);
    assert.equal(errors[0].line, 5);
  });
});
