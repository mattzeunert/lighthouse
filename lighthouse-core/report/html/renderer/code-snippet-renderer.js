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

const SHOW_IF_EXPANDED_CLASS = 'lh-code-snippet__show-if-expanded';
const SHOW_IF_COLLAPSED_CLASS = 'lh-code-snippet__show-if-collapsed';


// todo: when rendering messages or ... lines, should there be a <code> element at all?

class CodeSnippetRenderer {
  /**
   * @param {DOM} dom
   * @param {DocumentFragment} tmpl
   * @param {LH.Audit.DetailsRendererCodeSnippet} details
   * @param {function} toggleExpandedFn
   * @return {DocumentFragment}
   */
  static renderHeader(dom, tmpl, details, detailsRenderer, toggleExpandedFn) {
    const {lineCount, title} = details;
    const showAll = lineCount <= 4;

    const header = dom.cloneTemplate('#tmpl-lh-code-snippet__header', tmpl);
    dom.find('.lh-code-snippet__title', header).textContent = title;

    const {codeSnippetCollapse, codeSnippetExpand} = Util.UIStrings;
    dom.find('.' + SHOW_IF_EXPANDED_CLASS, header).textContent = codeSnippetCollapse;
    dom.find('.' + SHOW_IF_COLLAPSED_CLASS, header).textContent = codeSnippetExpand;

    const toggleShowAllButton = dom.find('.lh-code-snippet__toggle-show-all', header);
    if (showAll) {
      toggleShowAllButton.remove();
    } else {
      toggleShowAllButton.addEventListener('click', () => {
        toggleExpandedFn();
      });
    }

    const nodeContainer = dom.find('.lh-code-snippet__node', header);
    if (details.node) {
      // todo: only do this if isdevtools
      // (and check that it works fine)
      nodeContainer.appendChild(detailsRenderer.renderNode(details.node));
    }

    return header;
  }


  /**
   * @param {DOM} dom
   * @param {DocumentFragment} tmpl
   * @param {{content: string, number: number | string,truncated?: boolean}} line
   * @param {LineOptions} lineOptions
   * @return {Element}
   */
  static renderLine(dom, tmpl, line, lineOptions = {}) {
    const {content, number, truncated} = line;

    const clonedTemplate = dom.cloneTemplate('#tmpl-lh-code-snippet__line', tmpl);
    const codeLine = dom.find('.lh-code-snippet__line', clonedTemplate);

    if (lineOptions.highlight) {
      codeLine.classList.add('lh-code-snippet__line--highlighted');
    }
    if (lineOptions.highlightMessage) {
      codeLine.classList.add('lh-code-snippet__line--highlight-message');
    }
    if (lineOptions.code) {
      // todo: need thsi? right now just used for test... probs can remove some :not in test
      codeLine.classList.add('lh-code-snippet__line--code');
    }
    if (lineOptions.collapsedOnly) {
      codeLine.classList.add(SHOW_IF_COLLAPSED_CLASS);
    }
    if (lineOptions.expandedOnly) {
      codeLine.classList.add(SHOW_IF_EXPANDED_CLASS);
    }

    const lineContent = content + (truncated ? '…' : '');
    const lineContentEl = dom.find('.lh-code-snippet__line code', codeLine);
    if (lineOptions.convertMarkdownLinkSnippets) {
      lineContentEl.appendChild(dom.convertMarkdownLinkSnippets(lineContent));
    } else {
      lineContentEl.textContent = lineContent;
    }

    dom.find('.lh-code-snippet__line-number', codeLine).textContent = number.toString();

    return codeLine;
  }

  /**
   * @param {DOM} dom
   * @param {DocumentFragment} tmpl
   * @param {LH.Audit.DetailsRendererCodeSnippetHighlight} highlight
   * @return {Element}
   */
  static renderHighlightMessage(dom, tmpl, highlight) {
    return CodeSnippetRenderer.renderLine(dom, tmpl, {
      number: ' ',
      content: highlight.message,
    }, {
      highlight: true,
      highlightMessage: true,
      convertMarkdownLinkSnippets: true,
    });
  }

  /**
   * @param {DOM} dom
   * @param {DocumentFragment} tmpl
   * @param {LineOptions} classOptions
   * @return {Element}
   */
  static renderOmittedLines(dom, tmpl, classOptions = {}) {
    return CodeSnippetRenderer.renderLine(dom, tmpl, {
      number: '…',
      content: '',
    }, classOptions);
  }

  // todo: comments in this function and try to shorten it
  // todo: comments in general

  // todo: separate logic and DOM generation?
  // todo rename snippet__snippet to snippet__content everywhere (or is __snippet better?)

