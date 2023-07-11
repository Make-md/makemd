import { FileHeaderContextView } from "components/FileContextView/FileHeaderContextView";
import { ReadingModeHeader } from "components/FileContextView/ReadingModeHeader";
import MakeMDPlugin from "main";
import { MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import React from "react";
import { createRoot } from "react-dom/client";
import { replaceMarkdownForReadingMode } from "utils/flow/markdownPost";
import { urlRegex } from "utils/regex";
import { filePathToString } from "utils/strings";

export const replaceInlineContext = (
  plugin: MakeMDPlugin,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) => {
    replaceMarkdownForReadingMode(el, (dom) => {
  let element = dom.querySelector('.mod-header') as HTMLElement;
  if (element) {
  if (!element.hasClass('mk-header') || element.getAttribute('data-path') != ctx.sourcePath) {
    element.innerHTML = '';
    element.setAttribute('data-path', ctx.sourcePath)
      element.toggleClass('mk-header', true);

    const reactEl = createRoot(element);
    ctx.addChild(new MarkdownRenderChild(element));
    //   const flowType = cm.state.field(flowTypeStateField, false);
    if (ctx.sourcePath.match(urlRegex)) {
      reactEl.render(
        <FileHeaderContextView
          plugin={plugin}
          fm={ctx.frontmatter}
          name={filePathToString(ctx.sourcePath)}
        ></FileHeaderContextView>
      );
    } else {
      reactEl.render(
        <ReadingModeHeader plugin={plugin} filePath={ctx.sourcePath}></ReadingModeHeader>
      );
    }} 
  }});
};
