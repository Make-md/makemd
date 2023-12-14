import { EditorState, StateField } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { InlineMenuComponent } from "adapters/obsidian/ui/editors/markdownView/menus/inlineStylerView/InlineMenu";
import { oMarks } from "adapters/obsidian/ui/editors/markdownView/obsidianSyntax";
import {
  Tooltip,
  showTooltip,
} from "adapters/obsidian/ui/editors/markdownView/tooltip";
import MakeMDPlugin from "main";
import React from "react";
import { createRoot } from "react-dom/client";
import { expandRange, rangeIsMark } from "./marks";

const cursorTooltipField = (plugin: MakeMDPlugin) =>
  StateField.define<readonly Tooltip[]>({
    create: getCursorTooltips(plugin),

    update(tooltips, tr) {
      if (!tr.docChanged && !tr.selection) return tooltips;
      return getCursorTooltips(plugin)(tr.state);
    },

    provide: (f) => showTooltip.computeN([f], (state) => state.field(f)),
  });

const getCursorTooltips =
  (plugin: MakeMDPlugin) =>
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
  };

export function cursorTooltip(plugin: MakeMDPlugin) {
  return cursorTooltipField(plugin);
}
