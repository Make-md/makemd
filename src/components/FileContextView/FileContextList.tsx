import { DataTypeView } from "components/ContextView/DataTypeView/DataTypeView";
import { showPropertyMenu } from "components/ui/menus/propertyMenu";
import "css/FileContext.css";
import { initiateContextIfNotExists, insertContextItems } from "dispatch/mdb";
import MakeMDPlugin from "main";
import { useState } from "preact/hooks";
import React, { useContext, useMemo } from "react";
import { FilePropertyName } from "types/context";
import { DBRow, MDBColumn, MDBField } from "types/mdb";
import { optionValuesForColumn } from "utils/contexts/mdb";
import { uiIconSet } from "utils/icons";
import { contextDisplayName } from "utils/strings";
import { MDBContext } from "../ContextView/MDBContext";

type FileContext = Record<
  string,
  {
    cols: MDBField[];
    data: DBRow;
    dataIndex: number;
  }
>;

export const FileContextList = (props: {
  plugin: MakeMDPlugin;
  path: string;
  color: string;
}) => {
  const { path } = props;
  const {
    tableData,
    newColumn,
    cols,
    tagContexts,
    contextTable,
    contextInfo,
    saveColumn,
    hideColumn,
    delColumn,
    sortColumn,
    updateFieldValue,
    updateValue,
    loadContextFields,
    predicate,
  } = useContext(MDBContext);
  const [collapsed, setCollapsed] = useState(
    !props.plugin.settings.inlineContextSectionsExpanded
  );

  const fileContext: FileContext = useMemo(() => {
    const td = tableData
      ? {
          folder: {
            cols: tableData.cols.filter(
              (f) =>
                f.name != FilePropertyName &&
                !(
                  f.type == "fileprop" &&
                  (f.value.startsWith(FilePropertyName) ||
                    f.value.indexOf(".") == -1)
                ) &&
                f.hidden != "true" &&
                f.type != "preview"
            ),
            data: tableData.rows.find((r) => r.File == path),
            dataIndex: tableData.rows.findIndex((r) => r.File == path),
          },
        }
      : {};
    const tags = tagContexts.reduce(
      (p, c) =>
        contextTable[c]
          ? {
              ...p,
              [c]: {
                cols: contextTable[c].cols.filter(
                  (f) =>
                    f.name != FilePropertyName &&
                    f.type != "fileprop" &&
                    f.hidden != "true" &&
                    f.type != "preview"
                ),
                data: contextTable[c].rows.find(
                  (r, index) => index == parseInt(props.path)
                ),
                dataIndex: contextTable[c].rows.findIndex(
                  (r) => r.File == path
                ),
              },
            }
          : p,
      {}
    );

    return {
      ...tags,
      ...td,
    };
  }, [tableData, contextTable, tagContexts, path]);
  const saveField = (field: MDBColumn, oldField: MDBColumn) => {
    if (field.name.length > 0) {
      if (
        field.name != oldField.name ||
        field.type != oldField.type ||
        field.value != oldField.value ||
        field.attrs != oldField.attrs
      ) {
        const saveResult = saveColumn(field, oldField);
      }
    }
  };
  const saveContext = (
    field: MDBColumn,
    oldField: MDBColumn,
    value: string[]
  ) => {
    const newContext = value[0];
    initiateContextIfNotExists(props.plugin, newContext)
      .then((f) => {
        if (f) {
          return insertContextItems(
            props.plugin,
            optionValuesForColumn(
              field.name,
              field.table == "" ? tableData : contextTable[field.table]
            ),
            newContext
          );
        }
      })
      .then((f) => loadContextFields(newContext));
    const newField = {
      ...field,
      value: newContext ?? "",
    };
    saveColumn(newField, oldField);
  };
  const showMenu = (e: React.MouseEvent, field: MDBColumn) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const options = optionValuesForColumn(
      field.name,
      field.table == "" ? tableData : contextTable[field.table]
    );
    showPropertyMenu(
      props.plugin,
      { x: offset.left, y: offset.top + 30 },
      true,
      options,
      field,
      cols,
      contextInfo.contextPath,
      (newField) => saveField(newField, field),
      (newField, val) => saveContext(newField, field, val),
      hideColumn,
      delColumn,
      sortColumn,
      predicate.colsHidden.includes(field.name + field.table)
    );
  };
  return (
    <>
      {fileContext.folder &&
        fileContext.folder.data &&
        fileContext.folder.cols.length > 0 && (
          <div className="mk-file-context-section">
            <div
              className="mk-file-context-title"
              onClick={(e) => {
                setCollapsed(!collapsed);
                e.stopPropagation();
              }}
            >
              <div
                className={`mk-icon-xsmall`}
                dangerouslySetInnerHTML={{
                  __html:
                    contextInfo.type == "folder"
                      ? uiIconSet["mk-ui-folder"]
                      : contextInfo.type == "space"
                      ? uiIconSet["mk-ui-spaces"]
                      : uiIconSet["mk-ui-tags"],
                }}
              ></div>
              {contextDisplayName(contextInfo)}
              <button
                className={`mk-collapse mk-inline-button mk-icon-xxsmall ${
                  collapsed ? "mk-collapsed" : ""
                }`}
                dangerouslySetInnerHTML={{
                  __html: uiIconSet["mk-ui-collapse-sm"],
                }}
              ></button>
            </div>
            {!collapsed ? (
              <>
                {fileContext.folder.cols.map((f, i) => (
                  <div key={i} className="mk-file-context-row">
                    <div
                      className="mk-file-context-field"
                      onClick={(e) => showMenu(e, { ...f, table: "" })}
                    >
                      {f.name}
                    </div>
                    <div className="mk-file-context-value">
                      <DataTypeView
                        plugin={props.plugin}
                        initialValue={fileContext.folder.data[f.name]}
                        index={fileContext.folder.dataIndex}
                        file={fileContext.folder.data[FilePropertyName]}
                        column={{ ...f, table: "" }}
                        editable={!contextInfo.readOnly}
                        updateValue={(v) =>
                          updateValue(
                            f.name,
                            v,
                            "",
                            fileContext.folder.dataIndex,
                            fileContext.folder.data[FilePropertyName]
                          )
                        }
                        updateFieldValue={(fv, v) =>
                          updateFieldValue(
                            f.name,
                            fv,
                            v,
                            "",
                            fileContext.folder.dataIndex,
                            fileContext.folder.data[FilePropertyName]
                          )
                        }
                        contextTable={contextTable}
                      ></DataTypeView>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <></>
            )}
          </div>
        )}
    </>
  );
};
