import { Warning } from "shared/types/Warning";
import { InteractionType, ScreenType } from "shared/types/ui";

import MakeMDPlugin from "main";
import { Sticker, Superstate, UIAdapter, UIManager } from "makemd-core";
import i18n from "shared/i18n";
import { Menu, Notice, Platform, TFile, getIcon } from "obsidian";
import React from "react";

import { Container } from "react-dom";
import { Root, createRoot } from "react-dom/client";
import { emojis } from "shared/assets/emoji";
import { Pos, Rect } from "shared/types/Pos";
import { EmojiData } from "shared/types/emojis";
import { TargetLocation } from "shared/types/path";
import { openPathInElement } from "shared/utils/openPathInElement";
import { getParentPathFromString } from "utils/path";
import { urlRegex } from "utils/regex";

import { showLinkMenu } from "core/react/components/UI/Menus/properties/linkMenu";
import { showSpacesMenu } from "core/react/components/UI/Menus/properties/selectSpaceMenu";
import { ConfirmationModal } from "core/react/components/UI/Modals/ConfirmationModal";
import ImageModal from "core/react/components/UI/Modals/ImageModal";
import { removeSpace } from "core/superstate/utils/spaces";
import { BlinkMode } from "shared/types/blink";
import { editableRange } from "shared/utils/codemirror/selectiveEditor";
import { getLineRangeFromRef } from "shared/utils/obsidian";
import { SPACE_VIEW_TYPE } from "../SpaceViewContainer";
import { getAbstractFileAtPath, getLeaf } from "../utils/file";
import { modifyTabSticker } from "../utils/modifyTabSticker";
import { WindowManager } from "./WindowManager";
import { lucideIcons } from "./icons";
import { showModal } from "./modal";
import { showMainMenu } from "./showMainMenu";
import { stickerFromString } from "./sticker";

export class ObsidianUI implements UIAdapter {
  public manager: UIManager;
  public root: Root;
  public constructor(public plugin: MakeMDPlugin) {
    const newDiv = document.createElement("div");
    document.body.appendChild(newDiv);
    newDiv.className = "mk-root";
    this.createRoot = () => null;
    this.getRoot = () => null;
    this.root = createRoot(newDiv);
    this.root.render(<WindowManager ui={this}></WindowManager>);
  }

  public destroy = () => {
    this.root.unmount();
  };

  public createRoot: typeof createRoot;
  public getRoot: (container: Container) => Root;

  public availableViews = () => {
    //@ts-ignore
    return Object.keys(this.plugin.app.viewRegistry.typeByExtension);
  };

  public quickOpen = (
    mode?: BlinkMode,
    offset?: Rect,
    win?: Window,
    onSelect?: (link: string) => void,
    source?: string
  ) => {
    if (mode == BlinkMode.Image) {
      this.openPalette(
        <ImageModal
          superstate={this.manager.superstate}
          selectedPath={onSelect}
        ></ImageModal>,
        win,
        null
      );
      return;
    }
    if (this.manager.superstate.settings.blinkEnabled) {
      this.plugin.quickOpen(this.manager.superstate, mode, onSelect, source);
    } else {
      if (!offset) {
        return;
      }
      if (mode == BlinkMode.Open) {
        showLinkMenu(offset, win, this.manager.superstate, onSelect);
      } else {
        showSpacesMenu(offset, win, this.manager.superstate, onSelect);
      }
    }
  };
  public mainMenu = (el: HTMLElement, superstate: Superstate) => {
    showMainMenu(el, superstate, this.plugin);
  };
  public onMetadataRefresh = () => {
    modifyTabSticker(this.plugin);
  };
  public navigationHistory = () => {
    return this.plugin.app.workspace.getLastOpenFiles();
  };
  public getSticker = (icon: string, options?: Record<string, any>) => {
    return stickerFromString(icon, this.plugin, options);
  };

  public getOS = () => {
    return Platform.isMacOS
      ? "mac"
      : Platform.isWin
      ? "windows"
      : Platform.isLinux
      ? "linux"
      : Platform.isIosApp
      ? "ios"
      : Platform.isAndroidApp
      ? "android"
      : "unknown";
  };
  public openToast = (content: string) => {
    new Notice(content);
  };
  public openPalette = (modal: JSX.Element, win: Window, className: string) => {
    return showModal({
      ui: this,
      fc: modal,
      isPalette: true,
      className,
      win,
    });
  };

