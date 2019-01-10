/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */


// todo: consider using templates instead of constructing manually


class CodeSnippetRenderer {
  /**
     * @param {DOM} dom
     * @param {ParentNode} templateContext
     * @param {CRCDetailsJSON} details
     * @return {Element}
     */
  static render(dom, templateContext, details) {
    let {lines, title, highlights, lineCount} = details;

    const nonLineSpecificHighlights = highlights.filter(h => typeof h.lineNumber !== 'number');

    const linesToShowBefore = 2;
    const linesToShowAfter = 2;
    const totalSurroundingLinesToShow = linesToShowBefore + linesToShowAfter;
    // const pre = this._dom.createElement('pre', 'lh-code-snippet');

    const allAvailableLines = lines.slice();
    lines = getLinesForCollapsedView();

    function getLinesForCollapsedView() {
      return allAvailableLines.filter(l => shouldShowInCollapsedView(l.number));
    }
    // todo: probably write a test for this

    // todo: move to class

    const codeLines = dom.createElement('div', 'lh-code-snippet');
    const header = dom.createElement('div', 'lh-code-snippet__header');
    codeLines.appendChild(header);
    if (title) {
      const titleEl = dom.createElement('div');
      titleEl.innerText = title;
      titleEl.style.fontWeight = 'bold';
      header.append(titleEl);
    }
    // const lineNumbers = this._dom.createElement('div');


    const showAll = lines.length <= 4;

    const snippet = dom.createElement('div', 'lh-code-snippet__snippet');
    codeLines.append(snippet);


    function getLineHighlights(lineNumber) {
      return highlights.filter(h => h.lineNumber === lineNumber);
    }
    function hasNearbyHighlight(lineNumber) {
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
    function shouldShowInCollapsedView(lineNumber) {
      if (highlights.length === 0) {
        return lineNumber <= 4;
      }
      return hasNearbyHighlight(lineNumber);
    }

    // todo: instead create line list first and then map to elements and then filter
    let hasSeenLineWithHighlight = false;
    for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
      const lineNumber = lineIndex + 1;
      // todo: extract find into function getLine()
      const l = lines.find(l => l.number === lineNumber);
      const previousLine = lines.find(l => l.number === lineNumber - 1);
      const nextLine = lines.find(l => l.number === lineNumber + 1);
      if (!l) {
        if ((previousLine || nextLine)) {
          const messageLine = renderLine({
            number: '…',
            content: '',
            extraClasses: '',
          });
          snippet.append(messageLine);
        }
        continue;
      }
      const {content: line, number, truncated} = l;

      // const lineNumber = this._dom.createElement('div');
      // lineNumber.textContent = lineIndex + 1;
      // lineNumbers.appendChild(lineNumber);


      // UI: can we make the show more button prettier? just click anywhere to show all?
      // UI: no titles for code snippet looks a bit weird


      const codeLine = renderLine({number: lineNumber, content: line + (truncated ? '…' : '')});


      const showByDefault = showAll || hasNearbyHighlight(lineNumber) || (highlights.length === 0 && lineNumber < 5);


      codeLine.classList.add('lh-code-snippet__line');
      if (!showByDefault) {
        codeLine.classList.add('lh-code-snippet__line--hide-by-default');
      }

      if (lineIndex === 0 && nonLineSpecificHighlights.length > 0) {
        addLineHighlights(nonLineSpecificHighlights);
      }

      // todo: review existing css and make new stuff more in lines with it
      snippet.append(codeLine);

      const lineHighlights = getLineHighlights(lineNumber);

      if (lineHighlights.length > 0) {
        addLineHighlights(lineHighlights);
        codeLine.classList.add('lh-code-snippet__line--highlighted');
      }

      function addLineHighlights(lineHighlights) {
        hasSeenLineWithHighlight = true;

        lineHighlights.forEach(lineHighlight => {
          const messageLine = renderLine({
            number: ' ',
            content: lineHighlight.message,
            extraClasses: 'lh-code-snippet__line--highlight-message',
          });
          messageLine.classList.add('lh-code-snippet__line--highlighted');
          snippet.append(messageLine );
        });
      }

      // todo: check out what _dom is... does it support classname/style?


      function renderLine({number, content, extraClasses = ''}) {
        const codeLine = dom.createElement('div', 'lh-code-snippet__line ' + extraClasses );
        // todo: move to class
        const lineNumber = dom.createElement('div', 'lh-code-snippet__line-number');

        lineNumber.textContent = number;

        const code = dom.createElement('code');
        code.textContent = content;

        codeLine.appendChild(lineNumber);
        codeLine.appendChild(code);

        return codeLine;
      }
    }

    if (!showAll) {
      const showAllButton = dom.createElement('button', 'lh-code-snippet__toggle-show-all');
      showAllButton.textContent = 'Expand snippet';
      showAllButton.addEventListener('click', () => {
        const showAllClass = 'lh-code-snippet--show-all';
        if (codeLines.classList.contains(showAllClass)) {
          showAllButton.textContent = 'Expand snippet';
          codeLines.classList.remove(showAllClass);
        } else {
          showAllButton.textContent = 'Collapse snippet';
          codeLines.classList.add(showAllClass);
        }
      });
      header.prepend(showAllButton);
    }

    // container.appendChild(lineNumbers);

    return codeLines;
  }
}

// Allow Node require()'ing.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CodeSnippetRenderer;
} else {
  self.CodeSnippetRenderer = CodeSnippetRenderer;
}
