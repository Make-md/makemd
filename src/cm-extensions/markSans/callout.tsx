import { syntaxTree } from "@codemirror/language";
import {
  Annotation, RangeSetBuilder, StateField
} from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import { PortalType } from "types/types";
import { genId } from "utils/uuid";

export const portalTypeAnnotation = Annotation.define<PortalType>();
export const flowIDAnnotation = Annotation.define<string>();
export const flowIDStateField = StateField.define<string | undefined>({
  create: () => undefined,
  update(value, tr) {
    if (tr.annotation(flowIDAnnotation)) return tr.annotation(flowIDAnnotation);
    return value;
  },
});

export const flowTypeStateField = StateField.define<PortalType>({
  create: () => "none",
  update(value, tr) {
    if (tr.annotation(portalTypeAnnotation))
      return tr.annotation(portalTypeAnnotation);
    return value;
  },
});

export const calloutField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    if (tr.state.field(flowTypeStateField) != "doc") {
      return value;
    }

    let builder = new RangeSetBuilder<Decoration>();
    let nodes = [] as { name: string; from: number; to: number }[];
    syntaxTree(tr.state).iterate({
      enter: ({ name, from, to }) => {
        nodes.push({ name, from, to });
      },
    });
    const nextQuote = (
      ns: { name: string; from: number; to: number }[],
      to: number
    ): number => {
      const nq = ns.find(
        (f) => f.from == to + 1 && f.name.contains("HyperMD-quote")
      );
      if (nq) {
        return nextQuote(ns, nq.to);
      }
      return to;
    };
    const previous = value.iter();
    const previousSpecs = [] as { id: string; from: number; to: number }[];
    while (previous.value !== null) {
      previousSpecs.push(previous.value.spec.widget.info);
      previous.next();
    }
    let index = 0;
    nodes.map(({ name, from, to }) => {
      if (name.contains("HyperMD-callout")) {
        const existingCallout = previousSpecs[index];
        const endQuote = nextQuote(nodes, to);
        const lineStart = tr.state.doc.lineAt(from).number;
        const lineEnd = tr.state.doc.lineAt(endQuote).number;
        if (existingCallout) {
          builder.add(
            from,
            endQuote + 1,
            calloutBlock(
              { from: lineStart, to: lineEnd },
              tr.state.sliceDoc(from, endQuote),
              existingCallout.id
            )
          );
        } else {
          builder.add(
            from,
            endQuote + 1,
            calloutBlock(
              { from: lineStart, to: lineEnd },
              tr.state.sliceDoc(from, endQuote),
              genId()
            )
          );
        }
        index++;
      }
    });
    const dec = builder.finish();
    return dec;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export interface CalloutInfo {
  range: { from: number; to: number };
  readonly text: string;
  readonly id: string;
}

class CalloutWidget extends WidgetType {
  constructor(readonly info: CalloutInfo) {
    super();
  }

  eq(other: WidgetType) {
    return (other as unknown as CalloutWidget).info.id === this.info.id;
  }

  toDOM() {
    const parseTextToCallout = (
      text: string
    ): { icon: string; title: string } => {
      if (!this.info.text) {
        return { icon: "", title: "" };
      }
      const stringArray = text.split("\n");
      const titleRegex = RegExp(/.*\[!(\w*)\]\s(.*)/);
      const title = titleRegex.exec(stringArray[0]);
      if (!title || title.length < 3) {
        return { icon: "", title: "" };
      }
      return {
        icon: title[1],
        title: title[2],
      };
    };
    const callOutData = parseTextToCallout(this.info.text);
    const div = document.createElement("div");
    div.toggleClass("callout", true);
    const divTitle = div.createDiv("div");
    divTitle.toggleClass("callout-title", true);
    const div2 = div.createDiv("div");
    div2.toggleClass("callout-content", true);
    div2.setAttribute("id", "mk-callout-" + this.info.id);
    // loadCalloutByDOM(div2, this.info.id)
    return div;
  }
}

const calloutBlock = (
  range: { from: number; to: number },
  text: string,
  id: string
) =>
  Decoration.widget({
    widget: new CalloutWidget({ range, text, id }),
    block: true,
  });
