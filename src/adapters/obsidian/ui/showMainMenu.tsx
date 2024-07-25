import {
  defaultMenu,
  menuSeparator,
} from "core/react/components/UI/Menus/menu/SelectionMenu";
import { HiddenPaths } from "core/react/components/UI/Modals/HiddenFiles";
import { InputModal } from "core/react/components/UI/Modals/InputModal";
import { isTouchScreen } from "core/utils/ui/screen";
import { SelectOption, Superstate, i18n } from "makemd-core";
import { App, WorkspaceLeaf, WorkspaceMobileDrawer } from "obsidian";
import React from "react";
import { windowFromDocument } from "utils/dom";
import { FILE_TREE_VIEW_TYPE } from "./navigator/NavigatorView";

export const showMainMenu = (
  el: HTMLElement,
  superstate: Superstate,
  app: App
) => {
  const toggleSections = (collapse: boolean) => {
    const spaces =
      superstate.waypoints[superstate.settings.currentWaypoint].paths;
    const newSections = collapse ? [] : spaces;
    superstate.settings.expandedSpaces = newSections;
    superstate.saveSettings();
  };

  const toggleFlowState = () => {
    superstate.settings.flowState = !superstate.settings.flowState;
    superstate.saveSettings();
    document.body.classList.toggle(
      "mk-flow-state",
      superstate.settings.flowState
    );
  };

  const isMobile = app.workspace.leftSplit && isTouchScreen(superstate.ui);

  const refreshLeafs = () => {
    const leafs = [];
    let spaceActive = true;
    if (isMobile) {
      const mobileDrawer = app.workspace.leftSplit as WorkspaceMobileDrawer;
      const leaves = mobileDrawer.children as WorkspaceLeaf[];
      const index = leaves.reduce((p: number, c, i) => {
        return c.getViewState().type == FILE_TREE_VIEW_TYPE ? i : p;
      }, -1);
      spaceActive = index == mobileDrawer.currentTab;
      leafs.push(...leaves.filter((l, i) => i != index));
    }

    return { leafs, spaceActive };
  };

  const { spaceActive, leafs } = refreshLeafs();
  const menuOptions: SelectOption[] = [];

  // menuOptions.push({
  //   name: superstate.settings.flowState
  //     ? i18n.menu.exitFlowState
  //     : i18n.menu.enterFlowState,
  //   icon: "ui//flow",
  //   onClick: () => {
  //     toggleFlowState();
  //   },
  // });
  menuOptions.push(menuSeparator);
  menuOptions.push({
    name: i18n.menu.collapseAllSections,
    icon: "ui//chevrons-down-up",
    onClick: () => {
      toggleSections(true);
    },
  });

  menuOptions.push({
    name: i18n.menu.expandAllSections,
    icon: "ui//chevrons-up-down",
    onClick: () => {
      toggleSections(false);
    },
  });

  menuOptions.push(menuSeparator);

  menuOptions.push({
    name: "Rename System",
    icon: "ui//edit",
    onClick: (e) => {
      superstate.ui.openModal(
        "Rename System",
        (props: { hide: () => void }) => (
          <InputModal
            value=""
            saveLabel={"Rename System"}
            hide={props.hide}
            saveValue={(value) => {
              superstate.settings.systemName = value;
              superstate.saveSettings();
            }}
          ></InputModal>
        ),
        windowFromDocument(e.view.document)
      );
    },
  });

  menuOptions.push({
    name: i18n.menu.manageHiddenFiles,
    icon: "ui//eye-off",
    onClick: (e) => {
      superstate.ui.openModal(
        i18n.labels.hiddenFiles,
        (props: { hide: () => void }) => (
          <HiddenPaths superstate={superstate} close={props.hide}></HiddenPaths>
        ),
        windowFromDocument(e.view.document)
      );
    },
  });

  menuOptions.push(menuSeparator);

  if (isMobile) {
    menuOptions.push({
      name: i18n.views.navigator,
      icon: "ui//spaces",
      onClick: () => {
        const leaves = app.workspace.getLeavesOfType(FILE_TREE_VIEW_TYPE);
        if (leaves.length > 0) {
          app.workspace.revealLeaf(leaves[0]);
        }
      },
    });
  }

  leafs.map((l) =>
    menuOptions.push({
      name: l.getDisplayText(),
      icon: "lucide//" + l.view.icon,
      onClick: () => {
        app.workspace.revealLeaf(l);
      },
    })
  );

  menuOptions.push(menuSeparator);

  menuOptions.push({
    name: i18n.menu.obSettings,
    icon: "ui//settings",
    onClick: () => {
      app.commands.commands["app:open-settings"].callback();
    },
  });

  menuOptions.push({
    name: i18n.menu.openVault,
    icon: "ui//vault",
    onClick: () => {
      app.commands.commands["app:open-vault"].callback();
    },
  });

  menuOptions.push(menuSeparator);

  menuOptions.push({
    name: i18n.menu.getHelp,
    icon: "ui//mk-logo",
    onClick: () => {
      window.open("https://make.md/community");
    },
  });

  // if (isMouseEvent(e)) {
  const offset = el.getBoundingClientRect();
  superstate.ui.openMenu(
    offset,
    defaultMenu(superstate.ui, menuOptions),
    windowFromDocument(el.ownerDocument),
    "bottom"
  );
};
