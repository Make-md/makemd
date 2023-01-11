import { formatDistance } from "date-fns";
import { TFolder } from "obsidian";
import React, { useState } from "react";
import {
  appendFileMetaData,
  getAbstractFileAtPath, openTFolder
} from "utils/file";
import { folderPathToString } from "utils/tree";
import { TableCellProp } from "../TableView/TableView";

export const FilePropertyCell = (
  props: TableCellProp & { property: string; file: string }
) => {
  const { property } = props;

  const file = getAbstractFileAtPath(app, props.file);
  const [cache, setCache] = useState(null);
  const initialValue = file ? appendFileMetaData(property, file) : "";
  /*if (property == 'preview') {
        const setFileC = async (file: TFile) => {
          const fc = stripFrontmatterFromString(await app.vault.cachedRead(file));
          setCache(fc);
        };
        if (file instanceof TFile && !cache) {
          setFileC(file);
        }
        return <div className='mk-cell-file-preview'>{cache}</div>
      }*/
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
  } else if (property == "size") {
    return <div className="mk-cell-fileprop">{initialValue}</div>;
  }

  return <div className="mk-cell-fileprop"></div>;
};
