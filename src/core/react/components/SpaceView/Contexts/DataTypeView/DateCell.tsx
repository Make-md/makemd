import {
  DatePickerTimeMode,
  showDatePickerMenu,
} from "core/react/components/UI/Menus/properties/datePickerMenu";
import {
  formatDate,
  isoDateFormat,
  isValidDate,
  parseDate,
} from "core/utils/date";

import classNames from "classnames";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { windowFromDocument } from "shared/utils/dom";
import { safelyParseJSON } from "utils/parsers";

import { CellEditMode, TableCellProp } from "../TableView/TableView";

export const DateCell = (props: TableCellProp) => {
  const [value, setValue] = useState(props.initialValue);
  useEffect(() => {
    setValue(props.initialValue);
  }, [props.initialValue]);
  const date = useMemo(() => {
    const dateTime = parseDate(value);
    if (!isValidDate(dateTime)) {
      return null;
    }
    return dateTime;
  }, [value]);
  const saveValue = (date: Date, hasTime: boolean) => {
    const newValue = formatDate(
      props.superstate,
      date,
      hasTime ? isoDateFormat : "yyyy-MM-dd"
    );
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
      if (props.editMode <= CellEditMode.EditModeNone) {
        return;
      }

      const offset = e
        ? (e.target as HTMLElement).getBoundingClientRect()
        : ref.current.getBoundingClientRect();
      menuRef.current = showDatePickerMenu(
        props.superstate.ui,
        offset,
        windowFromDocument(e.view.document),
        date,
        saveValue,
        DatePickerTimeMode.Toggle,
        null,
        "bottom"
      );
    },
    [date]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key == "Enter" || e.key == "Escape") {
      (e.target as HTMLInputElement).blur();
      saveValue(date, false);
      menuRef.current.hide();
    }
  };
  const format = useMemo(
    () => safelyParseJSON(props.propertyValue)?.format,
    [props.propertyValue]
  );
  const isEmpty = !(value?.length > 0);
  return (
    <div className="mk-cell-date" onClick={(e) => !value && showPicker(e)}>
      <div
        className={classNames(
          "mk-cell-date-item",
          isEmpty && "mk-cell-date-new"
        )}
      >
        <div
          className="mk-icon-xsmall"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//calendar"),
          }}
        ></div>
        {isEmpty && "Select"}
        {props.editMode == CellEditMode.EditModeActive ? (
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
            {date
              ? formatDate(
                  props.superstate,
                  date,
                  format?.length > 0 ? format : null
                )
              : value}
          </div>
        )}
      </div>
    </div>
  );
};
