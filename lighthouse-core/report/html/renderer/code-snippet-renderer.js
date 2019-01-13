/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

/* globals self, Util */

// todo: consider using templates instead of constructing manually
// todo: remove unused classes from css file
// general: use copyright 2019 for new files
// todo: probably write a test for this --- see crc test

class CodeSnippetRenderer {
  static renderHeader(dom, templateContext, details, isExpanded, updateFn) {
    const header = dom.cloneTemplate('#tmpl-lh-code-snippet__header', templateContext);

    const {lineCount, title} = details;
    const showAll = lineCount <= 4;
    dom.find('.lh-code-snippet__title', header).textContent = title;

    const toggleShowAllButton = dom.find('.lh-code-snippet__toggle-show-all', header);
    toggleShowAllButton.addEventListener('click', () => {
      updateFn();
    });
    if (showAll) {
      toggleShowAllButton.remove();
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

  /**
   * @param {DOM} dom
   * @param {DocumentFragment} templateContext
   * @param {LH.Audit.DetailsRendererCodeSnippetItem} details
   * @param {*} isExpanded
   */
  static renderSnippet(dom, templateContext, details, isExpanded) {
    const {highlights, lineCount} = details;
    let {lines} = details;
    // todo: comments in this function and try to shorten it
    // todo: comments in general
    if (!isExpanded) {
      lines = Util.filterRelevantLines(lines, highlights, 2);
    }
    const firstLineIsVisible = lines[0].number === 1;
    const lastLineIsVisible = lines.slice(-1)[0].number === lineCount;

    const nonLineSpecificHighlights = highlights.filter(h => typeof h.lineNumber !== 'number');
    const hasOnlyNonLineSpecficHighlights = nonLineSpecificHighlights.length === highlights.length;

    const snippetOuter = dom.createElement('div', 'lh-code-snippet__snippet');
    const snippet = dom.createElement('div', 'lh-code-snippet__snippet-inner');
    snippetOuter.appendChild(snippet);
    snippetOuter.classList.toggle('lh-code-snippet__show-if-expanded', isExpanded);
    snippetOuter.classList.toggle('lh-code-snippet__show-if-collapsed', !isExpanded);

    if (!firstLineIsVisible && isExpanded) {
      snippet.append(CodeSnippetRenderer.renderOmittedLinesIndicator(dom, templateContext));
    }

    let hasSeenHighlight = false;
    for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
      const line = getLine(lineNumber);
      const previousLine = getLine(lineNumber - 1);

      if (!line) {
        continue;
      }
      if (!previousLine && hasSeenHighlight) {
        snippet.append(CodeSnippetRenderer.renderOmittedLinesIndicator(dom, templateContext));
      }
      if (lineNumber === 1) {
        nonLineSpecificHighlights.forEach(highlight => {
          snippet.append(CodeSnippetRenderer.renderHighlightLine(dom, templateContext, highlight));
        });
      }
      const codeLine = CodeSnippetRenderer.renderLine(dom, templateContext, line);
      snippet.append(codeLine);


      const lineHighlights = Util.getLineHighlights(highlights, lineNumber);
      if (lineHighlights.length > 0) {
        lineHighlights.forEach(highlight => {
          snippet.append(CodeSnippetRenderer.renderHighlightLine(dom, templateContext, highlight));
          hasSeenHighlight = true;
        });
      }

      if (lineHighlights.length > 0 || hasOnlyNonLineSpecficHighlights) {
        codeLine.classList.add('lh-code-snippet__line--highlighted');
      }
    }

    if (!lastLineIsVisible && isExpanded) {
      snippet.append(CodeSnippetRenderer.renderOmittedLinesIndicator(dom, templateContext));
    }

    return snippetOuter;

    /**
     * @param {number} lineNumber
     */
    function getLine(lineNumber) {
      return lines.find(l => l.number === lineNumber);
    }
  }

  /**
     * @param {DOM} dom
     * @param {DocumentFragment} templateContext
     * @param {LH.Audit.DetailsRendererCodeSnippetItem} details
     * @return {Element}
     */
  static render(dom, templateContext, details) {
    // cant i just figure out which element needs to be hidden in what state and then toggle a class?


    const tmpl = dom.cloneTemplate('#tmpl-lh-code-snippet', templateContext);
    const containerEl = dom.find('.lh-code-snippet', tmpl);


    // Fill in top summary.
    // dom.find('.crc-initial-nav', tmpl).textContent = Util.UIStrings.crcInitialNavigation;
    // dom.find('.lh-crc__longest_duration_label', tmpl).textContent =
    //     Util.UIStrings.crcLongestDurationLabel;
    // dom.find('.lh-crc__longest_duration', tmpl).textContent =
    //     Util.formatMilliseconds(details.longestChain.duration);

    const codeLines = dom.createElement('div');
    codeLines.appendChild(CodeSnippetRenderer.renderHeader(dom, tmpl, details, false, () =>{
      containerEl.classList.toggle('lh-code-snippet--expanded');
    }));
    codeLines.appendChild(CodeSnippetRenderer.renderSnippet(dom, tmpl, details, false));
    codeLines.appendChild(CodeSnippetRenderer.renderSnippet(dom, tmpl, details, true));

    // containerEl.innerHTML = '';
    containerEl.appendChild(codeLines);


    return containerEl;
  }
}

// Allow Node require()'ing.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CodeSnippetRenderer;
} else {
  self.CodeSnippetRenderer = CodeSnippetRenderer;
}
