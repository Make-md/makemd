import { Superstate } from "core/superstate/superstate";
import React from "react";
import { BlinkComponent } from "./BlinkComponent";

export enum BlinkMode {
  Search,
  Blink,
  Open,
  Command,
}

export const openBlinkModal = (
  superstate: Superstate,
  mode: BlinkMode,
  win: Window,
  onSelect?: (link: string) => void,
  parentSpace?: string
) => {
  superstate.ui.openPalette(
    <BlinkComponent
      superstate={superstate}
      mode={mode}
      onSelect={onSelect}
      parentSpace={parentSpace}
    ></BlinkComponent>,
    win,
    "mk-blink-modal"
  );
};
