import { showWarningsModal } from "core/react/components/Navigator/SyncWarnings";
import {
  defaultMenu,
  menuSeparator,
} from "core/react/components/UI/Menus/menu/SelectionMenu";
import { HiddenPaths } from "core/react/components/UI/Modals/HiddenFiles";
import { isPhone, isTouchScreen } from "core/utils/ui/screen";
import MakeMDPlugin from "main";
import { SelectOption, Superstate } from "makemd-core";
import { WorkspaceLeaf, WorkspaceMobileDrawer } from "obsidian";
import React from "react";
import i18n from "shared/i18n";
import { windowFromDocument } from "shared/utils/dom";
import { FILE_TREE_VIEW_TYPE } from "./navigator/NavigatorView";

export const showMainMenu = (
  el: HTMLElement,
  superstate: Superstate,
  plugin: MakeMDPlugin
) => {
  const toggleSections = (collapse: boolean) => {
    const spaces =
      superstate.focuses[superstate.settings.currentWaypoint].paths;
    const newSections = collapse ? [] : spaces;
    superstate.settings.expandedSpaces = newSections;
    superstate.saveSettings();
  };

  const isMobile =
    plugin.app.workspace.leftSplit && isTouchScreen(superstate.ui);

  const refreshLeafs = () => {
    const leafs = [];
    let spaceActive = true;
    if (isMobile) {
      const mobileDrawer = (
        plugin.superstate.settings.spacesRightSplit
          ? plugin.app.workspace.rightSplit
          : plugin.app.workspace.leftSplit
      ) as WorkspaceMobileDrawer;
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

  if (isMobile)
    menuOptions.push({
      name: superstate.settings.mobileMakeHeader
        ? i18n.menu.showHeader
        : i18n.menu.hideHeader,
      icon: "ui//expand",
      onClick: () => {
        superstate.settings.mobileMakeHeader =
          !superstate.settings.mobileMakeHeader;
        superstate.saveSettings();
        document.body.classList.toggle(
          "mk-mobile-header",
          superstate.settings.mobileMakeHeader
        );
      },
    });
  if (superstate.ui.getWarnings().length > 0) {
    menuOptions.push({
      name: i18n.menu.showWarnings,
      icon: "ui//warning",
      onClick: (e) => {
        showWarningsModal(superstate, windowFromDocument(e.view.document));
      },
    });
    menuOptions.push(menuSeparator);
  }
  if (!isPhone(superstate.ui)) {
    menuOptions.push({
      name: i18n.buttons.openOverview,
      icon: "ui//columns",
      onClick: () => {
        plugin.openEverView();
      },
    });
    menuOptions.push(menuSeparator);
  }

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
    name: i18n.labels.manageHiddenFiles,
    icon: "ui//eye-off",
    onClick: (e) => {
      superstate.ui.openModal(
        i18n.labels.hiddenFiles,
        <HiddenPaths superstate={superstate}></HiddenPaths>,
        windowFromDocument(e.view.document)
      );
    },
  });

  menuOptions.push({
    name: i18n.menu.settings,
    icon: "ui//settings",
    onClick: (e) => {
      superstate.ui.openPath("mk-core://settings", false);
    },
  });

  // leafs.map((l) =>
  //   menuOptions.push({
  //     name: l.getDisplayText(),
  //     icon: "lucide//" + l.view.icon,
  //     onClick: () => {
  //       plugin.app.workspace.revealLeaf(l);
  //     },
  //   })
  // );

  menuOptions.push(menuSeparator);

  menuOptions.push({
    name: i18n.menu.obSettings,
    icon: "ui//settings",
    onClick: () => {
      plugin.app.commands.commands["app:open-settings"].callback();
    },
  });

  menuOptions.push({
    name: i18n.menu.openVault,
    icon: "ui//vault",
    onClick: () => {
      plugin.app.commands.commands["app:open-vault"].callback();
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
