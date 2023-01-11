import { EditorState, RangeSetBuilder, StateField } from "@codemirror/state";
import {
  Decoration, DecorationSet,
  EditorView, WidgetType
} from "@codemirror/view";
import {
  iterateTreeInDocument,
  iterateTreeInSelection
} from "utils/codemirror";

export const resetLine = Decoration.line({ class: "mk-reset" });

const needsReset = (
  state: EditorState,
  typeString: string,
  from: number,
  to: number
): boolean => {
  const length = to - from;

  if (typeString.contains("HyperMD-header")) {
    //reset auto header without space
    if (
      parseInt(typeString.replace(/.*HyperMD-header-(\d+).*/, "$1")) == length
    ) {
      return true;
    }
    let truefalse = true;
    // reset Autoheader before hr
    iterateTreeInSelection({ from: from, to: to }, state, {
      enter: ({ type, from, to }) => {
        if (type.name.contains("formatting-header")) {
          truefalse = false;
        }
      },
    });
    return truefalse;
  }
  return false;
};

export const hrResetFix = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    let builder = new RangeSetBuilder<Decoration>();

    iterateTreeInDocument(tr.state, {
      enter: ({ type, from, to }) => {
        if (needsReset(tr.state, type.name, from, to)) {
          builder.add(from, from, resetLine);
        }
      },
    });
    const dec = builder.finish();
    return dec;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const hrDecorations = (state: EditorState): DecorationSet => {
  let builder = new RangeSetBuilder<Decoration>();
  let nodes = [] as { name: string; from: number; to: number }[];
  iterateTreeInDocument(state, {
    enter: ({ name, from, to }) => {
      if (
        name.contains("formatting-header") &&
        state.sliceDoc(from, to) == "---" &&
        !(state.selection.main.from >= from && state.selection.main.to <= to)
      ) {
        builder.add(from, to, hr);
      }
    },
  });
  const dec = builder.finish();
  return dec;
};

export const hrField = StateField.define<DecorationSet>({
  create(state) {
    return hrDecorations(state);
  },
  update(value, tr) {
    if (!tr.docChanged) return value;
    return hrDecorations(tr.state);
  },
  provide: (f) => EditorView.decorations.from(f),
});

class HRWidget extends WidgetType {
  constructor() {
    super();
  }

  eq(other: WidgetType) {
    return true;
  }

  toDOM() {
    const div = document.createElement("hr");
    return div;
  }
}

export const hr = Decoration.replace({
  widget: new HRWidget(),
  block: false,
});
