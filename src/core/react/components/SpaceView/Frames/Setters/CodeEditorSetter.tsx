import { Superstate } from "core/superstate/superstate";
import React from "react";
export const CodeEditorSetter = (props: {
  superstate: Superstate;
  name: string;
  node: string;
  type: string;
  value: string;
  editCode: (node: string, key: string, type: string) => void;
}) => {
  return (
    <div className="mk-setter-code">
      <div
        onClick={() => props.editCode(props.node, props.name, props.type)}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//mk-mark-code"),
        }}
      ></div>
      <div className="mk-setter-code-value">{props.value}</div>
    </div>
  );
};
