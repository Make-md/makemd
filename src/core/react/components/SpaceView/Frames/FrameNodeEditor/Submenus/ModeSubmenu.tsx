import { i18n } from "makemd-core";
import React from "react";
import { ToggleSetter } from "../../Setters/ToggleSetter";
import { HoverSubmenuProps } from "./HoverSubmenuProps";

export const ModeSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue } = props;

  return (
    <>
      <ToggleSetter
        superstate={props.superstate}
        name={i18n.editor.minimize}
        value={selectedNode.styles?.["--mk-min-mode"]}
        defaultValue={"false"}
        onValue={"true"}
        icon={"ui//panel-top-close"}
        setValue={(value) => saveStyleValue("--mk-min-mode", value)}
      ></ToggleSetter>
    </>
  );
};
