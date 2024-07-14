import classNames from "classnames";

import { default as t } from "core/i18n";
import { NavigatorContext } from "core/react/context/SidebarContext";
import { Superstate } from "core/superstate/superstate";
import React, { useContext, useRef } from "react";
import { windowFromDocument } from "utils/dom";
import { defaultAddAction } from "../UI/Menus/navigator/showSpaceAddMenu";
interface MainMenuComponentProps {
  superstate: Superstate;
}
export const MainMenu = (props: MainMenuComponentProps) => {
  const { superstate } = props;
  const { setActivePath, setDragPaths } = useContext(NavigatorContext);

  const ref = useRef<HTMLDivElement>();

  return (
    <div className="mk-main-menu-container">
      <div className="mk-main-menu-inner">
        <div className={classNames("mk-main-menu")}>
          <div
            className={`mk-main-menu-button mk-main-menu-button-primary`}
            ref={ref}
            onClick={(e) => {
              props.superstate.ui.mainMenu(ref.current, superstate);
            }}
          >
            {props.superstate.settings.systemName}

            <div
              className="mk-icon-xsmall"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//chevrons-up-down"),
              }}
            ></div>
          </div>

          <div
            className="mk-main-menu-button"
            onClick={(e) => props.superstate.ui.quickOpen(superstate)}
          >
            <div
              className="mk-icon-small"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//search"),
              }}
            ></div>
          </div>
        </div>

        <button
          aria-label={t.buttons.newNote}
          className="mk-main-menu-button"
          onClick={(e) =>
            defaultAddAction(
              superstate,
              null,
              windowFromDocument(e.view.document),
              e.metaKey ? "tab" : false
            )
          }
        >
          <div
            className="mk-icon-small"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//new-note"),
            }}
          ></div>
        </button>
      </div>
    </div>
  );
};
