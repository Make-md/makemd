import { Superstate } from "core/superstate/superstate";
import { PathState } from "core/types/superstate";
import React, { CSSProperties, useEffect, useMemo, useState } from "react";
import { DBRow, SpaceTableColumn } from "types/mdb";
import { TableCellProp } from "../TableView/TableView";

export const PreviewCell = (
  props: TableCellProp & {
    path: string;
    row?: DBRow;
    columns?: SpaceTableColumn[];
    superstate: Superstate;
  }
) => {
  const [vaultItem, setVaultItem] = useState<PathState>(null);

  const previewImage = useMemo(() => {
    if (vaultItem?.metadata?.banner) return vaultItem.metadata.banner;
    if (props.initialValue) return props.initialValue;
    if (!props.row || !props.columns) return null;
    const imageCol = props.columns.find((f) => f.type == "image");
    if (!imageCol) return null;
    return props.row[imageCol.name + imageCol.table];
  }, [props.row, props.columns]);

  const loadIcon = (payload: { path: string }) => {
    if (payload.path == props.path)
      setVaultItem(props.superstate.pathsIndex.get(props.path));
  };
  useEffect(() => {
    loadIcon({ path: props.path });
    props.superstate.eventsDispatcher.addListener("pathStateUpdated", loadIcon);
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        loadIcon
      );
    };
  }, [props.path]);

  return previewImage ? (
    <div
      className="mk-path-preview"
      style={{
        backgroundSize: "cover",
        backgroundPositionY: "50%",
        backgroundImage: `url(${props.superstate.ui.getUIPath(previewImage)})`,
      }}
    />
  ) : (
    <div
      className="mk-path-preview"
      style={
        vaultItem?.label.color?.length > 0
          ? ({
              "--label-color": `${vaultItem.label.color}`,
              "--icon-color": `#ffffff`,
            } as React.CSSProperties)
          : ({
              "--label-color": `var(--background-secondary-alt)`,
              "--icon-color": `var(--text-muted)`,
            } as CSSProperties)
      }
    >
      {vaultItem && (
        <div
          className="mk-path-icon"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker(vaultItem.label.sticker),
          }}
        ></div>
      )}
    </div>
  );
};
