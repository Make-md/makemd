import { parseFieldValue } from "core/schemas/parseFieldValue";
import React, { useEffect, useMemo } from "react";
import { CellEditMode, TableCellProp } from "../TableView/TableView";

export const BooleanCell = (props: TableCellProp) => {
  const { initialValue, saveValue } = props;
  const [value, setValue] = React.useState(
    initialValue == "true" ? true : initialValue == "false" ? false : undefined
  );

  // Parse the field configuration to get custom stickers
  const parsedConfig = useMemo(
    () => parseFieldValue(props.propertyValue, "boolean"),
    [props.propertyValue]
  );

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
    setValue(
      initialValue == "true"
        ? true
        : initialValue == "false"
        ? false
        : undefined
    );
  }, [initialValue]);

  // Render sticker if configured, otherwise render checkbox
  const renderBooleanDisplay = () => {
    const sticker = value
      ? parsedConfig?.checked
      : value === false
      ? parsedConfig?.unchecked
      : parsedConfig?.indeterminate;

    if (sticker) {
      return (
        <div
          className="mk-cell-boolean-sticker"
          onClick={onChange}
          style={{
            cursor:
              props.editMode >= CellEditMode.EditModeView
                ? "pointer"
                : "default",
          }}
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker(sticker),
          }}
        />
      );
    }

    return <input type="checkbox" checked={value} onChange={onChange} />;
  };

  if (props.editMode < CellEditMode.EditModeView) {
    return <div className="mk-cell-boolean">{renderBooleanDisplay()}</div>;
  }
  return <div className="mk-cell-boolean">{renderBooleanDisplay()}</div>;
};
