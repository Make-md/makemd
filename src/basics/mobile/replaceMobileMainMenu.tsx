import classNames from "classnames";
import { uiIconSet } from "core/assets/icons";
import { Warning } from "core/middleware/ui";
import { defaultAddAction } from "core/react/components/UI/Menus/navigator/showSpaceAddMenu";
import { i18n } from "makemd-core";
import { Platform } from "obsidian";
import React, { useEffect, useRef } from "react";
import { windowFromDocument } from "utils/dom";
import MakeBasicsPlugin from "../basics";

export const replaceMobileMainMenu = (plugin: MakeBasicsPlugin) => {
  if (plugin.isTouchScreen()) {
    const header = plugin.app.workspace.containerEl.querySelector(
      plugin.superstate.settings.spacesRightSplit
        ? ".workspace-drawer.mod-right .workspace-drawer-header-left"
        : ".workspace-drawer.mod-left .workspace-drawer-header-left"
    );
    header.innerHTML = "";
    const reactEl = plugin.createRoot(header);
    reactEl.render(
      <ObsidianMobileMainMenu plugin={plugin}></ObsidianMobileMainMenu>
    );
  }
};

export const ObsidianMobileMainMenu = (props: { plugin: MakeBasicsPlugin }) => {
  const ref = useRef<HTMLDivElement>();
  const [warnings, setWarnings] = React.useState<Warning[]>([]);
  useEffect(() => {
    setTimeout(() => {
      props.plugin.superstate.ui
        .getWarnings()
        .filter(
          (f) =>
            !props.plugin.superstate.settings.suppressedWarnings.some(
              (g) => f.id == g
            )
        );
    }, 1000);
  }, []);

  const settingsChanged = () => {
    setWarnings(
      props.plugin.superstate.ui
        .getWarnings()
        .filter(
          (f) =>
            !props.plugin.superstate.settings.suppressedWarnings.some(
              (g) => f.id == g
            )
        )
    );
  };
  useEffect(() => {
    props.plugin.superstate.eventsDispatcher.addListener(
      "superstateUpdated",
      settingsChanged
    );
    props.plugin.superstate.eventsDispatcher.addListener(
      "settingsChanged",
      settingsChanged
    );
    props.plugin.superstate.eventsDispatcher.addListener(
      "warningsChanged",
      settingsChanged
    );
    return () => {
      props.plugin.superstate.eventsDispatcher.removeListener(
        "superstateUpdated",
        settingsChanged
      );
      props.plugin.superstate.eventsDispatcher.removeListener(
        "settingsChanged",
        settingsChanged
      );
      props.plugin.superstate.eventsDispatcher.removeListener(
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
              props.plugin.superstate.ui.mainMenu(
                ref.current,
                props.plugin.superstate
              );
            }}
          >
            {props.plugin.superstate.settings.systemName}
            {warnings.length > 0 && (
              <div
                className="mk-icon-xsmall"
                dangerouslySetInnerHTML={{
                  __html: uiIconSet["warning"],
                }}
              ></div>
            )}
            <div
              className="mk-icon-xsmall"
              dangerouslySetInnerHTML={{
                __html: uiIconSet["chevrons-up-down"],
              }}
            ></div>
          </div>

          <div
            className="mk-main-menu-button"
            onClick={(e) =>
              props.plugin.superstate.ui.quickOpen(props.plugin.superstate)
            }
          >
            <div
              className="mk-icon-small"
              dangerouslySetInnerHTML={{
                __html: uiIconSet["search"],
              }}
            ></div>
          </div>
        </div>

        <button
          aria-label={i18n.buttons.newNote}
          className="mk-main-menu-button"
          onClick={(e) =>
            defaultAddAction(
              props.plugin.superstate,
              null,
              windowFromDocument(e.view.document),
              e.metaKey ? "tab" : false
            )
          }
        >
          <div
            className="mk-icon-small"
            dangerouslySetInnerHTML={{
              __html: uiIconSet["new-note"],
            }}
          ></div>
        </button>
        {Platform.isTablet && (
          <div
            aria-label={i18n.buttons.togglePin}
            className="mk-main-menu-button"
            onClick={(e) =>
              props.plugin.superstate.settings.spacesRightSplit
                ? props.plugin.app.workspace.rightSplit.togglePinned()
                : props.plugin.app.workspace.leftSplit.togglePinned()
            }
          >
            <div
              className="mk-icon-small"
              dangerouslySetInnerHTML={{
                __html: uiIconSet["pin"],
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};
