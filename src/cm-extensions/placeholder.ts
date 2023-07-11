import { RangeSetBuilder, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import t from "i18n";
const placeholderLine = Decoration.line({
  attributes: { "data-ph": t.labels.placeholder },
  class: "mk-placeholder",
});

export const placeholder = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    let builder = new RangeSetBuilder<Decoration>();
    const currentLine = tr.state.doc.lineAt(tr.state.selection.main.head);

    if (currentLine?.length == 0)
      builder.add(currentLine.from, currentLine.from, placeholderLine);
    const dec = builder.finish();
    return dec;
  },
  provide: (f) => EditorView.decorations.from(f),
});
