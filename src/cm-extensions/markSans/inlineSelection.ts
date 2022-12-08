import {
  Range,
  EditorState,
  Transaction,
  EditorSelection,
  TransactionSpec,
  StateField,
  RangeSetBuilder,
} from "@codemirror/state";
import {
  expandRange,
  rangeIsMark,
  transactionChangesForMark,
} from "cm-extensions/inlineStylerView/marks";
import { TransactionRange } from "types/types";
import {
  checkRangeOverlap,
  iterateTreeAtPos,
  iterateTreeInDocument,
  iterateTreeInSelection,
  iterateTreeInVisibleRanges,
} from "utils/codemirror";
import { oMarks } from "./obsidianSyntax";

export const inlineMakerDelete = EditorState.transactionFilter.of(
  (tr: Transaction) => {
    let newTrans = [] as TransactionSpec[];

    if (
      !tr.isUserEvent("delete") ||
      (!tr.isUserEvent("input") &&
        tr.startState.selection.main.from != tr.startState.selection.main.to)
    ) {
      return tr;
    }

    const changes = tr.changes;

    changes.iterChanges((fromA, fromB, toA, toB, inserted) => {
      const minFrom = Math.min(fromA, toA);
      const maxTo = Math.max(fromA, toA);
      const expandedRange = expandRange(
        { from: minFrom, to: maxTo },
        tr.startState
      );
      let activeMarks = oMarks.filter((f) =>
        rangeIsMark(tr.startState, f, expandedRange)
      );

      const transactions = activeMarks.map((m) =>
        transactionChangesForMark(expandedRange, m, tr.startState)
      );

      newTrans.push({
        changes: {
          from: expandedRange.from,
          to: expandedRange.to,
          insert: inserted,
        },
      });
      newTrans.push(...transactions.reduce((p, c) => [...p, ...c], []));

      return newTrans;
    });

    return [tr, ...newTrans];
  }
);

const reverseSel = (t: TransactionRange): TransactionRange => {
  return {
    from: t.to,
    to: t.from,
  };
};

const selFromTo = (from: number, to: number): TransactionRange => {
  return { from: from, to: to };
};

const pointSelection = (
  from: number,
  to: number,
  markLeft: boolean,
  pos: number,
  posDiff: number,
  userSelect: boolean
): TransactionRange | undefined => {
  return checkLeftOfMark(from, pos)
    ? undefined
    : checkMarkMiddle(from, to, pos)
    ? (markLeft && posDiff >= 1) ||
      (!markLeft && (posDiff != -1 || (posDiff == -1 && !userSelect)))
      ? selectBeforeMark(from, pos)
      : selectAfterMark(to + 1)
    : undefined;
};

const checkLeftOfMark = (from: number, pos: number): boolean => from == pos;
const checkMarkMiddle = (from: number, to: number, pos: number): boolean =>
  pos > from && pos <= to;
const selectBeforeMark = (from: number, pos: number): TransactionRange =>
  selFromTo(from, from);
const selectAfterMark = (to: number): TransactionRange => selFromTo(to, to);

const inlinePositionMarkOffset = (
  typeString: string,
  from: number,
  to: number,
  state: EditorState
): { from: number; to: number; left: boolean; node: string } | undefined => {
  const checkLeft = (
    from: number,
    to: number,
    formatString: string
  ): boolean => {
    let left = true;
    iterateTreeInSelection({ from: from - 2, to: to + 2 }, state, {
      enter: (node) => {
        if (
          node.name.contains(formatString) &&
          !node.name.contains("formatting-" + formatString)
        ) {
          if (node.from < from) {
            left = false;
          }
          if (node.to > to) {
            left = true;
          }
        }
      },
    });
    return left;
  };

  if (
    typeString.contains("formatting-em") &&
    !typeString.contains("formatting-embed")
  ) {
    return { from, to, left: checkLeft(from, to, "em"), node: "em" };
  }
  if (typeString.contains("formatting-strong")) {
    return { from, to, left: checkLeft(from, to, "strong"), node: "strong" };
  }
  if (typeString.contains("formatting-strikethrough")) {
    return {
      from,
      to,
      left: checkLeft(from, to, "strikethrough"),
      node: "strikethrough",
    };
  }

  if (typeString.contains("formatting-code")) {
    if (!typeString.contains("hmd-codeblock")) {
      return {
        from,
        to,
        left: checkLeft(from, to, "inline-code"),
        node: "inline-code",
      };
    }
    // return {from: from, to, left: checkLeft(from, to, 'HyperMD-codeblock')}
  }

  return undefined;
};

export const inlineMakerSelect = EditorState.transactionFilter.of(
  (tr: Transaction) => {
    let newTrans: TransactionSpec[] = [];
    if (!tr.isUserEvent("select")) {
      return tr;
    }
    const selection = tr.newSelection.main;
    let lineNodes: { type: string; from: number; to: number }[] = [];
    const minFrom = Math.min(selection.from, selection.to);
    const maxTo = Math.max(selection.from, selection.to);
    if (minFrom != maxTo) {
      const newRange = expandRange({ from: minFrom, to: maxTo }, tr.state);
      const fixedRange =
        minFrom == selection.anchor ? newRange : reverseSel(newRange);
      newTrans.push({
        selection: { anchor: fixedRange.from, head: fixedRange.to },
      });
    } else {
      iterateTreeInSelection(
        {
          from: tr.state.doc.lineAt(minFrom).from,
          to: tr.state.doc.lineAt(maxTo).to,
        },
        tr.state,
        {
          enter: ({ type, from, to }) => {
            lineNodes.push({ type: type.name, from, to });
          },
        }
      );
      const fixSel = (
        oldSel: TransactionRange | undefined,
        anchor: number
      ): TransactionRange | undefined => {
        let mark: { from: number; to: number; left: boolean; node: string };
        let newSel: TransactionRange;
        const head = oldSel.from == anchor ? oldSel.to : oldSel.from;
        for (let node of lineNodes) {
          if (node.from <= head && node.to >= head) {
            mark = inlinePositionMarkOffset(
              node.type,
              node.from,
              node.to,
              tr.state
            );
            if (mark) break;
          }
        }
        if (mark) {
          newSel = pointSelection(
            mark.from,
            mark.to,
            mark.left,
            oldSel.from,
            tr.startState.selection.main.from - selection.from,
            tr.isUserEvent("select")
          );
        }
        if (!newSel || (newSel.from == oldSel.from && newSel.to == oldSel.to)) {
          if (oldSel.to == anchor) return reverseSel(oldSel);
          return oldSel;
        }
        return fixSel(newSel, anchor);
      };

      const selChange = fixSel({ from: minFrom, to: maxTo }, selection.anchor);

      if (selChange) {
        newTrans.push({
          selection: { anchor: selChange.from, head: selChange.to },
        });
      }
    }
    return [tr, ...newTrans];
  }
);
