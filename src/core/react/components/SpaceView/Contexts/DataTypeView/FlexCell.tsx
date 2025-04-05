import { showPropertyMenu } from "core/react/components/UI/Menus/contexts/spacePropertyMenu";
import { parseFieldValue, parseFlexValue } from "core/schemas/parseFieldValue";
import React from "react";
import { fieldTypes, stickerForField } from "schemas/mdb";
import { PathPropertyName } from "shared/types/context";
import { DBRow, SpaceTableColumn, SpaceTables } from "shared/types/mdb";
import { Rect } from "shared/types/Pos";
import { safelyParseJSON } from "shared/utils/json";
import { TableCellProp } from "../TableView/TableView";
import { DataTypeView } from "./DataTypeView";

export const FlexCell = (
  props: TableCellProp & {
    source: string;
    row: DBRow;
    contextTable: SpaceTables;
    contextPath: string;
    columns: SpaceTableColumn[];
    saveOptions: (options: string, value: string) => void;
  }
) => {
  const fieldType = parseFieldValue(props.propertyValue, props.property.type);
  const value = parseFlexValue(props.initialValue);
  const initialValue = value?.value;
  const initialType = value?.type ?? fieldType?.type;
  const initialConfig = { ...fieldType, ...(value?.config ?? {}) };
  const field = {
    ...props.property,
    type: initialType,
    value: JSON.stringify(initialConfig),
  };
  const selectPropertyTypeMenu = (
    rect: Rect,
    win: Window,
    selectedType: (_: string[], value: string[]) => void
  ) => {
    return props.superstate.ui.openMenu(
      rect,
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        searchable: false,
        saveOptions: selectedType,
        value: [],
        showAll: true,
        options: fieldTypes
          .filter((f) => f.flex)
          .reduce((acc, f) => {
            const option = {
              name: f.label,
              value: f.type,
              icon: f.icon,
            };
            if (f.multi) {
              return [
                ...acc,
                option,
                {
                  ...option,
                  name: f.label + "-multi",
                  value: f.multiType,
                },
              ];
            }
            return [...acc, option];
          }, []),
      },
      win
    );
  };
  const saveValue = (value: string, config?: string) => {
    const newFlexValue = {
      type: initialType,
      value: value,
      config: config ? safelyParseJSON(config) : initialConfig,
    };
    props.saveValue(JSON.stringify(newFlexValue));
  };
  return (
    <div className="mk-cell-flex">
      <DataTypeView
        superstate={props.superstate}
        initialValue={initialValue}
        column={field}
        columns={props.columns}
        row={props.row}
        updateValue={(value: string) => {
          saveValue(value);
        }}
        updateFieldValue={(fieldValue: string, value: string) => {
          saveValue(value, fieldValue);
        }}
        editMode={props.editMode}
        setEditMode={props.setEditMode}
      ></DataTypeView>
      <div
        className="mk-icon-small"
        style={{ height: "24px", color: "var(--mk-ui-text-tertiary)" }}
        onClick={(e) =>
          showPropertyMenu({
            superstate: props.superstate,
            rect: e.currentTarget.getBoundingClientRect(),
            win: window,
            editable: true,
            options: [],
            field: field,
            fields: props.columns,
            contextPath: props.contextPath,
            saveField: (field: SpaceTableColumn) => {
              const newFlexValue = {
                type: field.type,
                value: initialValue,
                config: parseFieldValue(field.value, field.type),
              };
              props.saveValue(JSON.stringify(newFlexValue));
            },
            flex: true,
            rowPath: props.row[PathPropertyName],
          })
        }
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker(stickerForField(field)),
        }}
      ></div>
    </div>
  );
};
