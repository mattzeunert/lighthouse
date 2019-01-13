/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const assert = require('assert');
const fs = require('fs');
const jsdom = require('jsdom');
const Util = require('../../../../report/html/renderer/util.js');
const DOM = require('../../../../report/html/renderer/dom.js');
const CodeSnippetRenderer =
    require('../../../../report/html/renderer/code-snippet-renderer.js');

const TEMPLATE_FILE = fs.readFileSync(__dirname +
    '/../../../../report/html/templates.html', 'utf8');

/** @type LH.Audit.DetailsRendererCodeSnippet */
const DETAILS = {
  type: 'code-snippet',
  lines: [
    {
      number: 1,
      content: 'A',
    },
    {
      number: 2,
      content: 'B',
    },
    {
      number: 3,
      content: 'C',
    },
    {
      number: 4,
      content: 'D',
    },
    {
      number: 5,
      content: 'E',
    },
    {
      number: 6,
      content: 'F',
    },
  ],
  highlights: [{
    lineNumber: 2,
    message: 'Error',
  }],
  lineCount: 100,
};

describe('DetailsRenderer', () => {
  let dom;


  beforeAll(() => {
    global.Util = Util;
    const {document} = new jsdom.JSDOM(TEMPLATE_FILE).window;
    dom = new DOM(document);
  });

  afterAll(() => {
    global.Util = undefined;
  });


  it('Renders code snippet', () => {
    const el = CodeSnippetRenderer.render(dom, dom.document(), DETAILS, {});

    const renderedLines = Array.from(el.querySelectorAll('.lh-code-snippet__line'));
    const codeLines = renderedLines.filter(l => l.classList.contains('lh-code-snippet__line--code'));
    const collapsedCodeLines = codeLines.filter(l => l.classList.contains('lh-code-snippet__show-if-expanded'));
    const highlightLines = renderedLines.filter(l => l.classList.contains('lh-code-snippet__line--highlight-message'));

    // 4 Lines are visible, 2 are collapsed
    assert.equal(collapsedCodeLines.length, 2);
    // All available lines are shown on expansion
    assert.equal(codeLines.length, DETAILS.lines.length);
    // 100 lines in total, so lines towards the end won't be shown
    const lastLine = renderedLines.slice(-1)[0];
    assert.equal(lastLine.textContent, '…');

    // Shows highlight message for second line
    assert.equal(highlightLines[0].textContent.trim(), 'Error');
    assert.equal(highlightLines[0].previousSibling.textContent, '2B');
  });
});
