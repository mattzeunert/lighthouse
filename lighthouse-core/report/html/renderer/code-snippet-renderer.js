/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */


// todo: consider using templates instead of constructing manually


class CodeSnippetRenderer {
  static renderHeader(dom, templateContext, details, collapse, updateFn) {
    const {lineCount, title} = details;
    const showAll = lineCount <= 4;
    const header = dom.createElement('div', 'lh-code-snippet__header');
    if (title) {
      const titleEl = dom.createElement('div');
      titleEl.innerText = title;
      titleEl.style.fontWeight = 'bold';
      header.append(titleEl);
    }

    if (!showAll) {
      const showAllButton = dom.createElement('button', 'lh-code-snippet__toggle-show-all');
      showAllButton.textContent = collapse ? 'Expand snippet' : 'Collapse snippet';
      showAllButton.addEventListener('click', () => {
        updateFn(!collapse);
      });

      header.prepend(showAllButton);
    }
    return header;
  }

  static renderLine(dom, templateContext, line, extraClasses = '') {
    // todo: destructure line first
    const codeLine = dom.createElement('div', 'lh-code-snippet__line ' + extraClasses );
    // todo: move to class
    const lineNumber = dom.createElement('div', 'lh-code-snippet__line-number');

    lineNumber.textContent = line.number + (line.truncated ? '…' : '');

    const code = dom.createElement('code');
    code.textContent = line.content;

    codeLine.appendChild(lineNumber);
    codeLine.appendChild(code);

    return codeLine;
  }

  static renderHighlightLine(dom, templateContext, highlight) {
    return CodeSnippetRenderer.renderLine(dom, templateContext, {
      number: ' ',
      content: highlight.message,
    }, 'lh-code-snippet__line--highlighted lh-code-snippet__line--highlight-message');
  }

  static renderSnippet(dom, templateContext, details, collapse) {
    const snippet = dom.createElement('div', 'lh-code-snippet__snippet');
    let {lines, highlights, lineCount} = details;

    const nonLineSpecificHighlights = highlights.filter(h => typeof h.lineNumber !== 'number');

    const linesToShowBefore = 2;
    const linesToShowAfter = 2;
    const totalSurroundingLinesToShow = linesToShowBefore + linesToShowAfter;

    lines = collapse ? lines.filter(l => shouldShowInCollapsedView(l.number)) : lines;

    for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
      const lineNumber = lineIndex + 1;
      // todo: extract find into function getLine()
      const l = lines.find(l => l.number === lineNumber);
      const previousLine = lines.find(l => l.number === lineNumber - 1);
      const nextLine = lines.find(l => l.number === lineNumber + 1);
      if (!l) {
        if ((previousLine || nextLine)) {
          const messageLine = CodeSnippetRenderer.renderLine(dom, templateContext, {
            number: '…',
            content: '',
          });
          snippet.append(messageLine);
        }
        continue;
      }

      // const lineNumber = this._dom.createElement('div');
      // lineNumber.textContent = lineIndex + 1;
      // lineNumbers.appendChild(lineNumber);
      // UI: can we make the show more button prettier? just click anywhere to show all?
      // UI: no titles for code snippet looks a bit weird

      const codeLine = CodeSnippetRenderer.renderLine(dom, templateContext, l);
      snippet.append(codeLine);
      // todo: remove unused classes from css file

      if (lineIndex === 0) {
        nonLineSpecificHighlights.forEach(highlight => {
          snippet.append(CodeSnippetRenderer.renderHighlightLine(dom, templateContext, highlight));
        });
      }


      const lineHighlights = getLineHighlights(lineNumber);
      if (lineHighlights.length > 0) {
        lineHighlights.forEach(highlight => {
          snippet.append(CodeSnippetRenderer.renderHighlightLine(dom, templateContext, highlight));
        });
        codeLine.classList.add('lh-code-snippet__line--highlighted');
      }
    }

    return snippet;

    function getLineHighlights(lineNumber) {
      return highlights.filter(h => h.lineNumber === lineNumber);
    }
    function shouldShowInCollapsedView(lineNumber) {
      if (highlights.length === 0) {
        return lineNumber <= 4;
      }
      if (lineNumber <= totalSurroundingLinesToShow && nonLineSpecificHighlights.length > 0) {
        return true;
      }
      for (let i = lineNumber - linesToShowAfter; i <= lineNumber + linesToShowBefore; i++) {
        if (getLineHighlights(i).length > 0) {
          return true;
        }
      }
      return false;
    }
  }

  /**
     * @param {DOM} dom
     * @param {ParentNode} templateContext
     * @param {CRCDetailsJSON} details
     * @return {Element}
     */
  static _render(dom, templateContext, details, collapse, updateFn) {
    const codeLines = dom.createElement('div', 'lh-code-snippet');
    codeLines.appendChild(CodeSnippetRenderer.renderHeader(dom, templateContext, details, collapse, updateFn));
    codeLines.appendChild(CodeSnippetRenderer.renderSnippet(dom, templateContext, details, collapse));

    // todo: review existing css and make new stuff more in lines with it

    return codeLines;
  }

  /**
     * @param {DOM} dom
     * @param {ParentNode} templateContext
     * @param {CRCDetailsJSON} details
     * @return {Element}
     */
  static render(dom, templateContext, details) {
    // todo: probably write a test for this
    // todo: better upate solution
    const el = dom.createElement('div');
    function update(collapse) {
      el.innerHTML = '';
      el.appendChild(
        CodeSnippetRenderer._render(dom, templateContext, details, collapse, update));
    }
    update(true);

    return el;
  }
}

// Allow Node require()'ing.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CodeSnippetRenderer;
} else {
  self.CodeSnippetRenderer = CodeSnippetRenderer;
}
