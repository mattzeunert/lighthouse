/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

// todo: consider using templates instead of constructing manually


class CodeSnippetRenderer {
  static renderHeader(dom, templateContext, details, isExpanded, updateFn) {
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
      showAllButton.textContent = isExpanded ? 'Collapse snippet' : 'Expand snippet';
      showAllButton.addEventListener('click', () => {
        updateFn(!isExpanded);
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

    lineNumber.textContent = line.number;

    const code = dom.createElement('code');
    code.textContent = line.content + (line.truncated ? '…' : '');

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

  static renderOmittedLinesIndicator(dom, templateContext) {
    return CodeSnippetRenderer.renderLine(dom, templateContext, {
      number: '…',
      content: '',
    });
  }

  static renderSnippet(dom, templateContext, details, isExpanded) {
    let {lines, highlights, lineCount} = details;
    if (!isExpanded) {
      lines = Util.filterRelevantLines(lines, highlights, 2);
    }
    const firstLineIsVisible = lines[0].number === 1;
    const lastLineIsVisible = lines.slice(-1)[0].number === lineCount;

    const nonLineSpecificHighlights = highlights.filter(h => typeof h.lineNumber !== 'number');

    const snippet = dom.createElement('div', 'lh-code-snippet__snippet');

    if (!firstLineIsVisible && isExpanded) {
      snippet.append(CodeSnippetRenderer.renderOmittedLinesIndicator(dom, templateContext));
    }

    let hasSeenHighlight = false;
    for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
      const line = getLine(lineNumber);
      const previousLine = getLine(lineNumber - 1);
      const nextLine = getLine(lineNumber + 1);

      if ((line && !previousLine && hasSeenHighlight)) {
        snippet.append(CodeSnippetRenderer.renderOmittedLinesIndicator(dom, templateContext));
      }

      if (!line) {
        // if ((previousLine || (nextLine && !hasRenderedLine))) {
        //   const messageLine = CodeSnippetRenderer.renderLine(dom, templateContext, {
        //     number: '…',
        //     content: '',
        //   });
        //   snippet.append(messageLine);
        // }
        continue;
      }


      const codeLine = CodeSnippetRenderer.renderLine(dom, templateContext, line);
      snippet.append(codeLine);
      // todo: remove unused classes from css file


      if (lineNumber === 1) {
        nonLineSpecificHighlights.forEach(highlight => {
          snippet.append(CodeSnippetRenderer.renderHighlightLine(dom, templateContext, highlight));
        });
      }

      const lineHighlights = Util.getLineHighlights(highlights, lineNumber);
      if (lineHighlights.length > 0) {
        lineHighlights.forEach(highlight => {
          snippet.append(CodeSnippetRenderer.renderHighlightLine(dom, templateContext, highlight));
          hasSeenHighlight = true;
        });
        codeLine.classList.add('lh-code-snippet__line--highlighted');
      }
    }

    if (!lastLineIsVisible && isExpanded) {
      snippet.append(CodeSnippetRenderer.renderOmittedLinesIndicator(dom, templateContext));
    }

    return snippet;

    function getLine(lineNumber) {
      return lines.find(l => l.number === lineNumber);
    }
  }

  /**
     * @param {DOM} dom
     * @param {ParentNode} templateContext
     * @param {CRCDetailsJSON} details
     * @return {Element}
     */
  static _render(dom, templateContext, details, isExpanded, updateFn) {
    const codeLines = dom.createElement('div', 'lh-code-snippet');
    codeLines.appendChild(CodeSnippetRenderer.renderHeader(dom, templateContext, details, isExpanded, updateFn));
    codeLines.appendChild(CodeSnippetRenderer.renderSnippet(dom, templateContext, details, isExpanded));

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
    function update(isExpanded) {
      el.innerHTML = '';
      el.appendChild(
        CodeSnippetRenderer._render(dom, templateContext, details, isExpanded, update));
    }
    update(false);

    return el;
  }
}

// Allow Node require()'ing.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CodeSnippetRenderer;
} else {
  self.CodeSnippetRenderer = CodeSnippetRenderer;
}
