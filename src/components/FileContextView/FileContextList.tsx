import { DataTypeView } from "components/ContextView/DataTypeView/DataTypeView";
import { showSelectMenu } from "components/ui/menus/menuItems";
import "css/FileContext.css";
import i18n from "i18n";
import { uniq } from "lodash";
import MakeMDPlugin from "main";
import { TFile } from "obsidian";
import React, { useContext, useMemo } from "react";
import { fieldTypes } from "schemas/mdb";
import { DBRow, MDBField } from "types/mdb";
import {
  frontMatterForFile,
  frontMatterKeys,
  guestimateTypes,
  yamlTypeToMDBType
} from "utils/contexts/fm";
import { getAbstractFileAtPath } from "utils/file";
import { folderPathToString, uniqCaseInsensitive } from "utils/tree";
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
}) => {
  const { path } = props;
  const {
    tableData,
    newColumn,
    tagContexts,
    contextTable,
    folderPath,
    isFolderContext,
    setContextTable,
    saveDB,
    saveContextDB,
    dbPath,
  } = useContext(MDBContext);

  const fileContext: FileContext = useMemo(() => {
    const td = tableData
      ? {
          folder: {
            cols: tableData.cols.filter(
              (f) =>
                f.name != "File" &&
                f.type != "fileprop" &&
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
                    f.name != "File" &&
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
  const showNewMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();

    const files = [path]
      .map((f) => getAbstractFileAtPath(app, f))
      .filter((f) => f instanceof TFile);
    const types = guestimateTypes(
      files.map((f) => f.path),
      false
    );

    const fmFields = files
      .reduce((p, c) => {
        const fm = frontMatterForFile(c);
        const fmKeys = uniqCaseInsensitive(frontMatterKeys(fm));
        return uniq([...p, ...fmKeys]);
      }, [] as string[])
      .filter((f) => !tableData.cols.some((g) => g.name == f));
    const allTypes = [
      ...fmFields.map((f) => ({
        name: f,
        description: i18n.labels.syncFrontmatterProperty,
        value: "fm." + f + "." + yamlTypeToMDBType(types[f]),
      })),
      ...fieldTypes
        .filter((f) => f.restricted != true)
        .map((f) => ({
          name: f.label,
          description: i18n.labels.newProperty,
          value: "type." + f.type,
        })),
    ];

    const uniqueNameFromString = (name: string, cols: string[]) => {
      let newName = name;
      if (cols.includes(newName)) {
        let append = 1;
        while (cols.includes(newName)) {
          newName = name + append.toString();
          append += 1;
        }
      }
      return newName;
    };
    const saveOptions = (_: string[], values: string[]) => {
      const newValue = values[0];
      const newType = newValue.split(".");
      if (newType[0] == "fm") {
        newColumn({
          name: uniqueNameFromString(
            newType[1],
            tableData.cols.map((f) => f.name)
          ),
          schemaId: tableData.schema.id,
          table: "",
          type: newType[2],
        });
      } else if (newType[0] == "type") {
        newColumn({
          name: uniqueNameFromString(
            newType[1],
            tableData.cols.map((f) => f.name)
          ),
          schemaId: tableData.schema.id,
          table: "",
          type: newType[1],
        });
      }
    };
    showSelectMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        multi: false,
        editable: false,
        value: [],
        saveOptions: saveOptions,
        placeholder: i18n.labels.propertyItemSelectPlaceholder,
        searchable: true,
        options: allTypes,
        showAll: true,
      }
    );
  };
  return (
    <>
      {fileContext.folder && fileContext.folder.data && (
        <div className="mk-file-context-section">
          <div className="mk-file-context-title">
            {isFolderContext ? folderPathToString(folderPath) : folderPath}
          </div>
          {fileContext.folder.cols.map((f, i) => (
            <div key={i} className="mk-file-context-row">
              <div className="mk-file-context-field">{f.name}</div>
              <div className="mk-file-context-value">
                <DataTypeView
                  plugin={props.plugin}
                  initialValue={fileContext.folder.data[f.name]}
                  index={fileContext.folder.dataIndex}
                  file={fileContext.folder.data["File"]}
                  column={{ ...f, table: "" }}
                  editable={true}
                ></DataTypeView>
              </div>
            </div>
          ))}
          <div
            className="mk-file-context-field-new"
            onClick={(e) => showNewMenu(e)}
          >
            + New Field
          </div>
        </div>
      )}
    </>
  );
};
