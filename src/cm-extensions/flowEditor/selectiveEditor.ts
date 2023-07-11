import {
  Annotation,
  EditorState,
  RangeSetBuilder,
  StateField,
  Transaction
} from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import { getAvailableRanges } from "range-analyzer";

type ContentRangeType  = [number | undefined, number | undefined];


const combinedRangeFacets = (rangeA: ContentRangeType, rangeB: ContentRangeType ) : [number, number] => {
  const startRange = !rangeA?.[0] ? rangeB[0] : !rangeB?.[0] ? rangeA[0] : Math.max(rangeA?.[0], rangeB?.[0])
  const endRange = !rangeA?.[1] ? rangeB[1] : !rangeB?.[1] ? rangeA[1] : Math.min(rangeA?.[1], rangeB?.[1])
  return [isNaN(startRange) ? null : startRange, isNaN(endRange) ? null : endRange]
}

export const editableRange =
  Annotation.define<ContentRangeType>();
  export const contentRange =
  Annotation.define<ContentRangeType>();
export const hiddenLine = Decoration.replace({ inclusive: true, block: true });

//partial note editor

export const hideLine = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    let builder = new RangeSetBuilder<Decoration>();
    const betterFacet = combinedRangeFacets(tr.state.field(selectiveLinesFacet, false), tr.state.field(frontmatterFacet, false));
    if (betterFacet?.[0] != null) {
      const starterLine = Math.min(
        tr.state.doc.lines,
        betterFacet[0]
      );
      builder.add(
        tr.state.doc.line(1).from,
        tr.state.doc.line(starterLine).from-1,
        hiddenLine
      );
      if (tr.newDoc.lines != betterFacet[1])
      builder.add(
        tr.state.doc.line(
          Math.min(tr.newDoc.lines, betterFacet[1])
        ).to,
        tr.state.doc.line(tr.newDoc.lines).to,
        hiddenLine
      );
    }
    const dec = builder.finish();
    return dec;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export const frontmatterFacet = StateField.define<
  [number | undefined, number | undefined]
>({
  create: () => [undefined, undefined],
  update(value, tr) {
    if (tr.annotation(contentRange)) {
      if (tr.annotation(contentRange)[0]) {
        return [
          tr.annotation(contentRange)[0],
          Math.min(tr.state.doc.lines, tr.annotation(contentRange)[1]),
        ];
      }
      return tr.annotation(contentRange);
    }
    return value;
  },
});

export const selectiveLinesFacet = StateField.define<
  [number | undefined, number | undefined]
>({
  create: () => [undefined, undefined],
  update(value, tr) {
    if (tr.annotation(editableRange)) {
      if (tr.annotation(editableRange)[0]) {
        return [
          tr.annotation(editableRange)[0],
          Math.min(tr.state.doc.lines, tr.annotation(editableRange)[1]),
        ];
      }
      return tr.annotation(editableRange);
    }
    return value;
  },
});

export const lineRangeToPosRange = (
  state: EditorState,
  range: [number, number]
) => {
  return {
    from: state.doc.line(range[0]).from,
    to: state.doc.line(Math.min(state.doc.lines, range[1])).to,
  };
};


export const smartDelete = EditorState.transactionFilter.of(
  (tr: Transaction) => {

    if (tr.isUserEvent("delete") && !tr.annotation(Transaction.userEvent).endsWith('.smart')) {
      const initialSelections = tr.startState.selection.ranges.map((range) => ({
        from: range.from,
        to: range.to,
      }));
      
      const betterFacet = combinedRangeFacets(tr.startState.field(selectiveLinesFacet, false), tr.startState.field(frontmatterFacet, false));
      if (
        initialSelections.length > 0 &&
        betterFacet?.[0]
      ) {
        const posRange = lineRangeToPosRange(
          tr.startState,
          betterFacet
        );
        if (tr.changes.touchesRange(0, posRange.from-1)) {
          const minFrom = Math.max(posRange.from, initialSelections[0].from);
          const minTo = Math.min(posRange.to, initialSelections[0].to);
          return [{
            changes: {
              from: Math.min(minFrom, minTo),
              to: Math.max(minFrom, minTo),
            },
            annotations: Transaction.userEvent.of(
              `${tr.annotation(Transaction.userEvent)}.smart`
            ),
          }];
        }
        
      }
    }
    return tr;
  }
);

