import { ReadingModeHeader } from "adapters/obsidian/ui/editors/ReadingModeHeader";
import { RemoteMarkdownHeaderView } from "adapters/obsidian/ui/editors/markdownView/RemoteMarkdownHeaderView";
import { replaceMarkdownForReadingMode } from "adapters/obsidian/utils/flow/markdownPost";
import MakeMDPlugin from "main";
import { MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import React from "react";
import { Root } from "react-dom/client";
import { pathToString } from "utils/path";
import { urlRegex } from "utils/regex";

export const replaceInlineContext = (
  plugin: MakeMDPlugin,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) => {
  replaceMarkdownForReadingMode(el, async (dom) => {
    const element = dom.querySelector(".mod-header") as HTMLElement;
    if (!el.parentElement) return;
    let outerdom = dom;
    while (
      !outerdom.hasClass("mk-floweditor") &&
      !outerdom.hasClass("workspace") &&
      outerdom.parentElement
    ) {
      outerdom = outerdom.parentElement;
    }
    if (outerdom.hasClass("mk-floweditor")) return;

    if (element) {
      let ctxElement = element?.querySelector(".mk-inline-context");
      if (!ctxElement) {
        ctxElement = element.createDiv();
        ctxElement.classList.add("mk-inline-context");
        element.prepend(ctxElement);
      }
      if (ctxElement.getAttribute("data-path") != ctx.sourcePath) {
        ctxElement.setAttribute("data-path", ctx.sourcePath);
        ctx.addChild(new MarkdownRenderChild(element));
        const root = plugin.ui.createRoot(ctxElement);
        const construct = (root: Root) => {
          if (ctx.sourcePath.match(urlRegex)) {
            root.render(
              <RemoteMarkdownHeaderView
                superstate={plugin.superstate}
                fm={ctx.frontmatter}
                name={pathToString(ctx.sourcePath)}
              ></RemoteMarkdownHeaderView>
            );
          } else {
            root.render(
              <ReadingModeHeader
                superstate={plugin.superstate}
                filePath={ctx.sourcePath}
              ></ReadingModeHeader>
            );
          }
        };
        if (root) {
          construct(root);
        } else {
          plugin.ui.manager.eventsDispatch.addOnceListener(
            "windowReady",
            () => {
              const root = plugin.ui.createRoot(ctxElement);
              construct(root);
            }
          );
        }
      }
    }
  });
};
