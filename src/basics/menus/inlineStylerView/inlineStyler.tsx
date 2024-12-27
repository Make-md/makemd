import { EditorState, StateField } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import MakeBasicsPlugin from "basics/basics";
import { InlineMenuComponent } from "basics/menus/inlineStylerView/InlineMenu";
import { oMarks } from "basics/menus/obsidianSyntax";
import { Tooltip, showTooltip } from "basics/tooltip";
import React from "react";
import { expandRange, rangeIsMark } from "./marks";

const cursorTooltipField = (plugin: MakeBasicsPlugin) =>
  StateField.define<readonly Tooltip[]>({
    create: getCursorTooltips(plugin),

    update(tooltips, tr) {
      if (!tr.docChanged && !tr.selection) return tooltips;
      return getCursorTooltips(plugin)(tr.state);
    },

    provide: (f) => showTooltip.computeN([f], (state) => state.field(f)),
  });

const getCursorTooltips =
  (plugin: MakeBasicsPlugin) =>
  (state: EditorState): readonly Tooltip[] => {
    return state.selection.ranges
      .filter((range) => !range.empty)
      .map((range) => {
        const expandedRange = expandRange(range, state);
        const line = state.doc.lineAt(range.head);
        const activeMarks = oMarks
          .map((f) => (rangeIsMark(state, f, expandedRange) ? f.mark : ""))
          .filter((f) => f != "");
        return {
          pos: Math.min(range.head, range.anchor),
          above: true,
          strictSide: true,
          arrow: false,
          create: (view: EditorView) => {
            const dom = document.createElement("div");
            dom.className = "cm-tooltip-cursor";
            const reactElement = plugin.enactor.createRoot(dom);
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
  };

export function cursorTooltip(plugin: MakeBasicsPlugin) {
  return cursorTooltipField(plugin);
}
