import { removeQuotes, wrapQuotes } from "core/utils/strings";
import { Superstate } from "makemd-core";
import React, { useState } from "react";
import { Command } from "shared/types/commands";
import { DBRow, SpaceProperty } from "shared/types/mdb";
import { CellEditMode } from "../../TableView/TableView";
import { DataPropertyView } from "../DataPropertyView";

export const ParameterSetter = (props: {
  superstate: Superstate;
  command: Command;
  value: DBRow;
  saveValue: (key: string, val: string) => void;
}) => {
  const [value, setValue] = useState<DBRow>(props.value);
  const saveValue = (key: string, val: string) => {
    setValue({ ...value, [key]: val });
    props.saveValue(key, val);
  };
  const stackedProperty = (field: SpaceProperty) => {
    return field.type.startsWith("object") || field.type == "super";
  };
  return (
    <div className="mk-cell-object">
      {props.command.fields.map((field, i) => {
        const isStacked = stackedProperty(field);
        return (
          <DataPropertyView
            key={i}
            superstate={props.superstate}
            initialValue={
              !field.type.startsWith("object")
                ? removeQuotes(value?.[field.name])
                : value?.[field.name]
            }
            compactMode={false}
            updateFieldValue={(fv, f) => {
              saveValue(
                field.name,
                !field.type.startsWith("object") ? wrapQuotes(f) : f
              );
            }}
            updateValue={(value) => {
              saveValue(
                field.name,
                !field.type.startsWith("object") ? wrapQuotes(value) : value
              );
            }}
            column={{ ...field, table: "" }}
            editMode={CellEditMode.EditModeAlways}
            columns={props.command.fields}
          ></DataPropertyView>
        );
      })}
    </div>
  );
};
