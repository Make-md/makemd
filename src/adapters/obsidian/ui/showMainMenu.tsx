import {
  defaultMenu,
  menuSeparator,
} from "core/react/components/UI/Menus/menu";
import { showLinkMenu } from "core/react/components/UI/Menus/properties/linkMenu";
import { HiddenPaths } from "core/react/components/UI/Modals/HiddenFiles";
import { pinPathToSpaceAtIndex } from "core/superstate/utils/spaces";
import { SelectOption, SpaceEditor, Superstate, i18n } from "makemd-core";
import { App, WorkspaceLeaf, WorkspaceMobileDrawer } from "obsidian";
import React from "react";
import { FILE_TREE_VIEW_TYPE } from "./navigator/NavigatorView";

export const showMainMenu = (
  el: HTMLElement,
  superstate: Superstate,
  app: App
) => {
  const toggleSections = (collapse: boolean) => {
    const spaces = [...superstate.getSpaceItems(activeViewSpace.path)];
    const newSections = collapse
      ? []
      : spaces.map((f) => activeViewSpace?.path + "/" + f.path);
    superstate.settings.expandedSpaces = newSections;
    superstate.saveSettings();
  };
  const activeViewSpace = superstate.spacesIndex.get(
    superstate.settings.activeView
  );
  const setActiveViewSpaceByPath = (path: string) => {
    superstate.settings.activeView = path;
    superstate.saveSettings();
  };
  const refreshLeafs = () => {
    const leafs = [];
    let spaceActive = true;
    if (app.workspace.leftSplit && superstate.ui.getScreenType() == "mobile") {
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
  if (!spaceActive) {
    menuOptions.push({
      name: i18n.menu.backToSpace,
      icon: "lucide//arrow-left",
      onClick: () => {
        const leaves = app.workspace.getLeavesOfType(FILE_TREE_VIEW_TYPE);
        if (leaves.length > 0) {
          app.workspace.revealLeaf(leaves[0]);
        }
      },
    });
  }

  if (activeViewSpace?.type != "default") {
    menuOptions.push({
      name: i18n.menu.openSpace,
      icon: "lucide//layout",
      onClick: () => {
        superstate.ui.openPath(activeViewSpace.path, false);
      },
    });

    menuOptions.push(menuSeparator);

    menuOptions.push({
      name: i18n.buttons.createFolder,
      icon: "lucide//folder-plus",
      onClick: () => {
        superstate.ui.openModal(
          i18n.labels.createSection,
          (props: { hide: () => void }) => (
            <SpaceEditor
              superstate={superstate}
              space={null}
              parent={activeViewSpace}
              metadata={null}
              close={props.hide}
            ></SpaceEditor>
          )
        );
      },
    });

    menuOptions.push({
      name: i18n.buttons.addIntoSpace,
      icon: "lucide//pin",
      onClick: (ev: React.MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        showLinkMenu(ev, superstate, (link) => {
          pinPathToSpaceAtIndex(superstate, activeViewSpace, link);
        });
      },
    });
  }
  menuOptions.push(menuSeparator);

  if (superstate.settings.enableDefaultSpaces) {
    if (superstate.settings.enableHomeSpace)
      menuOptions.push({
        name: i18n.menu.home,
        icon: "lucide//home",
        onClick: () => {
          setActiveViewSpaceByPath("Spaces/Home");
        },
      });

    if (superstate.settings.enableTagSpaces)
      menuOptions.push({
        name: i18n.menu.tags,
        icon: "lucide//tags",
        onClick: () => {
          setActiveViewSpaceByPath("spaces://$tags");
        },
      });
  }
  menuOptions.push({
    name: i18n.menu.vault,
    icon: "lucide//vault",
    onClick: () => {
      setActiveViewSpaceByPath("/");
    },
  });

  menuOptions.push(menuSeparator);

  menuOptions.push({
    name: i18n.menu.collapseAllSections,
    icon: "lucide//chevrons-down-up",
    onClick: () => {
      toggleSections(true);
    },
  });

  menuOptions.push({
    name: i18n.menu.expandAllSections,
    icon: "lucide//chevrons-up-down",
    onClick: () => {
      toggleSections(false);
    },
  });

  menuOptions.push(menuSeparator);

  menuOptions.push({
    name: i18n.menu.manageHiddenFiles,
    icon: "lucide//eye-off",
    onClick: () => {
      superstate.ui.openModal(
        i18n.labels.hiddenFiles,
        (props: { hide: () => void }) => (
          <HiddenPaths superstate={superstate} close={props.hide}></HiddenPaths>
        )
      );
    },
  });

  menuOptions.push(menuSeparator);

  leafs.map((l) =>
    menuOptions.push({
      name: l.getDisplayText(),
      icon: "lucide//" + l.view.icon,
      onClick: () => {
        app.workspace.revealLeaf(l);
      },
    })
  );

  menuOptions.push({
    name: i18n.menu.obSettings,
    icon: "lucide//settings",
    onClick: () => {
      app.commands.commands["app:open-settings"].callback();
    },
  });

  menuOptions.push({
    name: i18n.menu.openVault,
    icon: "lucide//vault",
    onClick: () => {
      app.commands.commands["app:open-vault"].callback();
    },
  });

  menuOptions.push(menuSeparator);

  menuOptions.push({
    name: i18n.menu.getHelp,
    icon: "lucide//mk-logo",
    onClick: () => {
      window.open("https://make.md/community");
    },
  });

  // if (isMouseEvent(e)) {
  const offset = el.getBoundingClientRect();
  superstate.ui.openMenu(
    { x: offset.left, y: offset.top + 30 },
    defaultMenu(superstate.ui, menuOptions)
  );
};
