import React, { useEffect } from "react";
import { SpaceTableColumn } from "types/mdb";
import { CellEditMode, TableCellProp } from "../TableView/TableView";

export const BooleanCell = (
  props: TableCellProp & { column: SpaceTableColumn }
) => {
  const { initialValue, saveValue } = props;
  const [value, setValue] = React.useState(initialValue == "true");

  // When the input is blurred, we'll call our table meta's updateData function
  const onChange = () => {
    if (props.editMode == CellEditMode.EditModeReadOnly) {
      return;
    }
    setValue(!value);
    saveValue(!value ? "true" : "false");
  };

  useEffect(() => {
    if (props.editMode == CellEditMode.EditModeActive) {
      setValue(!value);
      saveValue(!value ? "true" : "false");
      props.setEditMode(null);
    }
  }, [props.editMode]);

  // If the initialValue is changed external, sync it up with our state
  React.useEffect(() => {
    setValue(initialValue == "true");
  }, [initialValue]);

  if (props.editMode < CellEditMode.EditModeView) {
    return (
      <div className="mk-cell-boolean">
        <input type="checkbox" checked={value} onChange={onChange} />
      </div>
    );
  }
  return (
    <div className="mk-cell-boolean">
      <input type="checkbox" checked={value} onChange={onChange} />
    </div>
  );
};
