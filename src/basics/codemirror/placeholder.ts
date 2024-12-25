import { RangeSetBuilder, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import MakeBasicsPlugin from "basics/basics";
import { i18n } from "makemd-core";
const placeholderLine = (plugin: MakeBasicsPlugin) => Decoration.line({
  attributes: { "data-ph": i18n.labels.placeholder.replace('${1}', plugin.settings.menuTriggerChar) },
  class: "mk-placeholder",
});

export const placeholderExtension = (plugin: MakeBasicsPlugin) => StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    const builder = new RangeSetBuilder<Decoration>();
    const currentLine = tr.state.doc.lineAt(tr.state.selection.main.head);

    if (currentLine?.length == 0)
      builder.add(currentLine.from, currentLine.from, placeholderLine(plugin));
    const dec = builder.finish();
    return dec;
  },
  provide: (f) => EditorView.decorations.from(f),
});
