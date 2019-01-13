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
  /**
   * @param {DOM} dom
   * @param {DocumentFragment} templateContext
   * @param {LH.Audit.DetailsRendererCodeSnippetItem} details
   * @param {function} toggleExpandedFn
   */
  static renderHeader(dom, templateContext, details, toggleExpandedFn) {
    const {lineCount, title} = details;
    const showAll = lineCount <= 4;

    const header = dom.cloneTemplate('#tmpl-lh-code-snippet__header', templateContext);
    dom.find('.lh-code-snippet__title', header).textContent = title;

    const toggleShowAllButton = dom.find('.lh-code-snippet__toggle-show-all', header);
    if (showAll) {
      toggleShowAllButton.remove();
    } else {
      toggleShowAllButton.addEventListener('click', () => {
        toggleExpandedFn();
      });
    }

    return header;
  }

  /**
   * @param {DOM} dom
   * @param {DocumentFragment} templateContext
   * @param {{content: string, number: number | string,truncated?: boolean}} line
   * @param {{highlight?: boolean, highlightMessage?: boolean}} options
   */
  static renderLine(dom, templateContext, line, options = {}) {
    const {content, number, truncated} = line;

    const template = dom.cloneTemplate('#tmpl-lh-code-snippet__line', templateContext);
    const codeLine = dom.find('.lh-code-snippet__line', template);

    if (options.highlight) {
      codeLine.classList.add('lh-code-snippet__line--highlighted');
    }
    if (options.highlightMessage) {
      codeLine.classList.add('lh-code-snippet__line--highlight-message');
    }

    dom.find('.lh-code-snippet__line-number', codeLine).textContent = number.toString();
    dom.find('.lh-code-snippet__line code', codeLine).textContent = content + (truncated ? '…' : '');

    return codeLine;
  }

  /**
   * @param {DOM} dom
   * @param {DocumentFragment} templateContext
   * @param {LH.Audit.DetailsRendererCodeSnippetHighlight} highlight
   */
  static renderHighlightMessage(dom, templateContext, highlight) {
    return CodeSnippetRenderer.renderLine(dom, templateContext, {
      number: ' ',
      content: highlight.message,
    }, {
      highlight: true,
      highlightMessage: true,
    });
  }

  /**
   * @param {DOM} dom
   * @param {DocumentFragment} templateContext
   */
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

    // todo rename snippet__snippet to snippet__content everywhere (or is __snippet better?)
    const template = dom.cloneTemplate('#tmpl-lh-code-snippet__content', templateContext);
    const snippetOuter = dom.find('.lh-code-snippet__snippet', template);
    snippetOuter.classList.toggle('lh-code-snippet__show-if-expanded', isExpanded);
    snippetOuter.classList.toggle('lh-code-snippet__show-if-collapsed', !isExpanded);

    const snippet = dom.find('.lh-code-snippet__snippet-inner', snippetOuter);


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
          snippet.append(CodeSnippetRenderer.renderHighlightMessage(dom, templateContext, highlight));
        });
      }

      const lineHighlights = Util.getLineHighlights(highlights, lineNumber);

      const codeLine = CodeSnippetRenderer.renderLine(dom, templateContext, line, {
        highlight: lineHighlights.length > 0 || hasOnlyNonLineSpecficHighlights,
      });
      snippet.append(codeLine);


      if (lineHighlights.length > 0) {
        lineHighlights.forEach(highlight => {
          snippet.append(CodeSnippetRenderer.renderHighlightMessage(dom, templateContext, highlight));
          hasSeenHighlight = true;
        });
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
    const tmpl = dom.cloneTemplate('#tmpl-lh-code-snippet', templateContext);
    const containerEl = dom.find('.lh-code-snippet', tmpl);

    const codeLines = dom.createElement('div');
    codeLines.appendChild(CodeSnippetRenderer.renderHeader(dom, tmpl, details, () =>{
      containerEl.classList.toggle('lh-code-snippet--expanded');
    }));
    // better solution than double render?
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
