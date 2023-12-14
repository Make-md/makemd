import { Superstate } from "core/superstate/superstate";
import React from "react";
import BlinkComponent from "./BlinkComponent";

export const openBlinkModal = (superstate: Superstate) => {
  superstate.ui.openPalette(
    (props: { hide: () => void; ref: any }) => (
      <BlinkComponent
        superstate={superstate}
        hide={props.hide}
        ref={props.ref}
      ></BlinkComponent>
    ),
    "mk-blink-modal"
  );
};
