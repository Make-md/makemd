import { TFile } from "obsidian";
import React, { CSSProperties, useEffect, useMemo, useState } from "react";
import { FileMetadataCache } from "types/cache";
import { DBRow, MDBColumn } from "types/mdb";
import { eventTypes } from "types/types";
import { getAbstractFileAtPath } from "utils/file";
import { uiIconSet } from "utils/icons";
import { stickerFromString } from "utils/sticker";
import { TableCellProp } from "../TableView/TableView";

export const PreviewCell = (
  props: TableCellProp & { file: string; row?: DBRow; columns?: MDBColumn[] }
) => {
  const [vaultItem, setVaultItem] = useState<FileMetadataCache>(null);

  const previewImage = useMemo(() => {
    if (vaultItem?.banner) return vaultItem.banner;
    if (props.initialValue) return props.initialValue;
    if (!props.row || !props.columns) return null;
    const imageCol = props.columns.find((f) => f.type == "image");
    if (!imageCol) return null;
    return props.row[imageCol.name + imageCol.table];
  }, [props.row, props.columns]);

  const previewFile = useMemo(() => {
    return getAbstractFileAtPath(app, previewImage);
  }, [previewImage]);

  const loadIcon = () => {
    setVaultItem(props.plugin.index.filesIndex.get(props.file));
  };
  useEffect(() => {
    loadIcon();
    window.addEventListener(eventTypes.spacesChange, loadIcon);
    return () => {
      window.removeEventListener(eventTypes.spacesChange, loadIcon);
    };
  }, [props.file]);

  return previewImage ? (
    <div
      className="mk-file-preview"
      style={{
        backgroundSize: "cover",
        backgroundPositionY: "50%",
        backgroundImage: `url(${
          previewFile
            ? app.vault.getResourcePath(previewFile as TFile)
            : previewImage
        })`,
      }}
    />
  ) : (
    <div
      className="mk-file-preview"
      style={
        vaultItem?.color?.length > 0
          ? ({
              "--label-color": `${vaultItem.color}`,
              "--icon-color": `#ffffff`,
            } as React.CSSProperties)
          : ({
              "--label-color": `var(--background-secondary-alt)`,
              "--icon-color": `var(--text-muted)`,
            } as CSSProperties)
      }
    >
      <div
        className="mk-file-icon"
        dangerouslySetInnerHTML={
          vaultItem?.sticker
            ? { __html: stickerFromString(vaultItem.sticker, props.plugin) }
            : vaultItem?.isFolder
            ? { __html: uiIconSet["mk-ui-folder"] }
            : { __html: uiIconSet["mk-ui-file"] }
        }
      ></div>
    </div>
  );
};
