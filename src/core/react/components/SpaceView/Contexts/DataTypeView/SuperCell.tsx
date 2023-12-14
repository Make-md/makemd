import { parseFieldValue } from "core/schemas/parseFieldValue";
import React, { useMemo } from "react";
import { DBRow } from "types/mdb";
import { TableCellProp } from "../TableView/TableView";
import { DataTypeView } from "./DataTypeView";

export const SuperCell = (props: TableCellProp & { row: DBRow }) => {
  const superProperty = useMemo(() => {
    const parsedValue = parseFieldValue(props.propertyValue, "super");
    const superPropertyName = parsedValue.dynamic
      ? props.row?.[parsedValue.field]
      : parsedValue.field;
    const property = props.superstate.superProperties.get(superPropertyName);
    return property
      ? {
          ...property,
          value: JSON.stringify(
            props.superstate.valueForSuperproperty(superPropertyName, property)
          ),
        }
      : null;
  }, [props.propertyValue]);

  return (
    <>
      {superProperty && (
        <DataTypeView
          {...props}
          updateFieldValue={(_, f) => props.saveValue(f)}
          updateValue={props.saveValue}
          column={{ ...superProperty, table: "" }}
          editable={true}
        ></DataTypeView>
      )}
    </>
  );
};
