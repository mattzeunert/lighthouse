/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Gatherer = require('../gatherer');
const {getElementsInDocumentString, getNodePathString} = require('../../../lib/page-functions');

class JsonLD extends Gatherer {
  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @return {Promise<LH.Artifacts['JsonLD']>}
   */
  afterPass(passContext) {
    const expression = `(function() {
      ${getElementsInDocumentString}; // define function on page
      ${getNodePathString};
      const selector = 'script[type="application/ld+json" i]';
      const elements = getElementsInDocument(selector);
      return elements.map(node => ({
        text: node.innerText,
        path: getNodePath(node)
      }));
    })()`;

    return passContext.driver.evaluateAsync(expression);
  }
}

module.exports = JsonLD;

