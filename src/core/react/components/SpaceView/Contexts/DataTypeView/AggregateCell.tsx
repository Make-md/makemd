import { parseFieldValue } from "core/schemas/parseFieldValue";
import { aggregateFnTypes } from "core/utils/contexts/predicate/aggregates";
import { ensureString } from "core/utils/strings";
import React, { useMemo } from "react";
import { PathPropertyName } from "shared/types/context";
import { DBRow, SpaceTableColumn, SpaceTables } from "shared/types/mdb";
import { CellEditMode, TableCellMultiProp } from "../TableView/TableView";
import { BooleanCell } from "./BooleanCell";
import { IconCell } from "./IconCell";
import { ImageCell } from "./ImageCell";
import { LinkCell } from "./LinkCell";
import { NumberCell } from "./NumberCell";
import { OptionCell } from "./OptionCell";

export const AggregateCell = (
  props: TableCellMultiProp & {
    source: string;
    row: DBRow;
    contextTable: SpaceTables;
    contextPath: string;
    columns: SpaceTableColumn[];
    saveOptions: (options: string, value: string) => void;
  }
) => {
  const initialValue = ensureString(props.initialValue);
  const type = useMemo(() => {
    const fieldValue = parseFieldValue(
      props.propertyValue,
      "aggregate",
      props.superstate
    );
    if (fieldValue.fn == "values") {
      const ref = fieldValue?.ref;
      if (ref == "$items") {
        const spacePath = props.row[PathPropertyName];
        const col = props.superstate.contextsIndex
          .get(spacePath)
          ?.contextTable?.cols?.find((f) => f.name == fieldValue?.field);
        return col?.type ?? "none";
      }
      const refField = props.columns.find((f) => f.name == fieldValue?.ref);
      if (refField) {
        const refFieldValue = parseFieldValue(
          refField.value,
          refField.type,
          props.superstate
        );
        const spacePath = refFieldValue?.space;
        const column = fieldValue?.field;
        const col = props.superstate.contextsIndex
          .get(spacePath)
          ?.contextTable?.cols?.find((f) => f.name == column);
        return col?.type ?? "none";
      } else {
        return "none";
      }
    }
    return aggregateFnTypes[fieldValue.fn]?.valueType;
  }, [props.propertyValue]);

  return type == "boolean" ? (
    <BooleanCell
      {...props}
      initialValue={initialValue}
      editMode={CellEditMode.EditModeReadOnly}
    />
  ) : initialValue?.length == 0 ? (
    <></>
  ) : type == "image" ? (
    <ImageCell
      {...props}
      initialValue={initialValue}
      editMode={CellEditMode.EditModeReadOnly}
      multi={true}
    />
  ) : type == "icon" ? (
    <IconCell
      {...props}
      initialValue={initialValue}
      multi={true}
      editMode={CellEditMode.EditModeReadOnly}
    ></IconCell>
  ) : type?.startsWith("link") || type == "file" ? (
    <LinkCell
      {...props}
      initialValue={initialValue}
      multi={true}
      editMode={CellEditMode.EditModeReadOnly}
    ></LinkCell>
  ) : type == "number" ? (
    <NumberCell
      {...props}
      initialValue={initialValue}
      editMode={CellEditMode.EditModeReadOnly}
    ></NumberCell>
  ) : (
    <OptionCell
      {...props}
      initialValue={initialValue}
      saveOptions={() => {}}
      editMode={CellEditMode.EditModeReadOnly}
      multi={true}
      source={props.source}
    />
  );
};
