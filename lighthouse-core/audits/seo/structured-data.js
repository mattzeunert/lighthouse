/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../audit');
const validateJsonLD = require('../../../sd-validation/');

class StructuredDataAutomatic extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      name: 'structured-data-automatic',
      description: 'Structured data is valid',
      failureDescription: 'Invalid structured data',
      helpText: 'Structured data contains rich metadata about a web page. ' +
        'The data is used in search results and social sharing. ' +
        'Invalid metadata will affect how the page appears in these contexts. ' +
        '[Learn more]().',
      requiredArtifacts: ['JsonLD'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static async audit(artifacts) {
    if (artifacts.JsonLD.length === 0) {
      return {
        notApplicable: true,
        rawValue: true,
      };
    }

    /** @type {Array<{idx: number, message: string, path: string|null}>} */
    const tableData = [];

    await Promise.all(
      artifacts.JsonLD.map(async (jsonLD, idx) => {
        const errors = await validateJsonLD(jsonLD);

        errors.forEach(({message, path}) => {
          tableData.push({
            idx,
            message,
            path,
          });
        });
      })
    );

    const headings = [
      {key: 'idx', itemType: 'text', text: 'Index'},
      {key: 'path', itemType: 'text', text: 'Path'},
      {key: 'message', itemType: 'code', text: 'Error'},
    ];

    const details = Audit.makeTableDetails(headings, tableData);

    return {
      rawValue: tableData.length === 0,
      details,
    };
  }
}

module.exports = StructuredDataAutomatic;
