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
      id: 'structured-data-automatic',
      title: 'Structured data is valid',
      failureTitle: 'Invalid structured data',
      description:
        'Structured data contains rich metadata about a web page. ' +
        'The data is used in search results and social sharing. ' +
        'Invalid metadata will affect how the page appears in these contexts. ' +
        'This audit is currently doing basic JSON-LD validation.',
      requiredArtifacts: ['JsonLD'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts) {
    if (artifacts.JsonLD.length === 0) {
      return {
        notApplicable: true,
        rawValue: true,
      };
    }

    /** @type {Array<Object<string, LH.Audit.DetailsItem>>} */
    const tableData = [];


    await Promise.all(
      artifacts.JsonLD.map(async (jsonLD, idx) => {
        const code = jsonLD.trim();
        const snippet = code.length > 100 ? code.substr(0, 100) + '…' : code;
        const errors = await validateJsonLD(jsonLD);

        const errorsByCode = {};

        errors.forEach(({message, path, line, validator, code2}) => {
          code2 = code2 || code;
          if (!errorsByCode[code2]) {
            errorsByCode[code2] = [];
          }
          errorsByCode[code2].push({message, path, line, validator, code2});
        });

        let topLevelType;
        try {
          topLevelType = JSON.parse(code)['@type'];
        } catch (err) {
        }
        topLevelType = topLevelType || 'Unknown';


        // todo: sort out errors by code... check if it's needed, can there be errors for same snippet but different code value?
        Object.keys(errorsByCode).forEach(code => {
          const errors = errorsByCode[code];
          const node = /** @type {LH.Audit.DetailsRendererNodeDetailsJSON} */ ({
            type: 'code-lines',
            // selector: `script[type="application/ld+json" i]:nth-of-type(${idx +
            //   1})`,
            // snippet,
            code,
            // todo: how does i18n work?
            title: `${topLevelType} (${errors.length} Error${errors.length !== 1 ? 's' : ''})`,
            description: errors.filter(e => !e.line).map(e => e.message).join(''),
            // todo: support mutlile failures!!
            highlights: errors.filter(e => e.line).map(({
              message, path, line, validator, code2,
            }) => {
              return {
                line: line,
                message: message, // + ' path: ' + path + ' line: ' + line + ' validator: ' + validator,
              };
            }),
          });

          console.log(node);

          tableData.push({
            node,
            messages: 'messsssssage',
            path: 'pathhhhh',
          });
        });

        if (errors.length === 0) {
          const node = /** @type {LH.Audit.DetailsRendererNodeDetailsJSON} */ ({
            type: 'code-lines',
            // selector: `script[type="application/ld+json" i]:nth-of-type(${idx +
            //   1})`,
            // snippet,
            code,
            // todo: how does i18n work?
            title: `${topLevelType} (${errors.length} Error${errors.length !== 1 ? 's' : ''})`,
            // todo: support mutlile failures!!
            highlights: [],
          });

          tableData.push({
            node,
            messages: 'messsssssage',
            path: 'pathhhhh',
          });
        }
      })
    );

    const headings = [
      {key: 'node', itemType: 'code-lines', text: 'JSON-LD'},
      // {key: 'path', itemType: 'text', text: 'Line/Path'},
      // {key: 'message', itemType: 'text', text: 'Error'},
    ];

    const details = Audit.makeTableDetails(headings, tableData);

    return {
      rawValue: tableData.length === 0,
      details,
    };
  }
}

module.exports = StructuredDataAutomatic;
