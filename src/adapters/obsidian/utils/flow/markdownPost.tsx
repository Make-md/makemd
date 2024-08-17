import { EditorView } from "@codemirror/view";
import { FlowEditorHover } from "adapters/obsidian/ui/editors/markdownView/FlowEditorHover";
import { NoteView } from "core/react/components/PathView/NoteView";
import MakeMDPlugin from "main";
import { Superstate } from "makemd-core";
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
  plugin: MakeMDPlugin,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) => {
  el.querySelectorAll("p").forEach((element) => {
    for (const match of element.textContent.matchAll(
      /(?:!\[!\[|!!\[\[)([^\]]+)\]\]/g
    )) {
      const link = match[1];
      element.style.display = "none";
      const reactEl = plugin.ui.createRoot(element.parentElement);
      //   const flowType = cm.state.field(flowTypeStateField, false);
      reactEl.render(
        <NoteView
          load={true}
          superstate={plugin.superstate}
          path={link}
          source={ctx.sourcePath}
        ></NoteView>
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

export const replaceMarkdownForReadingMode = (
  el: HTMLElement,
  callback: (dom: HTMLElement) => void
) => {
  let dom: HTMLElement = el;
  setTimeout(async () => {
    //wait for el to be attached to the displayed document
    let counter = 0;
    while (!el.parentElement && counter++ <= 50) await sleep(50);
    if (!el.parentElement) return;

    while (
      !dom.hasClass("markdown-reading-view") &&
      !dom.hasClass("internal-embed") &&
      dom.parentElement
    ) {
      dom = dom.parentElement;
    }
    if (dom && dom.hasClass("markdown-reading-view")) {
      callback(dom);
    }
  });
};
export const replaceAllEmbed = (
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  superstate: Superstate,
  app: App
) => {
  replaceMarkdownForEmbeds(el, async (dom) => {
    const nodes = dom.querySelectorAll(".markdown-embed-link");

    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode === dom) {
        dom.removeChild(nodes[i]);
        const div = dom.createDiv("mk-floweditor-selector");
        const reactEl = superstate.ui.createRoot(div);
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
              superstate={superstate}
              dom={dom}
            ></FlowEditorHover>
          );
      }
    }
  });
};
