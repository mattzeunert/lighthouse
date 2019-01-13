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
// todo:  write a test for this --- see crc test

class CodeSnippetRenderer {
  /**
   * @param {DOM} dom
   * @param {DocumentFragment} tmpl
   * @param {LH.Audit.DetailsRendererCodeSnippetItem} details
   * @param {function} toggleExpandedFn
   */
  static renderHeader(dom, tmpl, details, toggleExpandedFn) {
    const {lineCount, title} = details;
    const showAll = lineCount <= 4;

    const header = dom.cloneTemplate('#tmpl-lh-code-snippet__header', tmpl);
    dom.find('.lh-code-snippet__title', header).textContent = title;

    const {codeSnippetCollpase, codeSnippetExpand} = Util.UIStrings;
    dom.find('.lh-code-snippet__show-if-expanded', header).textContent = codeSnippetCollpase;
    dom.find('.lh-code-snippet__show-if-collapsed', header).textContent = codeSnippetExpand;

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
   * @param {DocumentFragment} tmpl
   * @param {{content: string, number: number | string,truncated?: boolean}} line
   * @param {{highlight?: boolean, highlightMessage?: boolean}} classOptions
   */
  static renderLine(dom, tmpl, line, classOptions = {}) {
    const {content, number, truncated} = line;

    const template = dom.cloneTemplate('#tmpl-lh-code-snippet__line', tmpl);
    const codeLine = dom.find('.lh-code-snippet__line', template);

    if (classOptions.highlight) {
      codeLine.classList.add('lh-code-snippet__line--highlighted');
    }
    if (classOptions.highlightMessage) {
      codeLine.classList.add('lh-code-snippet__line--highlight-message');
    }

    dom.find('.lh-code-snippet__line-number', codeLine).textContent = number.toString();
    dom.find('.lh-code-snippet__line code', codeLine).textContent = content + (truncated ? '…' : '');

    return codeLine;
  }

  /**
   * @param {DOM} dom
   * @param {DocumentFragment} tmpl
   * @param {LH.Audit.DetailsRendererCodeSnippetHighlight} highlight
   */
  static renderHighlightMessage(dom, tmpl, highlight) {
    return CodeSnippetRenderer.renderLine(dom, tmpl, {
      number: ' ',
      content: highlight.message,
    }, {
      highlight: true,
      highlightMessage: true,
    });
  }

  /**
   * @param {DOM} dom
   * @param {DocumentFragment} tmpl
   */
  static renderOmittedLinesIndicator(dom, tmpl) {
    return CodeSnippetRenderer.renderLine(dom, tmpl, {
      number: '…',
      content: '',
    });
  }

  /**
   * @param {DOM} dom
   * @param {DocumentFragment} tmpl
   * @param {LH.Audit.DetailsRendererCodeSnippetItem} details
   * @param {*} isExpanded
   */
  static renderSnippet(dom, tmpl, details, isExpanded) {
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
    const template = dom.cloneTemplate('#tmpl-lh-code-snippet__content', tmpl);
    const snippetOuter = dom.find('.lh-code-snippet__snippet', template);
    snippetOuter.classList.toggle('lh-code-snippet__show-if-expanded', isExpanded);
    snippetOuter.classList.toggle('lh-code-snippet__show-if-collapsed', !isExpanded);
    const snippet = dom.find('.lh-code-snippet__snippet-inner', snippetOuter);

    if (!firstLineIsVisible && isExpanded) {
      snippet.append(CodeSnippetRenderer.renderOmittedLinesIndicator(dom, tmpl));
    }

    let hasSeenHighlight = false;
    for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
      const line = getLine(lineNumber);
      const previousLine = getLine(lineNumber - 1);

      if (!line) {
        continue;
      }
      if (!previousLine && hasSeenHighlight) {
        snippet.append(CodeSnippetRenderer.renderOmittedLinesIndicator(dom, tmpl));
      }
      if (lineNumber === 1) {
        nonLineSpecificHighlights.forEach(highlight => {
          snippet.append(CodeSnippetRenderer.renderHighlightMessage(dom, tmpl, highlight));
        });
      }

      const lineHighlights = Util.getLineHighlights(highlights, lineNumber);

      const codeLine = CodeSnippetRenderer.renderLine(dom, tmpl, line, {
        highlight: lineHighlights.length > 0 || hasOnlyNonLineSpecficHighlights,
      });
      snippet.append(codeLine);

      lineHighlights.forEach(highlight => {
        snippet.append(CodeSnippetRenderer.renderHighlightMessage(dom, tmpl, highlight));
        hasSeenHighlight = true;
      });
    }

    if (!lastLineIsVisible && isExpanded) {
      snippet.append(CodeSnippetRenderer.renderOmittedLinesIndicator(dom, tmpl));
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
    const codeSnippet = dom.find('.lh-code-snippet', tmpl);

    const codeLines = dom.createElement('div');
    codeSnippet.appendChild(CodeSnippetRenderer.renderHeader(dom, tmpl, details, () =>{
      codeSnippet.classList.toggle('lh-code-snippet--expanded');
    }));
    // better solution than double render?
    codeSnippet.appendChild(CodeSnippetRenderer.renderSnippet(dom, tmpl, details, false));
    codeSnippet.appendChild(CodeSnippetRenderer.renderSnippet(dom, tmpl, details, true));

    codeSnippet.appendChild(codeLines);
    return codeSnippet;
  }
}

// Allow Node require()'ing.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CodeSnippetRenderer;
} else {
  self.CodeSnippetRenderer = CodeSnippetRenderer;
}
