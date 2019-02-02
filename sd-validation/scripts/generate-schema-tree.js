/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
  * Call this script to update assets/schema-tree.json with the latest schema.org spec
 */
'use strict';

const request = require('request-promise-native');
const fs = require('fs');

const SCHEMA_ORG_URL = 'https://schema.org/version/latest/schema.jsonld';
const SCHEMA_TREE_FILE = '../assets/schema-tree.json';

request(SCHEMA_ORG_URL)
  .then(text => JSON.parse(text))
  .then(processData)
  .then(result => fs.writeFileSync(SCHEMA_TREE_FILE, JSON.stringify(result, null, 2)))
  .then(() => console.log('Success.'))// eslint-disable-line no-console
  .catch(e => console.error(e));// eslint-disable-line no-console

function processData(data) {
  const types = [];
  const properties = [];

  function removePrefix(str) {
    return str.replace('http://schema.org/', '');
  }

  function getParents(parents) {
    if (Array.isArray(parents)) {
      return parents.map(item => removePrefix(item['@id']));
    } else if (parents && parents['@id']) {
      return [removePrefix(parents['@id'])];
    }

    return [];
  }

  data['@graph'].forEach(item => {
    if (item['rdfs:label'] === undefined) {
      return;
    }

    if (item['@type'] === 'rdf:Property') {
      properties.push({
        name: item['rdfs:label'],
        parent: getParents(item['http://schema.org/domainIncludes']),
      });
    } else {
      types.push({
        name: item['rdfs:label'],
        parent: getParents(item['rdfs:subClassOf']),
      });
    }
  });

  return {types, properties};
}
