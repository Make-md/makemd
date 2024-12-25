import { EditorView } from "@codemirror/view";
import MakeBasicsPlugin from "basics/basics";
import { FlowEditorHover } from "basics/flow/FlowEditorHover";
import { UINote } from "basics/ui/UINote";
import { App, MarkdownPostProcessorContext } from "obsidian";
import React from "react";

const getCMFromElement = (
  el: HTMLElement,
  app: App
): EditorView | undefined => {
  let dom: HTMLElement = el;
  while (!dom.hasClass("cm-editor") && dom.parentElement) {
    dom = dom.parentElement;
  }

  if (!dom.hasClass("cm-editor")) {
    return;
  }
  let rcm: EditorView;
  app.workspace.iterateLeaves((leaf) => {
    //@ts-ignore
    const cm = leaf.view.editor?.cm as EditorView;
    if (cm && dom == cm.dom) {
      rcm = cm;
      return true;
    }
  }, app.workspace["rootSplit"]!);
  return rcm;
};

export const replaceAllTables = (
  plugin: MakeBasicsPlugin,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) => {
  el.querySelectorAll("p").forEach((element) => {
    for (const match of element.textContent.matchAll(
      /(?:!\[!\[|!!\[\[)([^\]]+)\]\]/g
    )) {
      const link = match[1];
      element.style.display = "none";
      const reactEl = plugin.createRoot(element.parentElement);
      //   const flowType = cm.state.field(flowTypeStateField, false);
      reactEl.render(
        <UINote
          load={true}
          plugin={plugin}
          path={link}
          source={ctx.sourcePath}
        ></UINote>
      );
    }
  });
};
export const replaceMarkdownForEmbeds = (
  el: HTMLElement,
  callback: (dom: HTMLElement) => void
) => {
  let dom: HTMLElement = el;
  setTimeout(async () => {
    //wait for el to be attached to the displayed document
    let counter = 0;
    while (!el.parentElement && counter++ <= 50) await sleep(50);
    if (!el.parentElement) return;
    while (!dom.hasClass("markdown-embed") && dom.parentElement) {
      dom = dom.parentElement;
    }
    if (dom) {
      callback(dom);
    }
  });
};

export const waitDOMInCM = (
  el: HTMLElement,
  cm: EditorView,
  callback: (dom: HTMLElement) => void
) => {
  let dom: HTMLElement = el;
  setTimeout(async () => {
    //wait for el to be attached to the displayed document
    let counter = 0;
    while (!el.parentElement && counter++ <= 50) await sleep(50);
    if (!el.parentElement) return;

    while (!dom.hasClass("markdown-embed") && dom.parentElement) {
      dom = dom.parentElement;
    }
    if (dom) {
      callback(dom);
    }
  });
};

export const replaceAllEmbed = (
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  plugin: MakeBasicsPlugin,
  app: App
) => {
  replaceMarkdownForEmbeds(el, async (dom) => {
    const nodes = dom.querySelectorAll(".markdown-embed-link");

    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode === dom) {
        dom.removeChild(nodes[i]);
        const div = dom.createDiv("mk-floweditor-selector");
        const reactEl = plugin.createRoot(div);
        const cm: EditorView = getCMFromElement(el, app);
        const pos = cm?.posAtDOM(dom);
        const index = [
          ...Array.from(dom.parentElement?.childNodes ?? []),
        ].indexOf(dom);
        if (index == -1) return;
        const nextDom = dom.parentElement.childNodes[index];
        const endPos = cm?.posAtDOM(nextDom);

        //   const flowType = cm.state.field(flowTypeStateField, false);
        if (ctx.sourcePath)
          reactEl.render(
            <FlowEditorHover
              app={app}
              toggle={true}
              path={ctx.sourcePath}
              toggleState={false}
              view={cm}
              pos={{ from: pos + 3, to: endPos - 3 }}
              plugin={plugin}
              dom={dom}
            ></FlowEditorHover>
          );
      }
    }
  });
};
