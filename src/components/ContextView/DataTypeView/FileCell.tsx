import { FileSticker } from "components/FileSticker/FileSticker";
import { triggerFileMenu } from "components/ui/menus/fileMenu";
import i18n from "i18n";
import { Notice, TFolder } from "obsidian";
import React, { useEffect, useMemo, useRef } from "react";
import { FileMetadataCache } from "types/cache";
import {
  createNewMarkdownFile,
  getAbstractFileAtPath,
  openAFile,
} from "utils/file";
import { uiIconSet } from "utils/icons";
import { parseMultiString } from "utils/parser";
import { filePathToString } from "utils/strings";
import { TableCellMultiProp } from "../TableView/TableView";
type FileCellObject = {
  path: string;
  fileCache?: FileMetadataCache;
};

export const FileCell = (
  props: TableCellMultiProp & {
    folder?: string;
    isFolder: boolean;
    deleteRow?: () => void;
    openFlow?: (e: React.MouseEvent) => void;
  }
) => {
  const fileOrCleanPath = (f: string): FileCellObject => {
    if (!f)
      return {
        path: "",
      };

    const fileCache: FileMetadataCache = props.plugin.index.filesIndex.get(f);
    return fileCache ? { path: f, fileCache } : { path: f };
  };
  const value = useMemo(
    () =>
      (props.multi
        ? parseMultiString(props.initialValue) ?? []
        : [props.initialValue]
      ).map((f) => fileOrCleanPath(f)),
    [props.initialValue]
  );

  const ref = useRef(null);
  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    e.key == "Enter" && (e.target as HTMLInputElement).blur();
  };

  const fileExists = (name: string) => {
    if (!name) return false;
    return getAbstractFileAtPath(app, name) ? true : false;
  };
  const onBlur = () => {
    if (!ref.current) return;
    // if (initialValue != value)
    if (fileExists(ref.current?.value)) {
      new Notice(i18n.notice.fileExists);
    } else {
      props.saveValue(ref.current.value);
      props.setEditMode(null);
    }
  };

  const newFile = async (file: FileCellObject) => {
    const filePath = file.path.replace(/\//g, "").replace(/\./g, "");
    const path = `${props.folder}/${filePath}.md`;
    if (filePath.length == 0) {
      return;
    }
    if (fileExists(path)) {
      new Notice(i18n.notice.fileExists);
    } else {
      await createNewMarkdownFile(
        props.plugin,
        getAbstractFileAtPath(app, props.folder) as TFolder,
        filePath
      );
    }
  };

  const deleteRow = () => {
    props.deleteRow();
  };

  useEffect(() => {
    if (props.editMode == 2) {
      ref?.current?.focus();
    }
  }, [props.editMode]);

  return (
    <div className="mk-cell-file">
      {value.map((v, i) => {
        if (props.editMode == 0) {
          if (v.fileCache) {
            return (
              <div key={i} className="mk-cell-file-title">
                {v && v.fileCache ? v.fileCache.name : ""}
                {v.fileCache.extension?.length > 0 &&
                  v.fileCache.extension != "md" && (
                    <span className="nav-file-tag">
                      {v.fileCache.extension}
                    </span>
                  )}
                <button
                  aria-label={i18n.buttons.toggleFlow}
                  className="mk-cell-file-flow mk-inline-button"
                  dangerouslySetInnerHTML={{
                    __html: uiIconSet["mk-ui-flow-hover"],
                  }}
                  onClick={(e) => {
                    if (props.openFlow) {
                      props.openFlow(e);
                      e.stopPropagation();
                    }
                  }}
                ></button>
              </div>
            );
          } else {
            return (
              <div key={i} className="mk-cell-file-title">
                {v.path}
              </div>
            );
          }
        }
        if (v.fileCache) {
          return (
            <>
              <div
                className="mk-cell-file-item"
                onContextMenu={(e) =>
                  triggerFileMenu(
                    props.plugin,
                    getAbstractFileAtPath(app, v.fileCache.path),
                    v.fileCache.isFolder,
                    e
                  )
                }
              >
                <FileSticker
                  plugin={props.plugin}
                  fileCache={v.fileCache}
                ></FileSticker>
                <div
                  className="mk-cell-file-name"
                  onClick={(e) =>
                    openAFile(
                      getAbstractFileAtPath(app, v.fileCache.path),
                      props.plugin,
                      e.ctrlKey || e.metaKey
                    )
                  }
                >
                  {v && v.fileCache ? filePathToString(v.fileCache.name) : ""}
                </div>
              </div>
            </>
          );
        }
        return (
          <>
            <div className="mk-cell-file-item">
              <div className="mk-file-icon">
                <button
                  onClick={(e) => newFile(v)}
                  dangerouslySetInnerHTML={{
                    __html: uiIconSet["mk-ui-new-file"],
                  }}
                ></button>
              </div>
              {props.editMode > 1 ? (
                <input
                  className="mk-cell-file-name"
                  type="text"
                  placeholder="Untitled"
                  ref={ref}
                  value={v.path as string}
                  //   onChange={e => setValue(e.target.value)}
                  onKeyDown={onKeyDown}
                  onBlur={onBlur}
                />
              ) : (
                <div className="mk-cell-file-name">{v.path}</div>
              )}
            </div>
          </>
        );
      })}
    </div>
  );
};
