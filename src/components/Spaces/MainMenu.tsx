import { HiddenItemsModal } from "components/ui/modals/hiddenFilesModal";
import { EditSpaceModal } from "components/ui/modals/editSpaceModal";
import "css/MainMenu.css";
import i18n from "i18n";
import t from "i18n";
import MakeMDPlugin from "main";
import { Menu, WorkspaceLeaf, WorkspaceMobileDrawer } from "obsidian";
import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { RecoilRoot, useRecoilState } from "recoil";
import * as recoilState from "recoil/pluginState";
import { unifiedToNative } from "utils/emoji";
import { platformIsMobile } from "utils/file";
import { uiIconSet } from "utils/icons";
import { FILE_TREE_VIEW_TYPE } from "./FileTreeView";
interface MainMenuComponentProps {
  plugin: MakeMDPlugin;
}
export const replaceMobileMainMenu = (plugin: MakeMDPlugin) => {
  if (platformIsMobile()) {
    const header = app.workspace.containerEl.querySelector(
      ".workspace-drawer.mod-left .workspace-drawer-header-left"
    );
    header.empty();
    if (!plugin.settings.spacesCompactMode) {
      const reactEl = createRoot(header);
      reactEl.render(
        <RecoilRoot>
          <MainMenu plugin={plugin}></MainMenu>
        </RecoilRoot>
      );
    }
  }
};

export const MainMenu = (props: MainMenuComponentProps) => {
  const { plugin } = props;
  const [activeView, setActiveView] = useRecoilState(recoilState.activeView);
  const [spaces, setSpaces] = useRecoilState(recoilState.spaces);
  const [activeViewSpace, setActiveViewSpace] = useRecoilState(
    recoilState.activeViewSpace
  );
  const activeSpace = spaces.find((f) => f.name == activeViewSpace);
  const ref = useRef<HTMLDivElement>();
  const toggleSections = (collapse: boolean) => {
    const newSections = collapse ? [] : ["/", ...spaces.map((f) => f.name)];
    plugin.settings.expandedSpaces = newSections;
    plugin.saveSettings();
  };

  const newSection = () => {
    let vaultChangeModal = new EditSpaceModal(plugin, "", "create");
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

    if (plugin.settings.spacesCompactMode) {
      menu.addItem((menuItem) => {
        menuItem.setTitle(i18n.menu.spaces);
        menuItem.onClick((ev: MouseEvent) => {
          setActiveView("root");
        });
      });
      menu.addItem((menuItem) => {
        menuItem.setTitle(i18n.menu.tags);
        menuItem.onClick((ev: MouseEvent) => {
          setActiveView("tags");
        });
      });
      menu.addSeparator();
      spaces
        .filter((f) => f.pinned == "true")
        .forEach((space) => {
          menu.addItem((menuItem) => {
            menuItem.setTitle(space.name);
            menuItem.onClick((ev: MouseEvent) => {
              setActiveView("space");
              setActiveViewSpace(space.name);
            });
          });
        });
      menu.addSeparator();
    }

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

    menu.addItem((menuItem) => {
      menuItem.setIcon("eye-off");
      menuItem.setTitle(i18n.menu.manageHiddenFiles);
      menuItem.onClick((ev: MouseEvent) => {
        let vaultChangeModal = new HiddenItemsModal(plugin);
        vaultChangeModal.open();
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
  const currentViewName =
    activeView == "root"
      ? "Spaces"
      : activeView == "tags"
      ? "Tags"
      : activeViewSpace;
  const currentViewIcon =
    activeView == "root"
      ? uiIconSet["mk-ui-spaces"]
      : activeView == "tags"
      ? uiIconSet["mk-ui-tags"]
      : activeSpace?.sticker?.length > 0
      ? unifiedToNative(activeSpace.sticker)
      : activeSpace?.name.charAt(0);
  return (
    <div className="mk-main-menu-container">
      <div
        className="mk-main-menu-button"
        ref={ref}
        onClick={(e) => showMenu(e)}
      >
        {plugin.settings.spacesCompactMode ? (
          <>
            <div
              className="mk-main-menu-icon"
              dangerouslySetInnerHTML={{ __html: currentViewIcon }}
            ></div>
            {currentViewName}
          </>
        ) : (
          plugin.app.vault.getName()
        )}
        <div
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-expand"] }}
        ></div>
      </div>
    </div>
  );
};
