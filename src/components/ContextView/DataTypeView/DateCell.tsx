import { showDatePickerMenu } from "components/ui/menus/datePickerMenu";
import { format } from "date-fns";
import { useCallback } from "preact/hooks";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { formatDate } from "utils/date";
import { CellEditMode, TableCellProp } from "../TableView/TableView";

export const DateCell = (props: TableCellProp) => {
  const [value, setValue] = useState(props.initialValue);
  useEffect(() => {
    setValue(props.initialValue);
  }, [props.initialValue]);
  const date = useMemo(() => {
    const dateTime = Date.parse(value);
    return dateTime > 0
      ? new Date(dateTime + new Date().getTimezoneOffset() * 60 * 1000)
      : null;
  }, [value]);
  const saveValue = (date: Date) => {
    const newValue = format(date, "yyyy-MM-dd");
    props.saveValue(newValue);
    setValue(newValue);
    props.setEditMode(null);
  };
  const menuRef = useRef(null);
  const ref = useRef(null);
  useEffect(() => {
    if (props.editMode == CellEditMode.EditModeActive) {
      if (ref.current) {
        showPicker();
        ref.current.focus();
      }
    }
  }, [props.editMode]);

  const showPicker = useCallback(
    (e?: React.MouseEvent) => {
      if (props.editMode <= 0) {
        return;
      }
      const offset = e
        ? (e.target as HTMLElement).getBoundingClientRect()
        : ref.current.getBoundingClientRect();
      menuRef.current = showDatePickerMenu(
        { x: offset.left - 4, y: offset.bottom - 4 },
        date,
        saveValue
      );
    },
    [date]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key == "Enter" || e.key == "Escape") {
      (e.target as HTMLInputElement).blur();
      saveValue(date);
      menuRef.current.hide();
    }
  };
  return (
    <div className="mk-cell-date" onClick={(e) => !value && showPicker(e)}>
      {props.editMode == 2 ? (
        <input
          onClick={(e) => e.stopPropagation()}
          className="mk-cell-text"
          ref={ref}
          type="text"
          value={value as string}
          onChange={(e) => setValue(e.target.value)}
          onMouseDown={() => showPicker()}
          onKeyDown={onKeyDown}
          // onBlur={onBlur}
        />
      ) : (
        <div className="mk-cell-date-value" onClick={(e) => showPicker(e)}>
          {date ? formatDate(props.plugin, date, props.propertyValue) : value}
        </div>
      )}
    </div>
  );
};
