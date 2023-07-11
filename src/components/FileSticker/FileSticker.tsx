import { stickerModal } from "components/ui/modals/stickerModal";
import { isMouseEvent } from "hooks/useLongPress";
import t from "i18n";
import MakeMDPlugin from "main";
import { Menu } from "obsidian";
import React, { useEffect, useState } from "react";
import { saveFileSticker } from "superstate/spacesStore/spaces";
import { FileMetadataCache } from "types/cache";
import { SpaceChangeEvent, eventTypes } from "types/types";
import { removeFileIcons } from "utils/emoji";
import { defaultIconForExtension } from "utils/icons";
import { stickerFromString } from "utils/sticker";

type Sticker = {
  color: string;
  icon: string;
  extension: string;
};

export const FileSticker = (props: {
  plugin: MakeMDPlugin;
  fileCache: FileMetadataCache;
}) => {
  const { fileCache } = props;
  const triggerStickerContextMenu = (e: React.MouseEvent) => {
    if (!fileCache) return;
    e.preventDefault();
    const fileMenu = new Menu();

    fileMenu.addSeparator();
    // Rename Item
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(t.buttons.changeIcon);
      menuItem.setIcon("lucide-sticker");
      menuItem.onClick((ev: MouseEvent) => {
        let vaultChangeModal = new stickerModal(
          props.plugin.app,
          props.plugin,
          (emoji) => saveFileSticker(props.plugin, fileCache?.path, emoji)
        );
        vaultChangeModal.open();
      });
    });

    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(t.buttons.removeIcon);
      menuItem.setIcon("lucide-file-minus");
      menuItem.onClick((ev: MouseEvent) => {
        removeFileIcons(props.plugin, [fileCache.path]);
      });
    });

    if (isMouseEvent(e)) {
      fileMenu.showAtPosition({ x: e.pageX, y: e.pageY });
    } else {
      fileMenu.showAtPosition({
        // @ts-ignore
        x: e.nativeEvent.locationX,
        // @ts-ignore
        y: e.nativeEvent.locationY,
      });
    }
    return false;
  };
  const triggerStickerMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vaultChangeModal = new stickerModal(
      props.plugin.app,
      props.plugin,
      (emoji) => saveFileSticker(props.plugin, fileCache.path, emoji)
    );
    vaultChangeModal.open();
  };
  return (
    <div
      className={`mk-file-icon ${
        fileCache?.sticker ? "" : "mk-file-icon-placeholder"
      }`}
    >
      <button
        aria-label={t.buttons.changeIcon}
        onContextMenu={triggerStickerContextMenu}
        style={
          fileCache?.color?.length > 0
            ? ({
                "--label-color": `${fileCache.color}`,
                "--icon-color": `#ffffff`,
              } as React.CSSProperties)
            : ({
                "--icon-color": `var(--text-muted)`,
              } as React.CSSProperties)
        }
        dangerouslySetInnerHTML={
          fileCache?.sticker
            ? { __html: stickerFromString(fileCache.sticker, props.plugin) }
            : {
                __html: defaultIconForExtension(
                  fileCache?.extension,
                  fileCache?.color ? true : false
                ),
              }
        }
        onClick={(e) => triggerStickerMenu(e)}
      ></button>
    </div>
  );
};

export const FileStickerContainer = (props: {
  plugin: MakeMDPlugin;
  filePath: string;
}) => {
  const [fileCache, setFileCache] = useState<FileMetadataCache>(null);
  const reloadCache = () => {
    const fileCache = props.plugin.index.filesIndex.get(props.filePath);
    setFileCache(fileCache);
  };
  const reloadIcon = (e: SpaceChangeEvent) => {
    if (e.detail.type == "file" && e.detail.name == props.filePath) {
      reloadCache();
    }
  };
  useEffect(() => {
    reloadCache();
  }, []);
  useEffect(() => {
    window.addEventListener(eventTypes.spacesChange, reloadIcon);
    return () => {
      window.removeEventListener(eventTypes.spacesChange, reloadIcon);
    };
  }, [props.filePath]);

  return fileCache ? (
    <FileSticker plugin={props.plugin} fileCache={fileCache} />
  ) : (
    <></>
  );
};
