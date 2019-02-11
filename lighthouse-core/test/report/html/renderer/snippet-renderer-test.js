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
const SnippetRenderer = require('../../../../report/html/renderer/snippet-renderer.js');

const TEMPLATE_FILE = fs.readFileSync(
  __dirname + '/../../../../report/html/templates.html',
  'utf8'
);

function makeDetails(lineMessages, generalMessages = [], lineRanges = [{from: 1, to: 6}]) {
  const lines = [];
  lineRanges.forEach(({from, to}) => {
    for (let i = from; i <= to; i++) {
      lines.push({
        lineNumber: i,
        content: 'L' + i,
      });
    }
  });


  return {
    type: 'snippet',
    lines,
    lineMessages,
    generalMessages,
    lineCount: 100,
  };
}

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

  function renderSnippet(lineMessages, generalMessages, lineRanges = undefined) {
    const details = makeDetails(lineMessages, generalMessages, lineRanges);
    const el = SnippetRenderer.render(dom, dom.document(), details, {});

    return {
      contentLines: el.querySelectorAll('.lh-snippet__line--content'),
      collapsedContentLines: el.querySelectorAll(
        '.lh-snippet__line--content.lh-snippet__show-if-expanded'
      ),
      uncollapsedContentLines: el.querySelectorAll(
        '.lh-snippet__line--content:not(.lh-snippet__show-if-expanded)'
      ),
      messageLines: el.querySelectorAll('.lh-snippet__line--message'),
      omittedLinesIndicatorsWhenExpanded: el.querySelectorAll(
        '.lh-snippet__line--placeholder:not(.lh-snippet__show-if-collapsed)'
      ),
      omittedLinesIndicatorsWhenCollapsed: el.querySelectorAll(
        '.lh-snippet__line--placeholder:not(.lh-snippet__show-if-expanded)'
      ),
    };
  }

  it('Renders snippet with message at the very top', () => {
    const {contentLines, messageLines, collapsedContentLines} = renderSnippet([
      {
        lineNumber: 1,
        message: 'Error',
      },
    ]);

    // 5 lines are visible, 1 is collapsed
    assert.equal(collapsedContentLines.length, 1);
    // All available lines are shown on expansion
    assert.equal(contentLines.length, 6);
    // 100 lines in total, so lines towards the end won't be shown
    const lastLine = contentLines[contentLines.length - 1];
    assert.equal(lastLine.nextSibling.textContent.trim(), '…');

    // Shows message for second line
    assert.equal(messageLines[0].textContent.trim(), 'Error');
    assert.equal(messageLines[0].previousSibling.textContent.replace(/\s/g, ''), '1L1');
  });

  it('Renders first few lines if there are no messages', () => {
    const {
      uncollapsedContentLines,
      omittedLinesIndicatorsWhenExpanded,
      omittedLinesIndicatorsWhenCollapsed,
    } = renderSnippet([]);
    const lastUncollapsedLine = uncollapsedContentLines[uncollapsedContentLines.length - 1];

    // Shows first 5 visible lines
    assert.equal(lastUncollapsedLine.textContent.replace(/\s/g, ''), '5L5');
    // "..." after the available lines, but only shows in expanded state
    assert.equal(omittedLinesIndicatorsWhenExpanded.length, 1);
    assert.equal(omittedLinesIndicatorsWhenCollapsed.length, 0);
  });

  it('Renders first few lines if there are no messages for specific lines', () => {
    const {uncollapsedContentLines} = renderSnippet([
      {
        lineNumber: null,
        message: 'General error',
      },
    ]);
    const lastUncollapsedLine = uncollapsedContentLines[uncollapsedContentLines.length - 1];

    // Shows first 5 visible lines
    assert.equal(lastUncollapsedLine.textContent.replace(/\s/g, ''), '5L5');
  });

  it('Renders snippet with multiple messages surrounded by other lines', () => {
    const {
      collapsedContentLines,
      omittedLinesIndicatorsWhenCollapsed,
      omittedLinesIndicatorsWhenExpanded,
    } = renderSnippet(
      [
        {
          lineNumber: 40,
          message: 'Error 1',
        },
        {
          lineNumber: 70,
          message: 'Error 2',
        },
      ],
      [],
      [
        {
          from: 30,
          to: 50,
        },
        {
          from: 60,
          to: 80,
        },
      ]
    );

    // first available line is collapsed
    assert.equal(collapsedContentLines[0].textContent.replace(/\s/g, ''), '30L30');

    // puts omitted lines placeholder between the two messages
    assert.equal(omittedLinesIndicatorsWhenCollapsed.length, 1);
    // puts omitted lines placeholder between the two messages and around the whole snippet
    assert.equal(omittedLinesIndicatorsWhenExpanded.length, 3);
  });

  it('Can render both line-specific and non line-specific messages in one snippet', () => {
    const {messageLines} = renderSnippet(
      [
        {
          lineNumber: 5,
          message: 'Error on line',
        },
      ],
      [
        {
          message: 'General error',
        },
      ]
    );

    assert.equal(messageLines.length, 2);
  });
});
