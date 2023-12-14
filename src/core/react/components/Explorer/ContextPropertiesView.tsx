import { DataTypeView } from "core/react/components/SpaceView/Contexts/DataTypeView/DataTypeView";
import { showPropertyMenu } from "core/react/components/UI/Menus/contexts/spacePropertyMenu";
import {
  ContextEditorContext,
  ContextEditorProvider,
} from "core/react/context/ContextEditorContext";
import {
  SpaceContext,
  SpaceContextProvider,
} from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import { PathPropertyName } from "core/types/context";
import { optionValuesForColumn } from "core/utils/contexts/optionValuesForColumn";
import React, { useContext, useMemo } from "react";
import { stickerForField } from "schemas/mdb";
import { DBRow, SpaceProperty, SpaceTableColumn } from "types/mdb";
import {
  ContextMDBContext,
  ContextMDBProvider,
} from "../../context/ContextMDBContext";
import { PropertiesView } from "./PropertiesView";

export const ContextPropertiesView = (props: {
  superstate: Superstate;
  spacePaths: string[];
  path: string;
  showMetadata: boolean;
  hiddenFields: string[];
  editable: boolean;
}) => {
  const spaces = useMemo(
    () =>
      props.spacePaths
        .map((f) => props.superstate.spacesIndex.get(f)?.space)
        .filter((f) => f),
    [props.spacePaths]
  );
  return (
    <div className="mk-path-context-properties">
      {spaces.map((space, i) => (
        <SpaceContextProvider
          key={i}
          superstate={props.superstate}
          space={space}
        >
          <ContextMDBProvider
            key={i}
            superstate={props.superstate}
            path={props.path}
          >
            <ContextEditorProvider superstate={props.superstate}>
              <PathContextList
                superstate={props.superstate}
                path={props.path}
                color={"var(--tag-background)"}
              ></PathContextList>
            </ContextEditorProvider>
          </ContextMDBProvider>
        </SpaceContextProvider>
      ))}
      {props.path ? (
        <PropertiesView
          superstate={props.superstate}
          path={props.path}
          spaces={spaces.map((f) => f.path)}
          force={props.showMetadata}
          excludeKeys={props.hiddenFields ?? []}
          editable={props.editable}
        ></PropertiesView>
      ) : (
        <></>
      )}
    </div>
  );
};

type PathContext = {
  cols: SpaceProperty[];
  data: DBRow;
  dataIndex: number;
};

export const PathContextList = (props: {
  superstate: Superstate;
  path: string;
  color: string;
}) => {
  const { path } = props;
  const {
    spaceInfo,
    spaceState: spaceCache,
    pathState,
  } = useContext(SpaceContext);
  const { tableData, dbSchema } = useContext(ContextMDBContext);
  const {
    newColumn,
    data,
    cols,
    saveColumn,
    hideColumn,
    delColumn,
    sortColumn,
    updateFieldValue,
    updateValue,
    loadContextFields,
    predicate,
  } = useContext(ContextEditorContext);

  const pathContext: PathContext = useMemo(() => {
    return data && tableData
      ? {
          cols: tableData.cols.filter(
            (f) => f.primary != "true" && f.hidden != "true"
          ),
          data: data.find((r) => r[PathPropertyName] == path),
          dataIndex: data.findIndex((r) => r[PathPropertyName] == path),
        }
      : null;
  }, [tableData, path, data]);

  const saveField = (field: SpaceTableColumn, oldField: SpaceTableColumn) => {
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

  const showMenu = (e: React.MouseEvent, field: SpaceTableColumn) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const options = optionValuesForColumn(field.name, tableData);
    showPropertyMenu({
      superstate: props.superstate,
      position: { x: offset.left, y: offset.top + 30 },
      editable: true,
      options,
      field,
      fields: cols,
      contextPath: spaceInfo.path,
      saveField: (newField) => saveField(newField, field),
      hide: hideColumn,
      deleteColumn: delColumn,
      hidden: predicate.colsHidden.includes(field.name + field.table),
    });
  };
  return (
    pathContext &&
    pathContext.cols.length > 0 && (
      <>
        {pathContext.cols.map((f, i) => (
          <>
            <div key={i} className="mk-path-context-row">
              <div
                className="mk-path-context-field"
                onClick={(e) => showMenu(e, { ...f, table: "" })}
              >
                <div
                  className="mk-path-context-field-icon"
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker(stickerForField(f)),
                  }}
                ></div>
                <div className="mk-path-context-field-key">{f.name}</div>
                <div
                  className="mk-path-context-field-space  mk-icon-xsmall"
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker(
                      pathState.label?.sticker
                    ),
                  }}
                ></div>
              </div>
              {!f.type.startsWith("object") && (
                <div className="mk-path-context-value">
                  <DataTypeView
                    superstate={props.superstate}
                    initialValue={pathContext.data?.[f.name]}
                    row={pathContext.data ?? {}}
                    column={{ ...f, table: "" }}
                    editable={!spaceInfo.readOnly}
                    updateValue={(v) =>
                      updateValue(
                        f.name,
                        v,
                        "",
                        pathContext.dataIndex,
                        pathContext.data?.[PathPropertyName]
                      )
                    }
                    updateFieldValue={(fv, v) =>
                      updateFieldValue(
                        f.name,
                        fv,
                        v,
                        "",
                        pathContext.dataIndex,
                        pathContext.data?.[PathPropertyName]
                      )
                    }
                    contextTable={{}}
                  ></DataTypeView>
                </div>
              )}
            </div>
            {f.type.startsWith("object") && (
              <div className="mk-path-context-row">
                <DataTypeView
                  superstate={props.superstate}
                  initialValue={pathContext.data?.[f.name]}
                  row={pathContext.data ?? {}}
                  column={{ ...f, table: "" }}
                  editable={!spaceInfo.readOnly}
                  updateValue={(v) =>
                    updateValue(
                      f.name,
                      v,
                      "",
                      pathContext.dataIndex,
                      pathContext.data?.[PathPropertyName]
                    )
                  }
                  updateFieldValue={(fv, v) =>
                    updateFieldValue(
                      f.name,
                      fv,
                      v,
                      "",
                      pathContext.dataIndex,
                      pathContext.data?.[PathPropertyName]
                    )
                  }
                  contextTable={{}}
                ></DataTypeView>
              </div>
            )}
          </>
        ))}
      </>
    )
  );
};
