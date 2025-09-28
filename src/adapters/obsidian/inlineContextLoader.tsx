import { PathProvider } from "core/react/context/PathContext";
import { SpaceManagerProvider } from "core/react/context/SpaceManagerContext";
import { FMMetadataKeys } from "core/types/space";
import MakeMDPlugin from "main";
import { Backlinks, MarkdownHeaderView } from "makemd-core";
import React from "react";
import { Root } from "react-dom/client";

export const modifyFlowDom = (plugin: MakeMDPlugin) => {
  if (
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
    } else {
      if (sizerEl.indexOf(inlineContext) != 0) {
        sizerEl.prepend(inlineContext);
      }
    }

    const construct = (root: Root) => {
      root.render(
        <SpaceManagerProvider superstate={plugin.superstate}>
          <PathProvider
            superstate={plugin.superstate}
            path={file.path}
            readMode={false}
          >
            <MarkdownHeaderView
              superstate={plugin.superstate}
              editorView={editorView.cm}
              editable={true}
              hiddenFields={[...FMMetadataKeys(plugin.superstate.settings)]}
            ></MarkdownHeaderView>
          </PathProvider>
        </SpaceManagerProvider>
      );
    };
    let root = plugin.ui.getRoot(inlineContext);
    if (!root) {
      root = plugin.ui.createRoot(inlineContext);
    }
    if (root) {
      construct(root);
    } else {
      plugin.ui.manager.eventsDispatch.addOnceListener("windowReady", () => {
        let root = plugin.ui.getRoot(inlineContext);
        if (!root) root = plugin.ui.createRoot(inlineContext);
        construct(root);
      });
    }

    if (plugin.superstate.settings.inlineBacklinks) {
      let backlinksEl = contentEl.querySelector(".mk-backlinks");
      if (!backlinksEl) {
        backlinksEl = document.createElement("div");
        backlinksEl.classList.add("mk-backlinks");
        backlinksEl.classList.add("embedded-backlinks");
        sizerEl.appendChild(backlinksEl);
      }
      const backlinksReactEl = plugin.ui.createRoot(backlinksEl);
      backlinksReactEl.render(
        <Backlinks superstate={plugin.superstate} path={file.path}></Backlinks>
      );
    }
  }
};
