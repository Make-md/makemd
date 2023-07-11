import {
  EditorSelection,
  EditorState,
  Transaction,
  TransactionSpec,
} from "@codemirror/state";
import { iterateTreeInSelection } from "utils/codemirror";
import { hrResetFix } from "./hr";

export const makerDelete = EditorState.transactionFilter.of(
  (tr: Transaction) => {
    let newTrans = [] as TransactionSpec[];

    if (tr.isUserEvent("delete.forward")) {
    }

    if (
      tr.isUserEvent("delete.backward") &&
      !tr.isUserEvent("delete.selection") &&
      !tr.isUserEvent("delete.selection.smart")
    ) {
      const selection = tr.newSelection.main;
      iterateTreeInSelection(selection, tr.startState, {
        enter: ({ type, from, to }) => {
          const mark = positionMarkOffset(type.name, from, to, tr.startState);

          if (mark) {
            if (!hasReset(tr.startState, from, to)) {
              newTrans.push(
                pointDeletion(tr, mark.from, mark.to, selection.from)
              );
            }
          }
        },
      });
    }
    return [tr, ...newTrans];
  }
);

const reverseSel = (t: TransactionSpec) => {
  const sel = t.selection as EditorSelection;
  return { selection: EditorSelection.single(sel.main.head, sel.main.anchor) };
};

const selFromTo = (from: number, to: number) => {
  return { selection: EditorSelection.single(from, to) };
};
const delFromTo = (tr: Transaction, from: number, to: number) => {
  return {
    changes: { from, to },
    annotations: Transaction.userEvent.of(
      `${tr.annotation(Transaction.userEvent)}.smart`
    ),
  };
};
const pointDeletion = (
  tr: Transaction,
  from: number,
  to: number,
  pos: number
): TransactionSpec =>
  checkMarkMiddle(from, to, pos) ? deleteMark(tr, from, pos) : null;
const deleteMark = (
  tr: Transaction,
  from: number,
  pos: number
): TransactionSpec =>
  from == 0 ? delFromTo(tr, from, pos) : delFromTo(tr, from, pos);
const changeSelectionToPrevLine = (
  from: number,
  head: number
): TransactionSpec => selFromTo(from, head);
const changeSelectionToEndPrevLine = (
  from: number,
  head: number
): TransactionSpec => selFromTo(from, head - 1);
const changeSelectionToAfterMark = (
  head: number,
  to: number
): TransactionSpec => selFromTo(head, to);
const changeSelectionToMark = (to: number, head: number): TransactionSpec =>
  selFromTo(to, head);
const rangeBeginsInMark = (from: number, to: number, pos: number): boolean =>
  pos >= from && pos < to;
const rangeEndsAtMark = (from: number, to: number, pos: number): boolean =>
  pos == from;
const rangeBeginsBefore = (
  from: number,
  to: number,
  anchor: number,
  head: number
): boolean => head == from - 1;
const pointSelection = (
  from: number,
  to: number,
  pos: number,
  left: boolean
): TransactionSpec =>
  checkLineStart(from, pos)
    ? to - from == 1 && left
      ? selectPreviousLine(from, pos)
      : selectLineStart(to)
    : checkMarkMiddle(from, to, pos)
    ? left && checkMarkMiddleRightMost(from, to, pos)
      ? selectPreviousLine(from, pos)
      : selectLineStart(to)
    : null;

const checkLineStart = (from: number, pos: number): boolean => from == pos;
const checkMarkMiddle = (from: number, to: number, pos: number): boolean =>
  pos > from && pos < to;
const checkMarkMiddleRightMost = (
  from: number,
  to: number,
  pos: number
): boolean => pos == to - 1;
const selectPreviousLine = (from: number, pos: number): TransactionSpec =>
  from == 0 ? selFromTo(pos, pos) : selFromTo(from - 1, from - 1);
