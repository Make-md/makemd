import { Superstate } from "makemd-core";
import React from "react";

export const ToggleSetter = (props: {
  superstate: Superstate;
  name: string;
  setValue: (value: string) => void;
  defaultValue: string;
  onValue: string;
  value: string;
  icon: string;
}) => {
  return (
    <div
      aria-label={props.name}
      className={`mk-editor-frame-node-button ${
        props.value == props.onValue ? "mk-active" : ""
      }`}
      onClick={(e) =>
        props.value == props.onValue
          ? props.setValue(props.defaultValue)
          : props.setValue(props.onValue)
      }
      dangerouslySetInnerHTML={{
        __html: props.superstate.ui.getSticker(props.icon),
      }}
    ></div>
  );
};
