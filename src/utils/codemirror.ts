import { syntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { SyntaxNodeRef } from "@lezer/common";
import { MarkdownView } from "obsidian";
import { TransactionRange } from "types/types";

export const getActiveCM = (): EditorView | undefined => {
  let rcm: EditorView;
  app.workspace.iterateLeaves((leaf) => {
    const cm = (leaf.view as MarkdownView).editor?.cm;
    if (cm?.hasFocus) {
      rcm = cm;
      return true;
    }
  }, app.workspace["rootSplit"]!);
  return rcm;
};

export const getFilePathForCM = (cmView: EditorView): string | undefined => {
  let rs: string;
  app.workspace.iterateLeaves((leaf) => {
    const cm = (leaf.view as MarkdownView).editor?.cm;
    if (cm == cmView) {
      rs = (leaf.view as MarkdownView).file.path;
      return true;
    }
  }, app.workspace["rootSplit"]!);
  return rs;
};

export const getActiveMarkdownView = (): MarkdownView | undefined => {
  let rv: MarkdownView;
  app.workspace.iterateLeaves((leaf) => {
    const cm = (leaf.view as MarkdownView).editor?.cm;
    if (cm?.hasFocus) {
      rv = leaf.view as MarkdownView;
      return true;
    }
  }, app.workspace["rootSplit"]!);
  return rv;
};

export function iterateTreeInVisibleRanges(
  view: EditorView,
  iterateFns: {
    enter(node: SyntaxNodeRef): boolean | void;
    leave?(node: SyntaxNodeRef): void;
  }
) {
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({ ...iterateFns, from, to });
  }
}

//optimize with resolve later...
export function iterateTreeAtPos(
  pos: number,
  state: EditorState,
  iterateFns: {
    enter(node: SyntaxNodeRef): boolean | void;
    leave?(node: SyntaxNodeRef): void;
  }
) {
  syntaxTree(state).iterate({ ...iterateFns, from: pos, to: pos });
}

export function iterateTreeInSelection(
  selection: TransactionRange,
  state: EditorState,
  iterateFns: {
    enter(node: SyntaxNodeRef): boolean | void;
    leave?(node: SyntaxNodeRef): void;
  }
) {
  syntaxTree(state).iterate({
    ...iterateFns,
    from: selection.from,
    to: selection.to,
  });
}

export function iterateTreeInDocument(
  state: EditorState,
  iterateFns: {
    enter(node: SyntaxNodeRef): boolean | void;
    leave?(node: SyntaxNodeRef): void;
  }
) {
  syntaxTree(state).iterate({ ...iterateFns });
}

export function checkRangeOverlap(
  range1: [number, number],
  range2: [number, number]
) {
  return range1[0] <= range2[1] && range2[0] <= range1[1];
}
