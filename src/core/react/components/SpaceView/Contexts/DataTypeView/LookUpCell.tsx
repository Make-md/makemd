import { parseFieldValue } from "core/schemas/parseFieldValue";
import { PathPropertyName } from "core/types/context";
import { formatDistance } from "date-fns";
import React, { useState } from "react";
import { folderPathToString } from "utils/path";
import { TableCellProp } from "../TableView/TableView";

//https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
const humanFileSize = (bytes: number, si = false, dp = 1) => {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
};

export const LookUpCell = (props: TableCellProp & { path: string }) => {
  const [cache, setCache] = useState(null);
  const initialValue = props.initialValue;
  const { field, value } = parseFieldValue(props.propertyValue, "fileprop");
  if (value == "folder") {
    return (
      <div
        className="mk-cell-fileprop"
        onClick={() => {
          props.superstate.ui.openPath(initialValue, false);
        }}
      >
        {initialValue && folderPathToString(initialValue)}
      </div>
    );
  }
  if (value == "extension") {
    return <div className="mk-cell-fileprop">{initialValue}</div>;
  } else if (value == "ctime" || value == "mtime") {
    const date = new Date(parseInt(initialValue)).getTime()
      ? new Date(parseInt(initialValue))
      : null;
    return (
      <div className="mk-cell-fileprop">
        {date &&
          formatDistance(new Date(date), new Date(), { addSuffix: true })}
      </div>
    );
  } else if (value == "size" || value == PathPropertyName + ".size") {
    return (
      <div className="mk-cell-fileprop">
        {humanFileSize(parseInt(initialValue))}
      </div>
    );
  } else if (value == "sticker") {
    return (
      <div className="mk-cell-fileprop">
        <div
          className="mk-path-icon"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker(initialValue),
          }}
        ></div>
      </div>
    );
  }

  return <div className="mk-cell-fileprop">{initialValue}</div>;
};
