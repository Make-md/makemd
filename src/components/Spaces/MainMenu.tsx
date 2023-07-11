import { EditSpaceModal } from "components/ui/modals/editSpaceModal";
import { HiddenItemsModal } from "components/ui/modals/hiddenFilesModal";
import "css/MainMenu.css";
import { default as i18n, default as t } from "i18n";
import MakeMDPlugin from "main";
import { Menu, TFolder, WorkspaceLeaf, WorkspaceMobileDrawer } from "obsidian";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { RecoilRoot, useRecoilState } from "recoil";
import * as recoilState from "recoil/pluginState";
import { eventTypes } from "types/types";
import {
  createNewMarkdownFile,
  defaultNoteFolder,
  platformIsMobile,
} from "utils/file";
import { uiIconSet } from "utils/icons";
import { stickerFromString } from "utils/sticker";
import { FILE_TREE_VIEW_TYPE } from "./FileTreeView";
interface MainMenuComponentProps {
  plugin: MakeMDPlugin;
  compactMode: boolean;
}
export const replaceMobileMainMenu = (plugin: MakeMDPlugin) => {
  if (platformIsMobile()) {
    const header = app.workspace.containerEl.querySelector(
      ".workspace-drawer.mod-left .workspace-drawer-header-left"
    );
    header.empty();
    const reactEl = createRoot(header);
    reactEl.render(
      <RecoilRoot>
        <MainMenu
          plugin={plugin}
          compactMode={plugin.settings.spacesCompactMode}
        ></MainMenu>
      </RecoilRoot>
    );
  }
};

export const MainMenu = (props: MainMenuComponentProps) => {
  const { plugin } = props;
  const [activeView, setActiveView] = useRecoilState(recoilState.activeView);
  const [spaces, setSpaces] = useState(props.plugin.index.allSpaces());
  const [activeFile, setActiveFile] = useRecoilState(recoilState.activeFile);
  const folder: TFolder = defaultNoteFolder(props.plugin, activeFile);
  const [activeViewSpace, setActiveViewSpace] = useRecoilState(
    recoilState.activeViewSpace
  );
  const activeSpace = spaces.find((f) => f.name == activeViewSpace);
  const ref = useRef<HTMLDivElement>();
  const toggleSections = (collapse: boolean) => {
    const newSections = collapse ? [] : spaces.map((f) => f.name);
    plugin.settings.expandedSpaces = newSections;
    plugin.saveSettings();
  };
  const newFile = async () => {
    await createNewMarkdownFile(props.plugin, folder, "", "");
  };

  const loadCachedSpaces = () => {
    setSpaces([...plugin.index.allSpaces()]);
  };
  useEffect(() => {
    window.addEventListener(eventTypes.spacesChange, loadCachedSpaces);
    return () => {
      window.removeEventListener(eventTypes.spacesChange, loadCachedSpaces);
    };
  }, [loadCachedSpaces]);
  useEffect(() => {
    refreshLeafs();
  }, []);

  const refreshLeafs = () => {
    // plugin.app.workspace.getLeavesOfType(FILE_TREE_VIEW_TYPE)

    const leafs = [];
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
        menuItem.setTitle(i18n.menu.home);
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
      menu.addItem((menuItem) => {
        menuItem.setTitle("All Spaces");
        menuItem.onClick((ev: MouseEvent) => {
          setActiveView("all");
        });
      });
      menu.addSeparator();
      spaces
        .filter((f) => f.pinned == "true" || f.pinned == "pinned")
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
      menuItem.setTitle(t.buttons.createSection);
      menuItem.onClick((ev: MouseEvent) => {
        const vaultChangeModal = new EditSpaceModal(
          plugin,
          {
            name: "",
            def: {
              type: "focus",
              folder: "",
              filters: [],
            },
          },
          "create"
        );
        vaultChangeModal.open();
      });
    });
    menu.addItem((menuItem) => {
      menuItem.setIcon("plus");
      menuItem.setTitle(t.buttons.createSectionSmart);
      menuItem.onClick((ev: MouseEvent) => {
        const vaultChangeModal = new EditSpaceModal(
          plugin,
          {
            name: "",
            def: {
              type: "smart",
              folder: "",
              filters: [],
            },
          },
          "create"
        );
        vaultChangeModal.open();
      });
    });
    menu.addSeparator();
    menu.addItem((menuItem) => {
      menuItem.setIcon("sync");
      menuItem.setTitle("Reload Spaces");
      menuItem.onClick((ev: MouseEvent) => {
        plugin.index.loadSpacesDatabaseFromDisk();
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
        const vaultChangeModal = new HiddenItemsModal(plugin);
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
      ? "Home"
      : activeView == "all"
      ? "All Spaces"
      : activeView == "tags"
      ? "Tags"
      : activeViewSpace;
  const currentViewIcon =
    activeView == "root"
      ? uiIconSet["mk-ui-home"]
      : activeView == "all"
      ? uiIconSet["mk-ui-spaces"]
      : activeView == "tags"
      ? uiIconSet["mk-ui-tags"]
      : activeSpace?.sticker?.length > 0
      ? stickerFromString(activeSpace.sticker, props.plugin)
      : activeSpace?.name.charAt(0);
  const menuComponent = () => (
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
  return props.compactMode ? (
    <div className="mk-flow-bar-compact">
      {" "}
      {menuComponent()}
      <button
        aria-label={t.buttons.newNote}
        className="mk-inline-button"
        onClick={() => newFile()}
      >
        <div
          className="mk-icon-small"
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-new-note"] }}
        ></div>
      </button>
      {props.plugin.settings.blinkEnabled && (
        <button
          aria-label={i18n.buttons.blink}
          className="mk-inline-button"
          onClick={() => props.plugin.quickOpen()}
        >
          <div
            className="mk-icon-small"
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-blink"] }}
          ></div>
        </button>
      )}
    </div>
  ) : (
    menuComponent()
  );
};
