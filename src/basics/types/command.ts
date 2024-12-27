import MakeBasicsPlugin from "basics/basics";

import { Editor, TFile } from "obsidian";

export enum CommandType {
  None,
  Command,
  Section
}

export type Command = {
  label: string;
  value: string;
  offset?: [number, number];
  icon: string;
  type?: CommandType,
  onSelect?: (
    _evt: any,
    plugin: MakeBasicsPlugin,
    file: TFile,
    editor: Editor,
    start: { line: number; ch: number },
    startCh: number,
    end: { line: number; ch: number },
    onComplete: () => void
  ) => void
}
