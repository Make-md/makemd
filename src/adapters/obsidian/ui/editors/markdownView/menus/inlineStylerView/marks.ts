import {
  Annotation,
  ChangeSpec,
  EditorState,
  Transaction,
  TransactionSpec,
} from "@codemirror/state";
import { TransactionRange } from "adapters/obsidian/types/TransactionRange";
import { iterateTreeAtPos, iterateTreeInSelection } from "adapters/obsidian/utils/codemirror";
import { oMark, oMarks } from "../../obsidianSyntax";

export const toggleMark = Annotation.define<string>();

const trimSpace = (pos: number, moveDirLeft: boolean, state: EditorState) => {
  if (moveDirLeft && state.sliceDoc(pos, pos + 1) == " ") return pos + 1;
  if (!moveDirLeft && state.sliceDoc(pos - 1, pos) == " ") return pos - 1;
  return pos;
};

const newPosAfterFormatting = (
  pos: number,
  moveDirLeft: boolean,
  state: EditorState
) => {
  const line = state.doc.lineAt(pos);
  const start = moveDirLeft ? line.from : pos;
  const end = moveDirLeft ? pos : line.to;
  let newPos = start;
  let lastFormatPos = start;
  const exitFormatRange = false;
  iterateTreeInSelection({ from: start, to: end }, state, {
    enter: (node) => {
      if (exitFormatRange) return false;
      if (node.name.contains("formatting")) {
        if (!moveDirLeft && node.from > start) {
          return false;
        }
        if (moveDirLeft) {
          newPos = node.from;
          lastFormatPos = node.to;
        } else {
          newPos = node.to;
        }
      }
    },
  });
  if (moveDirLeft && lastFormatPos < pos) {
    newPos = pos;
  }
  return newPos;
};

//move position to outside adjacent formatting marks, used for properly detect marked content ranges
export const expandRange = (
  selection: TransactionRange,
  state: EditorState
): TransactionRange => {
  const from = trimSpace(
    newPosAfterFormatting(selection.from, true, state),
    true,
    state
  );
  const to = trimSpace(
    newPosAfterFormatting(selection.to, false, state),
    false,
    state
  );
  return { from, to };
};
export const addMarkAtPos = (pos: number, mark: oMark): TransactionSpec => ({
  changes: { from: pos, to: pos, insert: mark.formatChar },
});

export const rangeIsMark = (
  state: EditorState,
  mark: oMark,
  selection: TransactionRange
): boolean =>
  posIsMark(selection.from, state, mark.mark) &&
  posIsMark(selection.to, state, mark.mark);
const posIsMark = (
  pos: number,
  state: EditorState,
  markString: string
): boolean => {
  let isMark = false;
  iterateTreeAtPos(pos, state, {
    enter: ({ name, from, to }) => {
      if (nodeNameContainsMark(name, markString)) isMark = true;
    },
  });
  return isMark;
};
const nodeNameContainsMark = (name: string, markString: string) => {
  return name.contains(markString);
};
export const edgeIsMark = (pos: number, state: EditorState, mark: oMark) =>
  posIsMark(pos, state, mark.mark);
export const edgeIsMarkFormat = (
  pos: number,
  state: EditorState,
  mark: oMark
) =>
  posIsMark(pos, state, mark.formatting)
    ? true
    : mark.altFormatting
    ? posIsMark(pos, state, mark.altFormatting)
    : false;

export const transactionChangesForMark = (
  range: TransactionRange,
  mark: oMark,
  state: EditorState
) => {
  const newTrans = [];
  if (rangeIsMark(state, mark, range)) {
    if (
      edgeIsMarkFormat(range.from, state, mark) &&
      !edgeIsMarkFormat(range.to, state, mark)
    ) {
      newTrans.push(addMarkAtPos(range.to, mark));
    }
    if (
      edgeIsMarkFormat(range.to, state, mark) &&
      !edgeIsMarkFormat(range.from, state, mark)
    ) {
      newTrans.push(addMarkAtPos(range.from, mark));
    }
  } else if (edgeIsMark(range.from, state, mark)) {
    if (
      edgeIsMarkFormat(range.from, state, mark) &&
      !edgeIsMark(range.from - 1, state, mark)
    ) {
      newTrans.push(addMarkAtPos(range.from, mark));
    }
    newTrans.push(addMarkAtPos(range.to, mark));
  } else if (edgeIsMark(range.to, state, mark)) {
    if (
      edgeIsMarkFormat(range.to, state, mark) &&
      !edgeIsMark(range.to + 1, state, mark)
    ) {
      newTrans.push(addMarkAtPos(range.to, mark));
    }
    newTrans.push(addMarkAtPos(range.from, mark));
  } else {
    newTrans.push(addMarkAtPos(range.to, mark));
    newTrans.push(addMarkAtPos(range.from, mark));
  }
  return newTrans;
};

const removeAllInternalMarks = (
  sel: TransactionRange,
  state: EditorState,
  mark: oMark
): TransactionSpec => {
  const returnTrans: ChangeSpec[] = [];
  iterateTreeInSelection({ from: sel.from, to: sel.to }, state, {
    enter: ({ name, from, to }) => {
      if (
        nodeNameContainsMark(name, mark.formatting) ||
        (mark.altFormatting
          ? nodeNameContainsMark(name, mark.altFormatting)
          : false)
      )
        returnTrans.push({
          from,
          to: from + mark.formatChar.length,
        });
    },
  });
  return {
    changes: returnTrans,
  };
};
export const toggleMarkExtension = EditorState.transactionFilter.of(
  (tr: Transaction) => {
    if (!tr.annotation(toggleMark)) return tr;

    const markToggle = tr.annotation(toggleMark);
    const mark = oMarks.find((f) => f.mark == markToggle);
    if (!mark) {
      return tr;
    }
    const selection = tr.startState.selection.main;
    const newTrans: TransactionSpec[] = [];
    if (selection.head == selection.anchor) {
      if (
        tr.startState.sliceDoc(
          selection.head - mark.formatChar.length,
          selection.head
        ) == mark.formatChar &&
        tr.startState.sliceDoc(
          selection.head,
          selection.head + mark.formatChar.length
        ) == mark.formatChar
      ) {
        newTrans.push({
          changes: {
            from: selection.head - mark.formatChar.length,
            to: selection.head + mark.formatChar.length,
          },
        });
      } else {
        newTrans.push({
          changes: {
            from: selection.head,
            insert: mark.formatChar + mark.formatChar,
          },
          selection: {
            anchor: selection.head + mark.formatChar.length,
            head: selection.head + mark.formatChar.length,
          },
        });
      }
      return [tr, ...newTrans];
    }

    const range = expandRange(selection, tr.startState);

    newTrans.push(removeAllInternalMarks(range, tr.startState, mark));
    const newFrom = range.from;
    const newTo = range.to;

    newTrans.push(...transactionChangesForMark(range, mark, tr.startState));
    return [tr, ...newTrans, { selection: { anchor: newFrom, head: newTo } }];
  }
);
