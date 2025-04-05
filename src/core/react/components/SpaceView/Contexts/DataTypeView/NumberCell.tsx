import { format as formatNumber } from "numfmt";
import React, { useEffect, useMemo, useRef } from "react";
import { safelyParseJSON } from "shared/utils/json";
import { CellEditMode, TableCellProp } from "../TableView/TableView";

export const NumberCell = (props: TableCellProp) => {
  const { initialValue, saveValue } = props;
  const [value, setValue] = React.useState(initialValue);

  const ref = useRef(null);
  // When the input is blurred, we'll call our table meta's updateData function
  const onBlur = () => {
    if (initialValue != value) saveValue(value);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key == "Enter") {
      (e.target as HTMLInputElement).blur();
      props.setEditMode(null);
    }
    if (e.key == "Escape") {
      setValue(initialValue);
      (e.target as HTMLInputElement).blur();
      props.setEditMode(null);
    }
  };

  // If the initialValue is changed external, sync it up with our state
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (props.editMode == CellEditMode.EditModeActive) {
      ref?.current?.focus();
    }
  }, [props.editMode]);
  const format = useMemo(
    () => safelyParseJSON(props.propertyValue)?.format,
    [props.propertyValue]
  );
  return props.editMode > CellEditMode.EditModeView ? (
    <input
      className="mk-cell-text"
      type="number"
      ref={ref}
      value={(value as string) ?? ""}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    />
  ) : (
    <div className="mk-cell-number">
      {format?.length > 0 && value
        ? formatNumber(format, parseFloat(value))
        : value ?? ""}
    </div>
  );
};
