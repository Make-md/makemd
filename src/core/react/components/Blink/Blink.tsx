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
  onSelect?: (link: string) => void
) => {
  superstate.ui.openPalette(
    (props: { hide: () => void }) => (
      <BlinkComponent
        superstate={superstate}
        hide={props.hide}
        mode={mode}
        onSelect={onSelect}
      ></BlinkComponent>
    ),
    win,
    "mk-blink-modal"
  );
};
