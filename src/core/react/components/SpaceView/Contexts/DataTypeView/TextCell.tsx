import React, { useEffect, useRef } from "react";
import { CellEditMode, TableCellProp } from "../TableView/TableView";

export const TextCell = (props: TableCellProp) => {
  const { initialValue, saveValue } = props;

  const ref = useRef(null);
  // When the input is blurred, we'll call our table meta's updateData function
  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const value = e.currentTarget.innerText;
    if (initialValue != value) saveValue(value);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key == "Enter") {
      if (!e.shiftKey) {
        (e.target as HTMLInputElement).blur();
        props.setEditMode(null);
      }
    }
    if (e.key == "Escape") {
      ref.current.innerText = initialValue;
      (e.target as HTMLInputElement).blur();
      props.setEditMode(null);
    }
  };

  useEffect(() => {
    if (props.editMode == CellEditMode.EditModeActive) {
      if (ref?.current) {
        const sel = window.getSelection();
        sel.selectAllChildren(ref.current);
        sel.collapseToEnd();
      }
    }
  }, [props.editMode]);

  return props.editMode > CellEditMode.EditModeView ? (
    <div
      onClick={(e) => e.stopPropagation()}
      className="mk-cell-text"
      ref={ref}
      data-ph={props.compactMode ? props.property.name : "Empty"}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      contentEditable={true}
      dangerouslySetInnerHTML={{ __html: initialValue }}
    />
  ) : (
    <div className="mk-cell-text">{initialValue}</div>
  );
};
