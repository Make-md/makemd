import { FileSticker } from "components/FileSticker/FileSticker";
import { triggerFileMenu } from "components/ui/menus/fileMenu";
import i18n from "i18n";
import { Notice, TAbstractFile, TFile, TFolder } from "obsidian";
import React, { useEffect, useRef, useState } from "react";
import { splitString } from "utils/contexts/predicate/predicate";
import {
  createNewMarkdownFile,
  getAbstractFileAtPath,
  openFile
} from "utils/file";
import { uiIconSet } from "utils/icons";
import { fileNameToString } from "utils/tree";
import { TableCellMultiProp } from "../TableView/TableView";
type FileCellObject = {
  path: string;
  file?: TAbstractFile;
};

export const FileCell = (
  props: TableCellMultiProp & {
    folder?: string;
    isFolder: boolean;
    deleteRow?: () => void;
    openFlow?: () => void;
  }
) => {
  const fileOrCleanPath = (f: string): FileCellObject => {
    if (!f)
      return {
        path: "",
      };
    const isInFolder = !props.isFolder || f.includes(props.folder);
    const fileExists: TAbstractFile = getAbstractFileAtPath(app, f);
    const cleanPath = (path: string) =>
      path.replace(props.folder + "/", "").replace(".md", "");
    return isInFolder
      ? fileExists
        ? { path: f, file: fileExists }
        : { path: cleanPath(f) }
      : { path: f };
  };

  const initialValue = (
    props.multi ? splitString(props.initialValue) ?? [] : [props.initialValue]
  ).map((f) => fileOrCleanPath(f));
  const [value, setValue] = useState<FileCellObject[]>(initialValue);
  const ref = useRef(null);
  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    e.key == "Enter" && (e.target as HTMLInputElement).blur();
  };

  const fileExists = (name: string) => {
    if (!name) return false;
    return getAbstractFileAtPath(app, `${props.folder}/${name}.md`)
      ? true
      : false;
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
          if (v.file) {
            return (
              <div className="mk-cell-file-title">
                {v
                  ? v.file instanceof TFile
                    ? fileNameToString(v.file.name)
                    : v.file.name
                  : ""}
                {v?.file instanceof TFile &&
                  (v.file as TFile).extension != "md" && (
                    <span className="nav-file-tag">
                      {(v.file as TFile)?.extension}
                    </span>
                  )}
                <button
                  aria-label={i18n.buttons.toggleFlow}
                  className="mk-cell-file-flow mk-inline-button"
                  dangerouslySetInnerHTML={{
                    __html: uiIconSet["mk-ui-flow-hover"],
                  }}
                  onClick={() => props.openFlow && props.openFlow()}
                ></button>
              </div>
            );
          } else {
            return <div className="mk-cell-file-title">{v.path}</div>;
          }
        }
        if (v.file) {
          return (
            <>
              <div
                className="mk-cell-file-item"
                onContextMenu={(e) =>
                  triggerFileMenu(
                    props.plugin,
                    v.file,
                    v.file instanceof TFolder,
                    e
                  )
                }
              >
                <FileSticker
                  plugin={props.plugin}
                  filePath={v.file.path}
                ></FileSticker>
                <div
                  className="mk-cell-file-name"
                  onClick={(e) =>
                    openFile(
                      { ...v.file, isFolder: v.file instanceof TFolder },
                      props.plugin,
                      e.ctrlKey || e.metaKey
                    )
                  }
                >
                  {v
                    ? v.file instanceof TFile
                      ? fileNameToString(v.file.name)
                      : v.file.name
                    : ""}
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
