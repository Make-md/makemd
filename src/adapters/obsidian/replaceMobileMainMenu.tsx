import classNames from "classnames";
import { ScreenType, Warning } from "core/middleware/ui";
import { defaultAddAction } from "core/react/components/UI/Menus/navigator/showSpaceAddMenu";
import {
  NavigatorContext,
  SidebarProvider,
} from "core/react/context/SidebarContext";
import { isTouchScreen } from "core/utils/ui/screen";
import MakeMDPlugin from "main";
import { i18n, Superstate } from "makemd-core";
import React, { useContext, useEffect, useRef } from "react";
import { windowFromDocument } from "utils/dom";

export const replaceMobileMainMenu = (plugin: MakeMDPlugin) => {
  if (isTouchScreen(plugin.superstate.ui)) {
    const header = plugin.app.workspace.containerEl.querySelector(
      ".workspace-drawer.mod-left .workspace-drawer-header-left"
    );
    header.innerHTML = "";
    const reactEl = plugin.superstate.ui.createRoot(header);
    reactEl.render(
      <SidebarProvider superstate={plugin.superstate}>
        <ObsidianMobileMainMenu
          superstate={plugin.superstate}
          plugin={plugin}
        ></ObsidianMobileMainMenu>
      </SidebarProvider>
    );
  }
};

export const ObsidianMobileMainMenu = (props: {
  plugin: MakeMDPlugin;
  superstate: Superstate;
}) => {
  const { superstate } = props;
  const { setActivePath, setDragPaths } = useContext(NavigatorContext);

  const ref = useRef<HTMLDivElement>();
  const [warnings, setWarnings] = React.useState<Warning[]>([]);
  useEffect(() => {
    setTimeout(() => {
      props.superstate.ui
        .getWarnings()
        .filter(
          (f) =>
            !props.superstate.settings.suppressedWarnings.some((g) => f.id == g)
        );
    }, 1000);
  }, []);

  const settingsChanged = () => {
    setWarnings(
      props.superstate.ui
        .getWarnings()
        .filter(
          (f) =>
            !props.superstate.settings.suppressedWarnings.some((g) => f.id == g)
        )
    );
  };
  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "superstateUpdated",
      settingsChanged
    );
    props.superstate.eventsDispatcher.addListener(
      "settingsChanged",
      settingsChanged
    );
    props.superstate.eventsDispatcher.addListener(
      "warningsChanged",
      settingsChanged
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "superstateUpdated",
        settingsChanged
      );
      props.superstate.eventsDispatcher.removeListener(
        "settingsChanged",
        settingsChanged
      );
      props.superstate.eventsDispatcher.removeListener(
        "warningsChanged",
        settingsChanged
      );
    };
  }, []);
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
            {warnings.length > 0 && (
              <div
                className="mk-icon-xsmall"
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//warning"),
                }}
              ></div>
            )}
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
          aria-label={i18n.buttons.newNote}
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
        {props.superstate.ui.getScreenType() == ScreenType.Tablet && (
          <div
            aria-label={i18n.buttons.togglePin}
            className="mk-main-menu-button"
            onClick={(e) => props.plugin.app.workspace.leftSplit.togglePinned()}
          >
            <div
              className="mk-icon-small"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//pin"),
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};
