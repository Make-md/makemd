import { Superstate } from "makemd-core";
import React from "react";
import { BlinkMode } from "../../../../shared/types/blink";
import { BlinkComponent } from "./BlinkComponent";

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
