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
        'This audit is currently doing basic JSON-LD validation. ' +
        'See also the manual audit below to validate other types of structured data.',
      requiredArtifacts: ['JsonLD'],
    };
  }


  // todo: handle top level name being too long

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

    let snippetsWithErrorsCount = 0;

    await Promise.all(
      artifacts.JsonLD.map(async (jsonLD, idx) => {
        // We don't want to show empty lines around the snippet
        jsonLD = jsonLD.trim();
        const snippet = jsonLD.length > 100 ? jsonLD.substr(0, 100) + '…' : jsonLD;
        const errors = await validateJsonLD(jsonLD);

        if (errors.length > 0) {
          snippetsWithErrorsCount++;
        }


        const errorsByCode = {};
        // console.log(errors);

        errors.forEach((e) => {
          let {message, path, line, validator, code2} = e;
          code2 = code2 || jsonLD;
          if (!errorsByCode[code2]) {
            errorsByCode[code2] = [];
          }
          errorsByCode[code2].push(e);
        });

        let topLevelType;
        let topLevelName;
        try {
          topLevelType = JSON.parse(jsonLD)['@type'];
          topLevelName = JSON.parse(jsonLD)['name'];
        } catch (err) {
        }

        let title = '';
        if (topLevelName && topLevelType) {
          title = `${topLevelType}: ${topLevelName}`;
        } else if (topLevelType) {
          title = `@type ${topLevelType}`;
        } else {
          title = 'Invalid JSON-LD element';
        }

        title += ` (${errors.length} Error${errors.length !== 1 ? 's' : ''})`;
        // todo: sort out errors by code... check if it's needed, can there be errors for same snippet but different code value?


        Object.keys(errorsByCode).forEach(code => {
          const errors = errorsByCode[code];
          const highlights = errors.map(({
            message, line, types,
          }) => {
            return {
              lineNumber: line,
              message: message + (types || []).map(t => ` [${t}](${t})`), // + ' path: ' + path + ' line: ' + line + ' validator: ' + validator,
            };
          });
          const node = Audit.makeCodeSnippetDetails({
            // selector: `script[type="application/ld+json" i]:nth-of-type(${idx +
            //   1})`,
            // snippet,
            code,
            // todo: how does i18n work?
            title,
            highlights,
          });

          // console.log(node);

          tableData.push(
            node);
        });

        if (errors.length === 0) {
          const node = Audit.makeCodeSnippetDetails({
            code: JSON.stringify(JSON.parse(jsonLD), null, 2),
            // todo: how does i18n work?
            title,
            highlights: [],
          });

          tableData.push(node);
        }
      })
    );

    // const headings = [
    //   {key: 'node', itemType: 'code-snippet', text: 'JSON-LD'},
    //   // {key: 'path', itemType: 'text', text: 'Line/Path'},
    //   // {key: 'message', itemType: 'text', text: 'Error'},
    // ];

    const details = Audit.makeListDetails(tableData);


    return {
      rawValue: snippetsWithErrorsCount === 0,
      details,
      displayValue: snippetsWithErrorsCount + '/' + artifacts.JsonLD.length + ' snippets with errors found',
    };
  }
}

module.exports = StructuredDataAutomatic;
