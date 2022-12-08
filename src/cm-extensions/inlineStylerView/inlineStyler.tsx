import { Tooltip, showTooltip, tooltips } from "cm-extensions/tooltip";
import { StateField } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

const cursorTooltipField = (plugin: MakeMDPlugin) => StateField.define<readonly Tooltip[]>({
  create: getCursorTooltips(plugin),

  update(tooltips, tr) {
    if (!tr.docChanged && !tr.selection) return tooltips;
    return getCursorTooltips(plugin)(tr.state);
  },

  provide: (f) => showTooltip.computeN([f], (state) => state.field(f)),
});
import { EditorState } from "@codemirror/state";
import { InlineMenuComponent } from "cm-extensions/inlineStylerView/InlineMenu";
import { oMarks } from "cm-extensions/markSans/obsidianSyntax";
import { rangeIsMark, expandRange } from "./marks";
import MakeMDPlugin from "main";

const getCursorTooltips = (plugin: MakeMDPlugin) => (state: EditorState): readonly Tooltip[] => {
  return state.selection.ranges
    .filter((range) => !range.empty)
    .map((range) => {
      const expandedRange = expandRange(range, state);
      let line = state.doc.lineAt(range.head);
      let activeMarks = oMarks
        .map((f) => (rangeIsMark(state, f, expandedRange) ? f.mark : ""))
        .filter((f) => f != "");
      return {
        pos: Math.min(range.head, range.anchor),
        above: true,
        strictSide: true,
        arrow: false,
        create: (view: EditorView) => {
          let dom = document.createElement("div");
          dom.className = "cm-tooltip-cursor";
          const reactElement = createRoot(dom);
          reactElement.render(
            <>
              <InlineMenuComponent
              plugin={plugin}
                cm={view}
                activeMarks={activeMarks}
                mobile={false}
              />
            </>
          );
          return { dom };
        },
      };
    });
}

export function cursorTooltip(plugin: MakeMDPlugin) {
  return cursorTooltipField(plugin);
}
