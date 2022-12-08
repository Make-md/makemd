import MakeMDPlugin from "main";
import "css/MainMenu.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SectionChangeModal } from "components/Spaces/modals";
import t from "i18n";
import { createRoot } from "react-dom/client";
import { platformIsMobile } from "utils/utils";
import { Menu, setIcon, WorkspaceLeaf, WorkspaceMobileDrawer } from "obsidian";
import { FILE_TREE_VIEW_TYPE } from "./FileTreeView";
import { uiIconSet } from "utils/icons";
interface MainMenuComponentProps {
  plugin: MakeMDPlugin;
}
export const replaceMobileMainMenu = (plugin: MakeMDPlugin) => {
  if (platformIsMobile()) {
    const header = app.workspace.containerEl.querySelector(
      ".workspace-drawer.mod-left .workspace-drawer-header-left"
    );
    const reactEl = createRoot(header);
    reactEl.render(<MainMenu plugin={plugin}></MainMenu>);
  }
};

export const MainMenu = (props: MainMenuComponentProps) => {
  const { plugin } = props;
  const ref = useRef<HTMLDivElement>();
  const toggleSections = (collapse: boolean) => {
    const newSections = plugin.settings.spaces.map((s) => {
      return { ...s, collapsed: collapse };
    });
    plugin.settings.spaces = newSections;
    plugin.saveSettings();
  };

  const newSection = () => {
    let vaultChangeModal = new SectionChangeModal(plugin, "", 0, "create");
    vaultChangeModal.open();
  };

  useEffect(() => {
    refreshLeafs();
  }, []);

  const refreshLeafs = () => {
    // plugin.app.workspace.getLeavesOfType(FILE_TREE_VIEW_TYPE)

    let leafs = [];
    let spaceActive = true;
    if (plugin.app.workspace.leftSplit && platformIsMobile()) {
      const mobileDrawer = plugin.app.workspace
        .leftSplit as WorkspaceMobileDrawer;
      const leaves = mobileDrawer.children as WorkspaceLeaf[];
      const index = leaves.reduce((p: number, c, i) => {
        return c.getViewState().type == FILE_TREE_VIEW_TYPE ? i : p;
      }, -1);
      spaceActive = index == mobileDrawer.currentTab;
      leafs.push(...leaves.filter((l, i) => i != index));
    }
    
    return { leafs, spaceActive };
  };

  const showMenu = (e: React.MouseEvent) => {
    const { spaceActive, leafs } = refreshLeafs();
    const menu = new Menu();
    !spaceActive &&
      menu.addItem((menuItem) => {
        menuItem.setIcon("lucide-arrow-left");
        menuItem.setTitle(t.menu.backToSpace);
        menuItem.onClick((ev: MouseEvent) => {
          const leaves =
            plugin.app.workspace.getLeavesOfType(FILE_TREE_VIEW_TYPE);
          if (leaves.length > 0) {
            plugin.app.workspace.revealLeaf(leaves[0]);
          }
        });
      });
    menu.addItem((menuItem) => {
      menuItem.setIcon("plus");
      menuItem.setTitle(t.menu.newSpace);
      menuItem.onClick((ev: MouseEvent) => {
        newSection();
      });
    });

    menu.addItem((menuItem) => {
      menuItem.setIcon("lucide-chevrons-down-up");
      menuItem.setTitle(t.menu.collapseAllSections);
      menuItem.onClick((ev: MouseEvent) => {
        toggleSections(true);
      });
    });

    menu.addItem((menuItem) => {
      menuItem.setIcon("lucide-chevrons-up-down");
      menuItem.setTitle(t.menu.expandAllSections);
      menuItem.onClick((ev: MouseEvent) => {
        toggleSections(false);
      });
    });
    menu.addSeparator();

    leafs.map((l) =>
      menu.addItem((menuItem) => {
        menuItem.setIcon(l.view.icon);
        menuItem.setTitle(l.getDisplayText());
        menuItem.onClick((ev: MouseEvent) => {
          plugin.app.workspace.revealLeaf(l);
        });
      })
    );

    menu.addItem((menuItem) => {
      menuItem.setIcon("lucide-settings");
      menuItem.setTitle(t.menu.obSettings);
      menuItem.onClick((ev: MouseEvent) => {
        plugin.app.commands.commands["app:open-settings"].callback();
      });
    });

    menu.addItem((menuItem) => {
      menuItem.setIcon("vault");
      menuItem.setTitle(t.menu.openVault);
      menuItem.onClick((ev: MouseEvent) => {
        plugin.app.commands.commands["app:open-vault"].callback();
      });
    });

    
    menu.addSeparator();
    menu.addItem((menuItem) => {
      menuItem.setIcon("mk-logo");
      menuItem.setTitle(t.menu.getHelp);
      menuItem.onClick((ev: MouseEvent) => {
        window.open("https://make.md/community");
      });
    });
    // if (isMouseEvent(e)) {
    const offset = ref.current.getBoundingClientRect();
    menu.showAtPosition({ x: offset.left, y: offset.top + 30 });
  };

  return (
    <div className="mk-main-menu-container">
      <div
        className="mk-main-menu-button"
        ref={ref}
        onClick={(e) => showMenu(e)}
      >
        {plugin.app.vault.getName()}
        <div
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-expand"] }}
        ></div>
      </div>
    </div>
  );
};