  public openModal = (
    title: string,
    modal: JSX.Element,
    win?: Window,
    className?: string,
    props?: any
  ) => {
    return showModal({
      ui: this,
      fc: modal,
      title: title,
      className,
      props,
      win,
    });
  };
  public openPopover = (position: Pos, popover: JSX.Element) => {};

  public dragStarted = (
    e: React.DragEvent<HTMLDivElement>,
    paths: string[]
  ) => {
    if (paths.length == 0) return;
    if (paths.length == 1) {
      const path = paths[0];
      const file = getAbstractFileAtPath(this.plugin.app, path);
      if (!file) return;
      if (file instanceof TFile) {
        const dragData = this.plugin.app.dragManager.dragFile(
          e.nativeEvent,
          file
        );
        this.plugin.app.dragManager.onDragStart(e.nativeEvent, dragData);
      } else {
        this.plugin.app.dragManager.onDragStart(e.nativeEvent, {
          icon: "lucide-file",
          source: undefined,
          title: file.name,
          type: "file",
          file: file,
        });
        this.plugin.app.dragManager.dragFolder(e.nativeEvent, file, true);
      }
    } else {
      const files = paths
        .map((f) => getAbstractFileAtPath(this.plugin.app, f))
        .filter((f) => f);
      this.plugin.app.dragManager.onDragStart(
        { ...e, doc: document },
        {
          icon: "lucide-files",
          source: undefined,
          title: i18n.labels.filesCount.replace(
            "{$1}",
            files.length.toString()
          ),
          type: "files",
          files: files,
        }
      );

      this.plugin.app.dragManager.dragFiles(
        { ...e, doc: document },
        files,
        true
      );
    }
  };

  public setDragLabel = (label: string) => {
    this.plugin.app.dragManager.setAction(label);
  };

  public dragEnded = (e: React.DragEvent<HTMLDivElement>) => {};

  public getWarnings = () => {
    const warnings: Warning[] = [];
    if (this.plugin.obsidianAdapter.fileNameWarnings.size > 0) {
      warnings.push({
        id: "obsidian-sync-space-folder",
        message: i18n.labels.someFilesHaveInvalidNames,
        description:
          "Files contain invalid characters which may cause issues during sync, use alias to display these characters to prevent the issue",
        command: "obsidian://make-md:path-fixer",
      });
    }
    if (this.plugin.app.internalPlugins.config.sync) {
      if (this.plugin.superstate.settings.spaceSubFolder.startsWith(".")) {
        warnings.push({
          id: "obsidian-sync-space-folder",
          message: i18n.labels.obsidianSyncCurrentlyWontSyncYourSpaces,
          description: "Change the space folder name to a non-hidden folder",
          command: "obsidian://make-md:move-space-folder",
        });
      }
      const allowedTypes = this.plugin.app.internalPlugins.plugins?.sync
        ?.instance?.allowTypes as Set<string>;
      if (allowedTypes && ![...allowedTypes].some((f) => f == "unsupported")) {
        warnings.push({
          id: "obsidian-sync-space-config",
          message:
            i18n.labels.obsidianSyncCurrentlyWontSyncYourSpaceViewsOrContext,
          description:
            i18n.descriptions
              .changeTheSyncSettingsToIncludeUnsupportedFileTypes,
          command: "obsidian://app:open-settings",
        });
      }
    }
    return warnings;
  };

