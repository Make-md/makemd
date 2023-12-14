import i18n from "core/i18n";
import { showPathContextMenu } from "core/react/components/UI/Menus/navigator/pathContextMenu";
import { PathStickerView } from "core/react/components/UI/Stickers/PathSticker/PathSticker";
import { PathState } from "core/types/superstate";
import React, { useEffect, useMemo, useRef } from "react";
import { parseMultiString } from "utils/parsers";
import { TableCellMultiProp } from "../TableView/TableView";
type PathCellObject = {
  path: string;
  pathState?: PathState;
};

export const PathCell = (
  props: TableCellMultiProp & {
    folder?: string;
    deleteRow?: () => void;
    openFlow?: (e: React.MouseEvent) => void;
  }
) => {
  const fileOrCleanPath = (f: string): PathCellObject => {
    if (!f)
      return {
        path: "",
      };

    const pathState: PathState = props.superstate.pathsIndex.get(f);
    return pathState ? { path: f, pathState: pathState } : { path: f };
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

  const pathExists = async (name: string) => {
    if (!name) return false;
    return (await props.superstate.spaceManager.pathExists(name))
      ? true
      : false;
  };
  const onBlur = async () => {
    if (!ref.current) return;
    // if (initialValue != value)
    if (await pathExists(ref.current?.value)) {
      props.superstate.ui.notify(i18n.notice.fileExists);
    } else {
      props.saveValue(ref.current.value);
      props.setEditMode(null);
    }
  };

  const newPath = async (file: PathCellObject) => {
    const pathName = file.path.replace(/\//g, "").replace(/\./g, "");
    const path = `${props.folder}/${pathName}.md`;
    if (pathName.length == 0) {
      return;
    }
    if (await pathExists(path)) {
      props.superstate.ui.notify(i18n.notice.fileExists);
    } else {
      await props.superstate.spaceManager.createItemAtPath(
        props.folder,
        "md",
        pathName
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
          if (v.pathState) {
            return (
              <div key={i} className="mk-cell-file-title">
                {v && v.pathState ? v.pathState.name : ""}
                {v.pathState.metadata?.file?.extension?.length > 0 &&
                  v.pathState.metadata.file.extension != "md" && (
                    <span className="nav-file-tag">
                      {v.pathState.metadata.file.extension}
                    </span>
                  )}
                <button
                  aria-label={i18n.buttons.toggleFlow}
                  className="mk-cell-file-flow mk-inline-button"
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker(
                      "ui//mk-ui-flow-hover"
                    ),
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
        if (v.pathState) {
          return (
            <>
              <div
                className="mk-cell-file-item"
                onContextMenu={(e) =>
                  showPathContextMenu(
                    props.superstate,
                    v.pathState.path,
                    null,
                    e
                  )
                }
              >
                <PathStickerView
                  superstate={props.superstate}
                  pathState={v.pathState}
                ></PathStickerView>
                <div
                  className="mk-cell-file-name"
                  onClick={(e) =>
                    props.superstate.ui.openPath(
                      v.pathState.path,
                      e.ctrlKey || e.metaKey
                        ? e.altKey
                          ? "split"
                          : "tab"
                        : false
                    )
                  }
                >
                  {v && v.pathState ? v.pathState.name : ""}
                </div>
              </div>
            </>
          );
        }
        return (
          <>
            <div className="mk-cell-file-item">
              <div className="mk-path-icon">
                <button
                  onClick={(e) => newPath(v)}
                  dangerouslySetInnerHTML={{
                    __html:
                      props.superstate.ui.getSticker("ui//mk-ui-new-file"),
                  }}
                ></button>
              </div>
              {props.editMode > 1 ? (
                <input
                  className="mk-cell-file-name"
                  type="text"
                  placeholder={i18n.buttons.newNote}
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
