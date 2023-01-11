import React from "react";
import t from "i18n";
import { uiIconSet } from "utils/icons";
import i18n from "i18n";
export const FlowEditorHover = (props: {
  type: "file" | "table";
  toggle: boolean;
  toggleState: boolean;
  toggleFlow?: (e: React.MouseEvent) => void;
  openLink?: (e: React.MouseEvent) => void;
  cutTable?: () => void;
  deleteTable?: () => void;
}) => {
  return props.type == "file" ? (
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
  ) : (
    <>
    <div
      aria-label={i18n.buttons.cutTable}
      onClick={props.cutTable}
      className={"mk-icon-xsmall"}
      dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-cut"] }}
    ></div>
    <div
      aria-label={i18n.buttons.deleteTable}
      onClick={props.deleteTable}
      className={"mk-icon-xsmall"}
      dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-close"] }}
    ></div>
    </>
  );
};