export const preventModifyTargetRanges = EditorState.transactionFilter.of(
  (tr: Transaction) => {
    let newTrans = [];
    try {
      const editableLines = tr.startState.field(selectiveLinesFacet, false)
      const contentLines = tr.startState.field(frontmatterFacet, false)
      const selectiveLines = combinedRangeFacets(editableLines, contentLines);

      if (
        tr.isUserEvent("input") ||
        tr.isUserEvent("delete") ||
        tr.isUserEvent("move")
      ) {
        if (selectiveLines?.[0]) {
          const posRange = lineRangeToPosRange(
            tr.startState,
            selectiveLines
          );
          if (
            !tr.changes.touchesRange(posRange.from, posRange.to)
          ) {
            return [];
          }
        }
      }
      if (tr.state.doc.lines != tr.startState.doc.lines) {
        const numberNewLines = tr.state.doc.lines - tr.startState.doc.lines;
        if (selectiveLines?.[0]) {
          const posRange = lineRangeToPosRange(
            tr.startState,
            selectiveLines
          );
          if (tr.changes.touchesRange(0, posRange.from - 1)) {
            const newAnnotations = [];
            if (editableLines[0]) {
              newAnnotations.push(editableRange.of([
                editableLines[0] + numberNewLines,
                editableLines[1] + numberNewLines,
              ]))
              
            }
            if (contentLines[0]) {
              newAnnotations.push(contentRange.of([
                contentLines[0] + numberNewLines,
                contentLines[1] + numberNewLines,
              ]))
              
            }
            newTrans.push({
              annotations: newAnnotations,
            });
            
          } else if (tr.changes.touchesRange(posRange.from - 1, posRange.to)) {
            const newAnnotations = [];
            if (editableLines[0]) {
              newAnnotations.push(editableRange.of([
                editableLines[0],
                editableLines[1] + numberNewLines,
              ]))
              
            }
            if (contentLines[0]) {
              newAnnotations.push(contentRange.of([
                contentLines[0],
                contentLines[1] + numberNewLines,
              ]))
              
            }
            newTrans.push({
              annotations: newAnnotations,
            });
          }
        }
      }
    } catch (e) {
      return [];
    }
    return [tr, ...newTrans];
  }
);

export const smartPaste = (
  getReadOnlyRanges: (
    targetState: EditorState
  ) => Array<{ from: number | undefined; to: number | undefined }>
) =>
  EditorView.domEventHandlers({
    paste(event, view) {
      const clipboardData =
        event.clipboardData || (window as any).clipboardData;
      const pastedData = clipboardData.getData("Text");
      const initialSelections = view.state.selection.ranges.map((range) => ({
        from: range.from,
        to: range.to,
      }));

      if (initialSelections.length > 0) {
        const readOnlyRanges = getReadOnlyRanges(view.state);
        const result = getAvailableRanges(
          readOnlyRanges,
          initialSelections[0],
          { from: 0, to: view.state.doc.line(view.state.doc.lines).to }
        ) as Array<{ from: number; to: number }>;
        if (result.length > 0) {
          view.dispatch({
            changes: {
              from: result[0].from,
              to: result[0].to,
              insert: pastedData,
            },
            annotations: Transaction.userEvent.of(`input.paste.smart`),
          });
        }
      }
    },
  });

const readOnlyRangesExtension = [smartDelete, preventModifyTargetRanges];
export const editBlockExtensions = () => [
  readOnlyRangesExtension,
  hideLine,
  selectiveLinesFacet,
  frontmatterFacet
];
export default readOnlyRangesExtension;
