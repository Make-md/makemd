import { RangeSetBuilder, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import MakeMDPlugin from "main";
import { i18n } from "makemd-core";
const placeholderLine = (plugin: MakeMDPlugin) => Decoration.line({
  attributes: { "data-ph": i18n.labels.placeholder.replace('${1}', plugin.superstate.settings.menuTriggerChar) },
  class: "mk-placeholder",
});

export const placeholderExtension = (plugin: MakeMDPlugin) => StateField.define<DecorationSet>({
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