  public allStickers = () => {
    const allLucide: Sticker[] = lucideIcons.map((f) => ({
      name: f,
      type: "lucide",
      keywords: f,
      value: f,
      html: getIcon(f).outerHTML,
    }));

    const allCustom: Sticker[] = [];

    // Get icons from AssetManager iconsets
    if (this.plugin.superstate.assets) {
      const assetManager = this.plugin.superstate.assets;

      // Get all iconsets and iterate through their icons
      const iconsets = assetManager.getIconsets?.() || [];

      for (const iconset of iconsets) {
        if (
          iconset.id === "lucide" ||
          iconset.id === "emoji" ||
          iconset.id === "ui"
        ) {
          continue; // Skip built-in iconsets as they're handled separately
        }

        // Get icons from this iconset
        if (iconset.icons && iconset.icons.length > 0) {
          for (const icon of iconset.icons) {
            const iconName =
              typeof icon === "string" ? icon : icon.id || icon.name;
            const iconKey = `${iconset.id}//${iconName}`;

            allCustom.push({
              name: iconName,
              type: iconset.id,
              keywords: iconKey,
              value: iconName,
              html:
                assetManager.getCachedIcon(iconKey) ||
                assetManager.getCachedIcon(iconName) ||
                "",
            });
          }
        }
      }
      //   // Also check direct cache entries that might not be in iconsets
      //   assetManager.iconsCache.forEach((value, key) => {
      //     if (key.includes('//')) {
      //       const [iconsetId, filename] = key.split('//');
      //       // Only add if not already added from iconsets
      //       if (!allCustom.some(s => s.type === iconsetId && s.value === filename)) {
      //         allCustom.push({
      //           name: filename.replace(/\.(svg|png|jpg|jpeg)$/i, ''), // Remove file extension for display
      //           type: iconsetId,
      //           keywords: key,
      //           value: filename,
      //           html: value,
      //         });
      //       }
      //     } else if (!key.includes('/') || key.startsWith('http')) {
      //       // Legacy vault icons without iconset structure
      //       if (!allCustom.some(s => s.value === key)) {
      //         allCustom.push({
      //           name: key,
      //           type: "vault",
      //           keywords: key,
      //           value: key,
      //           html: value,
      //         });
      //       }
      //     }
      //     // Skip single slash paths as they should now be available with // format
      //   });
    }

    // Add any remaining icons from superstate cache
    this.plugin.superstate.iconsCache.forEach((value, key) => {
      if (key.includes("//")) {
        const [iconsetId, filename] = key.split("//");
        // Only add if not already added
        if (
          !allCustom.some((s) => s.type === iconsetId && s.value === filename)
        ) {
          allCustom.push({
            name: filename.replace(/\.(svg|png|jpg|jpeg)$/i, ""), // Remove file extension for display
            type: iconsetId,
            keywords: key,
            value: filename,
            html: value,
          });
        }
      } else if (!key.includes("/") || key.startsWith("http")) {
        // Legacy vault icons
        if (!allCustom.some((s) => s.value === key)) {
          allCustom.push({
            name: key,
            type: "vault",
            keywords: key,
            value: key,
            html: value,
          });
        }
      }
      // Skip single slash paths as they should now be available with // format
    });

    const allEmojis: Sticker[] = Object.keys(emojis as EmojiData).reduce(
      (p, c: string) => [
        ...p,
        ...emojis[c].map((e) => ({
          type: "emoji",
          name: e.n[0],
          value: e.u,
          html: e.u,
        })),
      ],
      []
    );

    return [...allEmojis, ...allCustom, ...allLucide];
  };

