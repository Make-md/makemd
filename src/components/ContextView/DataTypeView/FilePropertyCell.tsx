import { formatDistance } from "date-fns";
import { TFolder } from "obsidian";
import React, { useState } from "react";
import { parsePropString } from "utils/contexts/parsers";
import { getAbstractFileAtPath, openTFolder } from "utils/file";
import { folderPathToString } from "utils/strings";
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

export const LookUpCell = (props: TableCellProp & { file: string }) => {
  const [cache, setCache] = useState(null);
  const initialValue = props.initialValue;
  const { field, property } = parsePropString(props.propertyValue);
  if (property == "folder") {
    return (
      <div
        className="mk-cell-fileprop"
        onClick={() => {
          openTFolder(
            getAbstractFileAtPath(app, initialValue) as TFolder,
            props.plugin,
            false
          );
        }}
      >
        {folderPathToString(initialValue)}
      </div>
    );
  }
  if (property == "extension") {
    return <div className="mk-cell-fileprop">{initialValue}</div>;
  } else if (property == "ctime" || property == "mtime") {
    const date = new Date(parseInt(initialValue)).getTime()
      ? new Date(parseInt(initialValue))
      : null;
    return (
      <div className="mk-cell-fileprop">
        {date &&
          formatDistance(new Date(date), new Date(), { addSuffix: true })}
      </div>
    );
  } else if (property == "size" || property == "File.size") {
    return (
      <div className="mk-cell-fileprop">
        {humanFileSize(parseInt(initialValue))}
      </div>
    );
  }

  return <div className="mk-cell-fileprop">{initialValue}</div>;
};
