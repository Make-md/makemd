import { TFile } from "obsidian";
import React, { useEffect, useMemo, useRef } from "react";
import { getAbstractFileAtPath } from "utils/file";
import { CellEditMode, TableCellProp } from "../TableView/TableView";

export const ImageCell = (props: TableCellProp) => {
  const { initialValue, saveValue } = props;
  const [value, setValue] = React.useState(initialValue);
  const ref = useRef(null);
  useEffect(() => {
    if (props.editMode == CellEditMode.EditModeActive) {
      ref.current.focus();
    }
  }, []);
  const file = useMemo(() => getAbstractFileAtPath(app, value), [value]);
  // When the input is blurred, we'll call our table meta's updateData function
  const onBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (initialValue != newValue) {
      setValue(newValue);
      saveValue(newValue);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key == "Enter" || e.key == "Escape") {
      (e.target as HTMLInputElement).blur();
      props.setEditMode(null);
    }
  };

  // If the initialValue is changed external, sync it up with our state
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <>
      {props.editMode >= 2 && (
        <div>
          <input
            className="mk-cell-text"
            type="text"
            ref={ref}
            value={value as string}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
          />
        </div>
      )}
      {props.editMode > 0 && (
        <div>
          <img src={file ? app.vault.getResourcePath(file as TFile) : value} />
        </div>
      )}
    </>
  );
};
