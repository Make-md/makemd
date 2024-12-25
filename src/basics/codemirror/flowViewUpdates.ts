import { EditorView, ViewUpdate } from "@codemirror/view";
import MakeBasicsPlugin from "basics/basics";
import {
  flowIDStateField,
  flowTypeStateField,
  portalTypeAnnotation,
} from "basics/codemirror/flowStateFields";
import { MarkdownView } from "obsidian";
import { cacheFlowEditorHeight, flowEditorInfo } from "./flowEditor";

//flow view editor viewupdates

export const flowViewUpdates = (plugin: MakeBasicsPlugin) => EditorView.updateListener.of((v: ViewUpdate) => {
  if (v.heightChanged) {
    plugin.app.workspace.iterateRootLeaves((leaf) => {
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
      plugin.app.workspace.iterateLeaves((leaf) => {
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
      }, plugin.app.workspace["rootSplit"]!);
    }
  }
});
