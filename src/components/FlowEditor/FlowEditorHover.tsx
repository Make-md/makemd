import React from "react";
import t from "i18n";
import { uiIconSet } from "utils/icons";
export const FlowEditorHover = (props: {
  toggle: boolean;
  toggleState: boolean;
  toggleFlow: (e: React.MouseEvent) => void;
  openLink: (e: React.MouseEvent) => void;
}) => {
  return (
    <>
      {props.toggle && (
        <div
          aria-label={t.buttons.toggleFlow}
          onClick={props.toggleFlow}
          className={props.toggleState ? "mk-toggle-on" : ""}
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-flow-hover"] }}
        ></div>
      )}
      <div
        aria-label={t.buttons.openLink}
        onClick={props.openLink}
        dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-open-link"] }}
      ></div>
    </>
  );
};