  /**
   * @param {DOM} dom
   * @param {DocumentFragment} tmpl
   * @param {LH.Audit.DetailsRendererCodeSnippet} details
   * @return {Element}
   */
  static renderSnippet(dom, tmpl, details) {
    const {highlights, lineCount, lines} = details;


    const template = dom.cloneTemplate('#tmpl-lh-code-snippet__content', tmpl);
    const snippetOuter = dom.find('.lh-code-snippet__snippet', template);
    const snippet = dom.find('.lh-code-snippet__snippet-inner', snippetOuter);

    const nonLineSpecificHighlights = highlights.filter(h => typeof h.lineNumber !== 'number');
    nonLineSpecificHighlights.forEach(highlight => {
      snippet.append(CodeSnippetRenderer.renderHighlightMessage(dom, tmpl, highlight));
    });

    snippet.append(CodeSnippetRenderer.renderSnippetLines(dom, tmpl, details));

    // If expanded view still doesn't include all lines then show that
    const firstLineIsVisible = lines[0].number === 1;
    const lastLineIsVisible = lines.slice(-1)[0].number === lineCount;
    if (!firstLineIsVisible) {
      snippet.append(CodeSnippetRenderer.renderOmittedLines(dom, tmpl, {expandedOnly: true}));
    }
    if (!lastLineIsVisible) {
      snippet.append(CodeSnippetRenderer.renderOmittedLines(dom, tmpl, {expandedOnly: true}));
    }

    return snippetOuter;
  }

  /**
   * @param {DOM} dom
   * @param {DocumentFragment} tmpl
   * @param {LH.Audit.DetailsRendererCodeSnippet} details
   * @returns {DocumentFragment}
   */
  static renderSnippetLines(dom, tmpl, details) {
    const {highlights, lineCount, lines} = details;
    const linesEl = dom.createFragment();

    const collapsedLines = Util.filterRelevantLines(lines, highlights, 2);

    const hasLineSpecificHighlights = highlights.some(h => typeof h.lineNumber === 'number');
    const hasOnlyNonLineSpecficHighlights = highlights.length > 0 && !hasLineSpecificHighlights;

    let hasSeenHighlight = false;
    for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
      const line = lines.find(l => l.number === lineNumber);
      const previousLine = lines.find(l => l.number === lineNumber - 1);
      const collapsedLine = collapsedLines.find(l => l.number === lineNumber);
      const collapsedPreviousLine = collapsedLines.find(l => l.number === lineNumber - 1);
      const lineHighlights = Util.getLineHighlights(highlights, lineNumber);
      if (hasSeenHighlight) {
        // Show if some lines were omitted
        if (line && !previousLine) {
          linesEl.append(CodeSnippetRenderer.renderOmittedLines(dom, tmpl, {expandedOnly: true}));
        }
        if (collapsedLine && !collapsedPreviousLine) {
          linesEl.append(CodeSnippetRenderer.renderOmittedLines(dom, tmpl, {collapsedOnly: true}));
        }
      }
      if (line) {
        linesEl.append(CodeSnippetRenderer.renderLine(dom, tmpl, line, {
          highlight: lineHighlights.length > 0 || hasOnlyNonLineSpecficHighlights,
          expandedOnly: !collapsedLine,
          code: true,
        }));
        lineHighlights.forEach(highlight => {
          linesEl.append(CodeSnippetRenderer.renderHighlightMessage(dom, tmpl, highlight));
          hasSeenHighlight = true;
        });
      }
    }

    return linesEl;
  }

  /**
   * @param {DOM} dom
   * @param {DocumentFragment} templateContext
   * @param {LH.Audit.DetailsRendererCodeSnippet} details
   * @return {Element}
   */
  static render(dom, templateContext, details, detailsRenderer) {
    const tmpl = dom.cloneTemplate('#tmpl-lh-code-snippet', templateContext);
    const codeSnippet = dom.find('.lh-code-snippet', tmpl);

    const codeLines = dom.createElement('div');
    codeSnippet.appendChild(CodeSnippetRenderer.renderHeader(dom, tmpl, details, detailsRenderer, () =>{
      codeSnippet.classList.toggle('lh-code-snippet--expanded');
    }));
    // better solution than double render?
    codeSnippet.appendChild(CodeSnippetRenderer.renderSnippet(dom, tmpl, details));

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

/** @typedef {{
      highlight?: boolean;
      highlightMessage?: boolean;
      collapsedOnly?: boolean;
      expandedOnly?: boolean;
      convertMarkdownLinkSnippets?: boolean;
      code?: boolean;
  }} LineOptions
 */
