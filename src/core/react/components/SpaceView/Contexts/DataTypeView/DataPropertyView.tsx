import { showNewPropertyMenu } from "core/react/components/UI/Menus/contexts/newSpacePropertyMenu";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { i18n } from "makemd-core";
import React, { useMemo } from "react";
import { windowFromDocument } from "utils/dom";
import { parseObject } from "utils/parsers";
import { propertyIsObjectType } from "utils/properties";
import { PropertyField } from "../ContextBuilder/ContextListEditSelector";
import { CellEditMode } from "../TableView/TableView";
import { DataTypeView, DataTypeViewProps } from "./DataTypeView";
import { ObjectType } from "./ObjectCell";
export type DataPropertyViewProps = DataTypeViewProps & {
  propertyMenu?: (e: React.MouseEvent) => void;
  linkProp?: (e: React.MouseEvent) => void;
  path?: string;
  contexts?: string[];
  draggable?: boolean;
};
export const DataPropertyView = (props: DataPropertyViewProps) => {
  const isObjectType = useMemo(
    () => propertyIsObjectType(props.column),
    [props.column]
  );

  const parsedValue = parseFieldValue(
    props.column.value,
    props.column.type,
    props.superstate
  );
  const saveType = (newType: ObjectType, _value: Record<string, string>) => {
    const value = parseObject(
      props.initialValue ?? "",
      props.column.type == "object-multi"
    );
    if (props.column.type == "object-multi") {
      props.updateFieldValue(
        JSON.stringify({ ...parsedValue, type: newType }),
        JSON.stringify(value)
      );
    } else {
      props.updateFieldValue(
        JSON.stringify({ ...parsedValue, type: newType }),
        JSON.stringify(_value)
      );
    }
  };

  const newProperty = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const type = parseFieldValue(props.column.value, props.column.type)?.type;
    const value = parseObject(
      props.initialValue ?? "",
      props.column.type == "object-multi"
    );
    showNewPropertyMenu(
      props.superstate,
      offset,
      windowFromDocument(e.view.document),
      {
        spaces: [],
        fields: [],
        saveField: (source, field) => {
          saveType(
            {
              ...(type ?? {}),
              [field.name]: { type: field.type, label: field.name },
            },
            {
              ...value,
              [field.name]: "",
            }
          );
          return true;
        },
        fileMetadata: true,
      }
    );
  };

  const insertMultiValue = (index: number) => {
    const type = parseFieldValue(props.column.value, props.column.type)?.type;
    const value = parseObject(
      props.initialValue ?? "",
      props.column.type == "object-multi"
    );
    const item = Object.keys(type).reduce((p, c) => ({ ...p, [c]: "" }), {});
    props.updateValue(
      JSON.stringify([...value.slice(0, index), item, ...value.slice(index)])
    );
  };
  return !props.compactMode ? (
    <>
      <div className="mk-path-context-row">
        <PropertyField
          superstate={props.superstate}
          path={props.path}
          property={props.column}
          onClick={(e) => props.propertyMenu && props.propertyMenu(e)}
          contexts={props.contexts}
          draggable={props.draggable}
        ></PropertyField>
        <div className="mk-path-context-value">
          {isObjectType ? (
            !props.compactMode && (
              <div className="mk-cell-object-options">
                {props.editMode > CellEditMode.EditModeValueOnly && (
                  <button
                    onClick={(e) => newProperty(e)}
                    className="mk-inline-button"
                  >
                    <div
                      className="mk-icon-xsmall"
                      dangerouslySetInnerHTML={{
                        __html: props.superstate.ui.getSticker("ui//plus"),
                      }}
                    ></div>
                    {i18n.labels.propertyFileProp}
                  </button>
                )}
                {props.column.type == "object-multi" && (
                  <button
                    onClick={(e) => insertMultiValue(0)}
                    className="mk-inline-button"
                  >
                    <div
                      className="mk-icon-xsmall"
                      dangerouslySetInnerHTML={{
                        __html: props.superstate.ui.getSticker("ui//insert"),
                      }}
                    ></div>
                    {parsedValue?.typeName ?? "Object"}
                  </button>
                )}
              </div>
            )
          ) : (
            <DataTypeView {...props}></DataTypeView>
          )}
        </div>
        {props.linkProp && (
          <>
            <span></span>
            <div
              className="mk-icon-small"
              style={{ height: "24px" }}
              onClick={(e) => props.linkProp(e)}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//plug"),
              }}
            ></div>
          </>
        )}
      </div>
      {isObjectType && !props.compactMode && (
        <div className="mk-path-context-row" style={{ marginLeft: "30px" }}>
          <DataTypeView {...props}></DataTypeView>
        </div>
      )}
    </>
  ) : (
    <div>
      <DataTypeView {...props}></DataTypeView>
    </div>
  );
};
