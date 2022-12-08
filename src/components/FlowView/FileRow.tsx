import dayjs from "dayjs";
import * as relativeTime from "dayjs/plugin/relativeTime";
import MakeMDPlugin from "main";
import { TAbstractFile, TFile, TFolder } from "obsidian";
import React, { useEffect, useState } from "react";
import { openFile, unifiedToNative } from "utils/utils";
import t from "i18n";
import { FolderObject } from "./FlowComponent";
import { uiIconSet } from "utils/icons";
interface FileRowProps {
  item: FolderObject;
  plugin: MakeMDPlugin;
}
dayjs.extend(require("dayjs/plugin/relativeTime"));

export const FileRow = (props: FileRowProps) => {
  const [fileCache, setFileCache] = useState("");
  useEffect(() => {
    const setFileC = async (file: TFile) => {
      const fc = await props.plugin.app.vault.cachedRead(file);
      setFileCache(fc);
    };
    if (props.item.file instanceof TFile) setFileC(props.item.file);

    if (props.item.file instanceof TFolder)
      setFileCache(props.item.children.length + t.flowView.itemsCount);
  });

  const { item } = props;

  return (
    <tr className="mk-file-row">
      <td
        className="mk-column-icon"
        dangerouslySetInnerHTML={
          item.icon ?? item.type == "folder"
            ? { __html: uiIconSet["mk-ui-folder"] }
            : { __html: uiIconSet["mk-ui-file"] }
        }
      >
        {item.icon && unifiedToNative(item.icon[1])}
      </td>
      <td
        className="mk-column-file"
        onClick={(e) =>
          openFile(
            //@ts-ignore
            { ...props.item.file, isFolder: item.type == "folder" },
            props.plugin.app,
            false
          )
        }
      >
        <div className="mk-file-name">{item.name}</div>
        <p>{fileCache.length == 0 ? t.flowView.emptyDoc : fileCache}</p>
      </td>
      <td className="mk-file-date">
        {item.created && dayjs(item.created).fromNow()}
      </td>
    </tr>
  );
};
