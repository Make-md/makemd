import classNames from "classnames";
import {
  MetadataType,
  SyncMetadataComponent,
} from "components/ContextView/ContextBuilder/BuilderMetadataFields";
import { TagSelector } from "components/ContextView/ContextBuilder/TagSelector";
import { DataTypeView } from "components/ContextView/DataTypeView/DataTypeView";
import { MDBContext } from "components/ContextView/MDBContext";
import { showNewPropertyMenu } from "components/ui/menus/newPropertyMenu";
import { showPropertyMenu } from "components/ui/menus/propertyMenu";
import { initiateContextIfNotExists, insertContextItems } from "dispatch/mdb";
import MakeMDPlugin from "main";
import React, { useContext, useState } from "react";
import { defaultValueForPropertyType } from "schemas/mdb";
import { DBTable, MDBColumn, MDBField } from "types/mdb";
import { uniq, uniqCaseInsensitive } from "utils/array";
import { tagContextFromTag } from "utils/contexts/contexts";
import { getMDBTable, optionValuesForColumn } from "utils/contexts/mdb";
import { getAbstractFileAtPath } from "utils/file";
import { uiIconSet } from "utils/icons";
import { parseDataview } from "utils/metadata/dataview/parseDataview";
import {
  frontMatterForFile,
  guestimateTypes,
  mergeTableData,
} from "utils/metadata/frontmatter/fm";
import { parseFrontMatter } from "utils/metadata/frontmatter/parseFrontMatter";
import { updateTagsForDefString } from "utils/metadata/tags";
import { contextDisplayName } from "utils/strings";
import { ContextDesigner } from "./ContextDesigner";
export const ContextBuilderView = (props: { plugin: MakeMDPlugin }) => {
  const {
    data,
    cols,
    sortedColumns,
    dbSchema,
    schema,
    contextInfo,
    tableData,
    contextTable,
    saveColumn,
    loadContextFields,
    tagContexts,
    hideColumn,
    sortColumn,
    delColumn,
    saveDB,
    saveContextDB,
    dbFileExists,
    predicate,
    saveSchema,
  } = useContext(MDBContext);

  const [section, setSection] = useState(0);
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
  const saveNewField = (source: string, field: MDBField) => {
    saveColumn({ ...field, table: "" });
  };
  const newProperty = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showNewPropertyMenu(
      props.plugin,
      { x: offset.left, y: offset.top + 30 },
      tagContexts,
      [],
      saveNewField,
      "files",
      contextInfo.contextPath,
      false
    );
  };
  const saveMetadata = (keys: MetadataType[], table: string) => {
    const files = data.map((f) => f.File);
    const importDV = (files: string[], dvKeys: string[]): DBTable => {
      return files.reduce(
        (p, c) => {
          const dvValues = props.plugin.dataViewAPI().page(c);
          if (!dvValues) {
            return p;
          }
          return {
            uniques: [],
            cols: uniqCaseInsensitive([...p.cols, ...dvKeys]),
            rows: [
              ...p.rows,
              {
                File: c,
                ...dvKeys.reduce(
                  (p, c) => ({
                    ...p,
                    [c]: parseDataview(c, dvValues[c]),
                  }),
                  {}
                ),
              },
            ],
          };
        },
        { uniques: [], cols: [], rows: [] }
      );
    };
    const importYAML = (files: string[], fmKeys: string[]): DBTable => {
      return files
        .map((f) => getAbstractFileAtPath(app, f))
        .filter((f) => f)
        .reduce(
          (p, c) => {
            const fm = frontMatterForFile(c);
            if (!fm) {
              return p;
            }

            return {
              uniques: [],
              cols: uniq([...p.cols, ...fmKeys]),
              rows: [
                ...p.rows,
                {
                  File: c.path,
                  ...fmKeys.reduce(
                    (p, c) => ({
                      ...p,
                      [c]: parseFrontMatter(c, fm[c]),
                    }),
                    {}
                  ),
                },
              ],
            };
          },
          { uniques: [], cols: [], rows: [] }
        );
    };

    let yamlTableData = importYAML(
      files,
      keys.filter((f) => f.type == "fm").map((f) => f.name)
    );
    let yamlTypes = guestimateTypes(files, props.plugin, false);

    if (props.plugin.dataViewAPI()) {
      const dvTableData = importDV(
        files,
        keys.filter((f) => f.type == "dv").map((f) => f.name)
      );
      const dvTypes = guestimateTypes(files, props.plugin, true);
      yamlTableData = {
        uniques: uniq([...yamlTableData.uniques, ...dvTableData.uniques]),
        cols: uniqCaseInsensitive([...yamlTableData.cols, ...dvTableData.cols]),
        rows: files.map((file) => {
          return {
            ...(yamlTableData.rows.find((r) => r.File == file) ?? {}),
            ...(dvTableData.rows.find((r) => r.File == file) ?? {}),
          };
        }),
      };
      yamlTypes = { ...yamlTypes, ...dvTypes };
    }

    if (table == "") {
      const newTable = mergeTableData(tableData, yamlTableData, yamlTypes);
      saveDB(newTable);
    } else {
      if (!dbFileExists) {
        saveDB(tableData).then(() =>
          syncMetadataContext(yamlTableData, yamlTypes, table)
        );
      } else {
        syncMetadataContext(yamlTableData, yamlTypes, table);
      }
    }
  };

  const syncMetadataContext = (
    yamlTableData: DBTable,
    yamlTypes: Record<string, string>,
    table: string
  ) => {
    if (contextTable[table]) {
      const newTable = mergeTableData(
        contextTable[table],
        yamlTableData,
        yamlTypes
      );
      saveContextDB(newTable, table);
      saveSchema({
        ...dbSchema,
        def: updateTagsForDefString(
          dbSchema.def,
          uniq([...tagContexts, table])
        ),
      });
    } else {
      getMDBTable(props.plugin, tagContextFromTag(props.plugin, table), "files")
        .then((f) => {
          if (f) {
            const newTable = mergeTableData(f, yamlTableData, yamlTypes);
            return saveContextDB(newTable, table);
          }
        })
        .then(() => {
          saveSchema({
            ...dbSchema,
            def: updateTagsForDefString(
              dbSchema.def,
              uniq([...tagContexts, table])
            ),
          });
        });
    }
  };
  return (
    <>
      <div className="mk-context-maker-preview">
        <div
          className={
            schema?.type == "card"
              ? "mk-cards-container mk-cards-grid"
              : "mk-list-container"
          }
        >
          <div className="mk-list-item">
            {sortedColumns
              .filter((f) => f.type == "preview" && f.table == "")
              .map((f) => (
                <DataTypeView
                  plugin={props.plugin}
                  initialValue={defaultValueForPropertyType(
                    f.name,
                    f.value,
                    f.type
                  )}
                  column={f}
                  index={0}
                  file={""}
                  editable={false}
                ></DataTypeView>
              ))}
            <div className="mk-list-fields">
              {sortedColumns
                .filter((f) => f.type != "preview")
                .map((f, i) => (
                  <DataTypeView
                    plugin={props.plugin}
                    initialValue={defaultValueForPropertyType(
                      f.name,
                      f.value,
                      f.type
                    )}
                    index={0}
                    file={""}
                    column={{ ...f, table: "" }}
                    editable={false}
                    updateValue={(v) => {}}
                    updateFieldValue={(fv, v) => {}}
                    contextTable={{}}
                  ></DataTypeView>
                ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mk-context-maker-selector">
        {section == 0 ? (
          <div>
            <div className={classNames("mk-section-title")}>
              {dbSchema?.primary == "true"
                ? contextDisplayName(contextInfo)
                : "Properties"}
            </div>
            <div className="mk-cell-option">
              {cols
                .filter(
                  (f) =>
                    !(f.type == "preview" && f.table != "") && f.table == ""
                )
                .map((f, i) => (
                  <div key={i}>
                    <div
                      className={classNames(
                        "mk-cell-option-item",
                        !predicate.colsHidden.includes(f.name + f.table) &&
                          "mk-is-active"
                      )}
                      onClick={(e) =>
                        hideColumn(
                          f,
                          !predicate.colsHidden.includes(f.name + f.table)
                        )
                      }
                      onContextMenu={(e) => showMenu(e, f)}
                    >
                      <div>{f.name} </div>
                    </div>
                  </div>
                ))}
              <div className="mk-cell-option-item">
                <div
                  className={classNames(`mk-icon-xsmall`)}
                  onClick={(e) => newProperty(e)}
                  dangerouslySetInnerHTML={{
                    __html: uiIconSet["mk-ui-plus"],
                  }}
                ></div>
              </div>
            </div>
            {dbSchema?.primary == "true" && contextInfo.type != "tag" && (
              <>
                <div className={classNames("mk-section-title")}>Contexts</div>

                <TagSelector plugin={props.plugin} canAdd={true}></TagSelector>
                {tagContexts.map((t) => (
                  <>
                    <div className={classNames("mk-section-title")}>
                      {t == "" ? contextDisplayName(contextInfo) : t}
                    </div>
                    <div className="mk-cell-option">
                      {cols
                        .filter(
                          (f) =>
                            !(f.type == "preview" && f.table != "") &&
                            f.table == t
                        )
                        .map((f, i) => (
                          <div key={i}>
                            <div
                              className={classNames(
                                "mk-cell-option-item",
                                !predicate.colsHidden.includes(
                                  f.name + f.table
                                ) && "mk-is-active"
                              )}
                              onClick={(e) =>
                                hideColumn(
                                  f,
                                  !predicate.colsHidden.includes(
                                    f.name + f.table
                                  )
                                )
                              }
                              onContextMenu={(e) => showMenu(e, f)}
                            >
                              <div>{f.name} </div>
                            </div>
                          </div>
                        ))}
                      <div className="mk-cell-option-item">
                        <div
                          className={classNames(`mk-icon-xsmall`)}
                          onClick={(e) => newProperty(e)}
                          dangerouslySetInnerHTML={{
                            __html: uiIconSet["mk-ui-plus"],
                          }}
                        ></div>
                      </div>
                    </div>
                  </>
                ))}
              </>
            )}
            {dbSchema?.primary == "true" && (
              <>
                <div className={classNames("mk-section-title")}>Metadata</div>
                <SyncMetadataComponent
                  plugin={props.plugin}
                  columns={cols}
                  syncColumn={(columns, table) =>
                    saveMetadata([columns], table)
                  }
                  files={data
                    .map((f) => getAbstractFileAtPath(app, f.File))
                    .filter((f) => f)}
                ></SyncMetadataComponent>
              </>
            )}
          </div>
        ) : (
          <ContextDesigner></ContextDesigner>
        )}
      </div>
      <div className="mk-section-tabs">
        <div
          className={classNames(
            "mk-section-title",
            section == 0 && "mk-is-active"
          )}
          onClick={() => setSection(0)}
        >
          <div
            className={classNames(`mk-icon-small`)}
            dangerouslySetInnerHTML={{
              __html: uiIconSet["mk-ui-edit"],
            }}
          ></div>
          Properties
        </div>
        <div
          className={classNames(
            "mk-section-title",
            section == 1 && "mk-is-active"
          )}
          onClick={() => setSection(1)}
        >
          <div
            className={classNames(`mk-icon-small`)}
            dangerouslySetInnerHTML={{
              __html: uiIconSet["mk-ui-stack"],
            }}
          ></div>
          Layout
        </div>
      </div>
    </>
  );
};
