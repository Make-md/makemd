import { syntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { SyntaxNodeRef } from "@lezer/common";
import { TransactionRange } from "basics/codemirror/TransactionRange";
import { MarkdownView } from "obsidian";
import MakeBasicsPlugin from "./basics";

export const getActiveCM = (plugin: MakeBasicsPlugin): EditorView | undefined => {
  let rcm: EditorView;
  plugin.app.workspace.iterateLeaves((leaf) => {
    const cm = (leaf.view as MarkdownView).editor?.cm;
    if (cm?.hasFocus) {
      rcm = cm;
      return true;
    }
  }, plugin.app.workspace["rootSplit"]!);
  return rcm;
};



export const getActiveMarkdownView = (plugin: MakeBasicsPlugin): MarkdownView | undefined => {
  let rv: MarkdownView;
  plugin.app.workspace.iterateLeaves((leaf) => {
    const cm = (leaf.view as MarkdownView).editor?.cm;
    if (cm?.hasFocus) {
      rv = leaf.view as MarkdownView;
      return true;
    }
  }, plugin.app.workspace["rootSplit"]!);
  return rv;
};


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
