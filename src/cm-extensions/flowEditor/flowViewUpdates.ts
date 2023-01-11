import { EditorView, ViewUpdate } from "@codemirror/view";
import {
  flowIDStateField,
  flowTypeStateField,
  portalTypeAnnotation
} from "cm-extensions/markSans/callout";
import { MarkdownView } from "obsidian";
import {
  cacheFlowEditorHeight,
  flowEditorInfo
} from "./flowEditor";

//flow view editor viewupdates

export const flowViewUpdates = EditorView.updateListener.of((v: ViewUpdate) => {
  if (v.heightChanged) {
    app.workspace.iterateRootLeaves((leaf) => {
      const cm = (leaf.view as MarkdownView).editor?.cm as EditorView;

      if (
        cm &&
        v.view.dom == cm.dom &&
        cm.state.field(flowTypeStateField, false)
      ) {
        if (
          leaf.containerEl.parentElement?.hasClass("workspace-tab-container")
        ) {
          if (cm.state.field(flowTypeStateField, false) != "doc") {
            cm.dispatch({
              annotations: portalTypeAnnotation.of("doc"),
            });
          }
        }
      }
    });
  }
  if (v.heightChanged) {
    const flowID = v.state.field(flowIDStateField, false);
    if (flowID) {
      app.workspace.iterateLeaves((leaf) => {
        const cm = (leaf.view as MarkdownView).editor?.cm as EditorView;
        if (cm) {
          const stateField = cm.state.field(flowEditorInfo, false);
          if (stateField) {
            if (stateField.find((f) => f.id == flowID)) {
              cm.dispatch({
                annotations: cacheFlowEditorHeight.of([
                  flowID,
                  v.view.contentHeight,
                ]),
              });
            }
          }
        }
      }, app.workspace["rootSplit"]!);
    }
  }
});