  public getUIPath = (path: string, thumbnail?: boolean): string => {
    const file = this.plugin.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      if (thumbnail) {
        const thumb = this.plugin.superstate.pathsIndex.get(file.path)?.label
          ?.thumbnail;
        if (thumb) {
          return this.getUIPath(thumb);
        }
      }
      return `${this.plugin.app.vault.getResourcePath(file)}?${Math.floor(
        Math.random() * 1000
      )}`;
    } else if (path?.match(urlRegex)) {
      return path;
    }
    const returnPath = getParentPathFromString(
      this.plugin.app.vault.getResourcePath(
        this.plugin.app.vault.getRoot() as any
      )
    );
    return `${returnPath}${path}?${Math.floor(Math.random() * 1000)}`;
  };
  public viewsByPath = (path: string) => {
    const abstractFile = getAbstractFileAtPath(this.plugin.app, path);
    if (abstractFile instanceof TFile) {
      return this.plugin.app.workspace
        .getLeavesOfType("markdown")
        .filter((f) => {
          return f.view.file?.path == path;
        })
        .map((f) => {
          return {
            path: f.view.file?.path,
            openPath: (path: string) => {
              f.openFile(abstractFile as TFile);
            },
            parent: null as any,
            children: [] as any[],
          };
        });
    } else {
      return this.plugin.app.workspace
        .getLeavesOfType(SPACE_VIEW_TYPE)
        .filter((f) => {
          return f.view.getState().path == path;
        })
        .map((f) => {
          return {
            path: f.view.getState().path,
            openPath: (path: string) => {
              f.setViewState({
                type: SPACE_VIEW_TYPE,
                state: { path: path },
              });
            },
            parent: null as any,
            children: [] as any[],
          };
        });
    }
  };
  public isEverViewOpen = () => {
    return this.plugin.app.workspace.getLeavesOfType("mk-ever-view").length > 0;
  };
  public openPath = (
    path: string,
    newLeaf: TargetLocation,
    source?: any,
    props?: Record<string, any>
  ) => {
    if (newLeaf == "system") {
      // @ts-ignore
      this.plugin.app.showInFolder(path);
      return;
    }
    if (newLeaf == "overview") {
      const everLeaves =
        this.plugin.app.workspace.getLeavesOfType("mk-ever-view");
      if (everLeaves.length > 0) {
        everLeaves[0].setViewState({
          type: "mk-ever-view",
          state: { path: path },
        });
        return;
      }
    }

    if (newLeaf == "hover") {
      this.plugin.app.workspace.trigger("link-hover", {}, source, path, path);
      return;
    } else if (source) {
      const uri = this.plugin.superstate.spaceManager.uriByString(path);
      openPathInElement(
        this.plugin.app,
        this.plugin.app.workspace.getLeaf(), // workspaceLeafForDom(this.plugin.app, source),
        source,
        null,
        async (editor) => {
          const leaf = editor.attachLeaf();
          if (
            this.plugin.app.vault.getAbstractFileByPath(uri.basePath) instanceof
            TFile
          ) {
            await leaf.openFile(
              this.plugin.app.vault.getAbstractFileByPath(uri.basePath) as TFile
            );

            const selectiveRange = getLineRangeFromRef(
              uri.basePath,
              uri.refStr,
              this.plugin.app
            );
            if (!leaf.view?.editor) {
              return;
            }
            if (props?.readOnly) {
              leaf.setViewState({
                type: "markdown",
                state: { mode: "preview" },
              });
            } else {
              if (selectiveRange[0] && selectiveRange[1]) {
                leaf.view.editor?.cm.dispatch({
                  annotations: [editableRange.of(selectiveRange)],
                });
              }
            }
          } else {
            await this.plugin.openPath(leaf, path, true);
          }
        }
      );
      return;
    }
    const leaf = getLeaf(this.plugin.app, newLeaf);
    this.plugin.openPath(leaf, path);
  };
  public primaryInteractionType = () => {
    return Platform.isMobile ? InteractionType.Touch : InteractionType.Mouse;
  };
  public getScreenType = () => {
    return Platform.isPhone
      ? ScreenType.Phone
      : Platform.isTablet
      ? ScreenType.Tablet
      : ScreenType.Desktop;
  };
  public hasNativePathMenu = (path: string) => {
    return true;
  };
  public nativePathMenu = (e: React.MouseEvent, path: string) => {
    const file = this.plugin.app.vault.getAbstractFileByPath(path);
    if (file) {
      const fileMenu = new Menu();
      fileMenu.addItem((item) => {
        item.setTitle("Delete");
        item.setIcon("trash");
        item.onClick(() => {
          if (file instanceof TFile) {
            this.plugin.app.vault.delete(file);
            return;
          }
          this.openModal(
            i18n.labels.deleteSpace,
            <ConfirmationModal
              confirmAction={() => {
                removeSpace(this.manager.superstate, path);
              }}
              confirmLabel={i18n.buttons.delete}
              message={i18n.descriptions.deleteSpace}
            ></ConfirmationModal>,
            window
          );
        });
      });
      this.plugin.app.workspace.trigger(
        "file-menu",
        fileMenu,
        file,
        "file-explorer"
      );
      const rect = e.currentTarget.getBoundingClientRect();
      fileMenu.showAtPosition({ x: rect.left, y: rect.bottom });
    }
  };
}