const selectLineStart = (to: number): TransactionSpec => selFromTo(to, to);

const positionMarkOffset = (
  typeString: string,
  from: number,
  to: number,
  state: EditorState
): { from: number; to: number } | undefined => {
  if (typeString.contains("HyperMD-header")) {
    return {
      from,
      to:
        from +
        parseInt(typeString.replace(/.*HyperMD-header-(\d+).*/, "$1")) +
        1,
    };
  }
  if (typeString.contains("HyperMD-task-line")) {
    return {
      from,
      to:
        from +
        parseInt(typeString.replace(/.*HyperMD-list-line-(\d+).*/, "$1")) +
        5,
    };
  }
  if (typeString.contains("formatting-list-ol")) {
    let returnMark = undefined;
    iterateTreeInSelection({ from: from, to: to }, state, {
      enter: ({ type, from, to }) => {
        if (type.name.contains("HyperMD-list-line")) {
          returnMark = {
            from,
            to:
              from +
              parseInt(type.name.replace(/.*HyperMD-list-line-(\d+).*/, "$1")) +
              2,
          };
        }
      },
    });
    return returnMark;
  }
  if (typeString.contains("HyperMD-list-line")) {
    return {
      from,
      to:
        from +
        parseInt(typeString.replace(/.*HyperMD-list-line-(\d+).*/, "$1")) +
        1,
    };
  }
  if (
    typeString.contains("HyperMD-quote") &&
    !typeString.contains("HyperMD-quote-lazy")
  ) {
    return { from, to: from + 1 };
  }

  return undefined;
};
const rangeSelection = (
  from: number,
  to: number,
  anchor: number,
  head: number
): TransactionSpec => {
  const minFrom = Math.min(anchor, head);
  const maxTo = Math.max(anchor, head);

  /*if (rangeBeginsBefore(from, to, maxTo, minFrom)) {
			const newSel = changeSelectionToMark(to, maxTo);
			return minFrom == head ? newSel : reverseSel(newSel);
		}*/
  if (rangeEndsAtMark(from, to, maxTo)) {
    const newSel = changeSelectionToAfterMark(minFrom, to);
    return minFrom == anchor ? newSel : reverseSel(newSel);
  }
  if (rangeBeginsInMark(from, to, maxTo)) {
    const newSel = changeSelectionToEndPrevLine(minFrom, from);
    return minFrom == anchor ? newSel : reverseSel(newSel);
  }
  if (rangeBeginsInMark(from, to, minFrom)) {
    const newSel = changeSelectionToMark(to, maxTo);
    return minFrom == head ? newSel : reverseSel(newSel);
  }
  return null;
};

const hasReset = (state: EditorState, from: number, to: number): boolean => {
  let trueFalse = false;
  state.field(hrResetFix, false)?.between(from, to, (f, t, v) => {
    trueFalse = true;
  });
  return trueFalse;
};

export const makerSelect = EditorState.transactionFilter.of(
  (tr: Transaction) => {
    let newTrans = [] as TransactionSpec[];
    if (tr.isUserEvent("delete") || tr.isUserEvent("input")) {
      return tr;
    }
    const selection = tr.newSelection.main;
    if (selection.from == 0 && selection.to == 0) return tr;
    iterateTreeInSelection(selection, tr.state, {
      enter: ({ type, from, to }) => {
        const mark = positionMarkOffset(type.name, from, to, tr.state);

        if (mark) {
          if (!hasReset(tr.state, from, to)) {
            const newSel =
              selection.from != selection.to
                ? rangeSelection(
                    mark.from,
                    mark.to,
                    selection.from,
                    selection.to
                  )
                : pointSelection(
                    mark.from,
                    mark.to,
                    selection.from,
                    tr.startState.selection.main.from == selection.from + 1
                  );
            if (newSel) newTrans.push(newSel);
          }
        }
      },
    });
    //   return tr;
    return [tr, ...newTrans];
  }
);
