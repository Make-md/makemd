import { default as i18n, default as t } from "i18n";
import React from "react";
import { PathTypes } from "types/types";
import { uiIconSet } from "utils/icons";
export const FlowEditorHover = (props: {
  type: PathTypes;
  path: string;
  toggle: boolean;
  toggleState: boolean;
  toggleFlow?: (e: React.MouseEvent) => void;
  openLink?: (e: React.MouseEvent) => void;
  convertTable?: () => void;
  cutTable?: () => void;
  deleteTable?: () => void;
}) => {
  return (
    <div className="mk-flowblock-menu">
      {props.type == "file" ? (
        <>
          {props.toggle && (
            <div
              aria-label={t.buttons.toggleFlow}
              onClick={props.toggleFlow}
              className={`mk-hover-button ${
                props.toggleState ? "mk-toggle-on" : ""
              }`}
              dangerouslySetInnerHTML={{
                __html: uiIconSet["mk-ui-flow-hover"],
              }}
            ></div>
          )}
          <div
            aria-label={t.buttons.openLink}
            onClick={props.openLink}
            className="mk-hover-button"
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-open-link"] }}
          ></div>
        </>
      ) : (
        <>
          <div
            aria-label={i18n.buttons.convertTable}
            onClick={props.convertTable}
            className={"mk-icon-xsmall mk-hover-button"}
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-sync"] }}
          ></div>
          <div
            aria-label={i18n.buttons.cutTable}
            onClick={props.cutTable}
            className={"mk-icon-xsmall mk-hover-button"}
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-cut"] }}
          ></div>
          <div
            aria-label={i18n.buttons.deleteTable}
            onClick={props.deleteTable}
            className={"mk-icon-xsmall mk-hover-button"}
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-close"] }}
          ></div>
        </>
      )}{" "}
    </div>
  );
};
