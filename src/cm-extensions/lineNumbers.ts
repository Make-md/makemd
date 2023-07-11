import { EditorState } from "@codemirror/state";
import { lineNumbers } from "@codemirror/view";
import MakeMDPlugin from "main";
import { iterateTreeInDocument } from "utils/codemirror";
export const lineNumberExtension = (plugin: MakeMDPlugin) =>
  lineNumbers({
    formatNumber: (lineNo: number, state: EditorState) => {
      if (!plugin.settings.inlineContext) {
        return lineNo.toString();
      }
      const isFM = (
        state: EditorState,
        typeString: string,
        from: number,
        to: number
      ): boolean => {
        if (typeString.contains("hmd-frontmatter")) {
          //reset auto header without space
          return true;
        }
        return false;
      };
      let fmEnd = 0;
      iterateTreeInDocument(state, {
        enter: ({ type, from, to }) => {
          if (isFM(state, type.name, from, to)) {
            fmEnd = to;
          }
        },
      });
      const newLine =
        fmEnd > 0
          ? lineNo -
            state.doc.lineAt(Math.min(fmEnd, state.doc.length - 1)).number
          : lineNo;
      return newLine > 0 ? newLine.toString() : lineNo.toString();
    },
  });
