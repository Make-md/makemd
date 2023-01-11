import { TFile } from "obsidian";
import React, { CSSProperties, useEffect, useMemo, useState } from "react";
import { VaultItem } from "schemas/spaces";
import { DBRow, MDBColumn } from "types/mdb";
import { eventTypes } from "types/types";
import { unifiedToNative } from "utils/emoji";
import {
  getAbstractFileAtPath
} from "utils/file";
import { uiIconSet } from "utils/icons";
import { vaultItemForPath } from "utils/spaces/spaces";
import { TableCellProp } from "../TableView/TableView";

export const PreviewCell = (
  props: TableCellProp & { file: string; row?: DBRow; columns?: MDBColumn[] }
) => {
  const [vaultItem, setVaultItem] = useState<VaultItem>(null);

  const previewImage = useMemo(() => {
    if (!props.row || !props.columns) return null;
    const imageCol = props.columns.find((f) => f.type == "image");
    if (!imageCol) return null;
    return props.row[imageCol.name + imageCol.table];
  }, [props.row, props.columns]);

  const previewFile = useMemo(() => {
    return getAbstractFileAtPath(app, previewImage);
  }, [previewImage]);

  const loadIcon = () => {
    setVaultItem(vaultItemForPath(props.plugin, props.file));
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
        vaultItem?.color.length > 0
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
            ? { __html: unifiedToNative(vaultItem.sticker) }
            : vaultItem?.folder == "true"
            ? { __html: uiIconSet["mk-ui-folder"] }
            : { __html: uiIconSet["mk-ui-file"] }
        }
      ></div>
    </div>
  );
};
