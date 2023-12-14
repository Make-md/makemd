import { FMMetadataKeys } from "core/types/space";
import MakeMDPlugin from "main";
import { Backlinks, MarkdownHeaderView } from "makemd-core";
import React from "react";
import { createRoot } from "react-dom/client";

export const modifyFlowDom = (plugin: MakeMDPlugin) => {
  if (
    !plugin.superstate.settings.makerMode ||
    !plugin.superstate.settings.inlineContext ||
    !plugin.app.workspace.activeEditor
  )
    return;

  const contentEl: HTMLElement = plugin.app.workspace.activeEditor.contentEl;

  const editorView = plugin.app.workspace.activeEditor.editor;
  const sizerEl = contentEl.querySelector(".cm-sizer");
  const file = plugin.app.workspace.getActiveFile();

  if (sizerEl && file) {
    let inlineContext = contentEl.querySelector(".mk-inline-context");
    if (!inlineContext) {
      inlineContext = document.createElement("div");
      inlineContext.classList.add("mk-inline-context");
      inlineContext.classList.add("embedded-backlinks");
      sizerEl.prepend(inlineContext);
    } else if (sizerEl.indexOf(inlineContext) != 0) {
      sizerEl.prepend(inlineContext);
    }
    const inlineContextReactEl = createRoot(inlineContext);
    inlineContextReactEl.render(
      <>
        <MarkdownHeaderView
          superstate={plugin.superstate}
          path={file.path}
          editorView={editorView.cm}
          showHeader={true}
          showBanner={true}
          showFolder={true}
          editable={true}
          hiddenFields={[...FMMetadataKeys(plugin.superstate.settings)]}
        ></MarkdownHeaderView>
      </>
    );
    if (plugin.superstate.settings.inlineBacklinks) {
      let backlinksEl = contentEl.querySelector(".mk-backlinks");
      if (!backlinksEl) {
        backlinksEl = document.createElement("div");
        backlinksEl.classList.add("mk-backlinks");
        backlinksEl.classList.add("embedded-backlinks");
        sizerEl.appendChild(backlinksEl);
      }
      const backlinksReactEl = createRoot(backlinksEl);
      backlinksReactEl.render(
        <Backlinks superstate={plugin.superstate} path={file.path}></Backlinks>
      );
    }
  }
};
