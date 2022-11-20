import { EditorView, Decoration, DecorationSet, } from "@codemirror/view";
import t from 'i18n'
import { StateField, RangeSetBuilder } from "@codemirror/state";
const placeholderLine = Decoration.line({attributes: {'data-ph': t.labels.placeholder}, class: 'cm-placeholder'})

export const placeholder = StateField.define<DecorationSet>({
    create() {
      return Decoration.none
    },
    update(value, tr) {
      let builder = new RangeSetBuilder<Decoration>()
      const currentLine = tr.state.doc.lineAt(tr.state.selection.main.head);

      if (currentLine?.length == 0)
          builder.add(currentLine.from, currentLine.from, placeholderLine);
      const dec = builder.finish()
      return dec;
    },
    provide: f => EditorView.decorations.from(f)
  })