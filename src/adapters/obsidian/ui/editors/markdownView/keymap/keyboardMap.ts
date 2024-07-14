import { EditorView, keymap } from "@codemirror/view";

export const defaultKeymap = 
    keymap.of(
      [{ key: "ArrowDown", run: (editorView: EditorView) => {

        return false;
      }}]
  );