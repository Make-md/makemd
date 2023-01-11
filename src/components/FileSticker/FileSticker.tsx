import { StickerModal } from "components/Spaces/TreeView/FileStickerMenu/FileStickerMenu";
import t from "i18n";
import MakeMDPlugin from "main";
import React, { useEffect, useState } from "react";
import { VaultItem } from "schemas/spaces";
import { eventTypes, SpaceChangeEvent } from "types/types";
import { unifiedToNative } from "utils/emoji";
import { uiIconSet } from "utils/icons";
import {
  saveFileSticker,
  vaultItemForPath
} from "utils/spaces/spaces";

export const FileSticker = (props: {
  plugin: MakeMDPlugin;
  filePath: string;
}) => {
  const [vaultItem, setVaultItem] = useState<VaultItem>(
    vaultItemForPath(props.plugin, props.filePath)
  );

  const reloadIcon = (e: SpaceChangeEvent) => {
    if (e.detail.changeType == "sticker")
      setVaultItem(vaultItemForPath(props.plugin, props.filePath));
  };
  useEffect(() => {
    if (vaultItem?.path != props.filePath) {
      setVaultItem(vaultItemForPath(props.plugin, props.filePath));
    }
    window.addEventListener(eventTypes.spacesChange, reloadIcon);
    return () => {
      window.removeEventListener(eventTypes.spacesChange, reloadIcon);
    };
  }, [props.filePath]);

  const triggerStickerMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    let vaultChangeModal = new StickerModal(props.plugin.app, (emoji) =>
      saveFileSticker(props.plugin, props.filePath, emoji)
    );
    vaultChangeModal.open();
  };
  const color = vaultItem?.color;
  return (
    <div className="mk-file-icon">
      <button
        aria-label={t.buttons.changeIcon}
        style={
          color?.length > 0
            ? ({
                "--label-color": `${vaultItem.color}`,
                "--icon-color": `#ffffff`,
              } as React.CSSProperties)
            : ({
                "--icon-color": `var(--text-muted)`,
              } as React.CSSProperties)
        }
        dangerouslySetInnerHTML={
          vaultItem?.sticker
            ? { __html: unifiedToNative(vaultItem.sticker) }
            : vaultItem?.folder == "true"
            ? {
                __html: color
                  ? uiIconSet["mk-ui-folder-solid"]
                  : uiIconSet["mk-ui-folder"],
              }
            : {
                __html: color
                  ? uiIconSet["mk-ui-file-solid"]
                  : uiIconSet["mk-ui-file"],
              }
        }
        onClick={(e) => triggerStickerMenu(e)}
      ></button>
    </div>
  );
};
