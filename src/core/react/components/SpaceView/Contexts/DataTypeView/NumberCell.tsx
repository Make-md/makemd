import { format as formatNumber } from "numfmt";
import React, { useEffect, useMemo, useRef } from "react";
import { safelyParseJSON } from "shared/utils/json";
import { CellEditMode, TableCellProp } from "../TableView/TableView";
import { parseFieldValue } from "core/schemas/parseFieldValue";

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
  
  const parsedConfig = useMemo(
    () => parseFieldValue(props.propertyValue, "number"),
    [props.propertyValue]
  );
  
  const format = parsedConfig?.format;
  
  // Render sticker if format is 'sticker' and value exists
  const renderNumberDisplay = () => {
    if (format === "sticker" && parsedConfig?.sticker && value) {
      // Create a sticker string by repeating the sticker based on the number value
      const numValue = Math.floor(parseFloat(value));
      if (numValue > 0 && numValue <= 10) {
        // Only show stickers for reasonable numbers (1-10)
        return (
          <div className="mk-cell-number-stickers">
            {Array.from({ length: numValue }, (_, i) => (
              <span
                key={i}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker(parsedConfig.sticker),
                }}
              />
            ))}
          </div>
        );
      } else if (numValue > 0) {
        // For larger numbers or decimals, show the sticker with the number
        return (
          <div className="mk-cell-number-sticker">
            <span
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker(parsedConfig.sticker),
              }}
            />
            <span className="mk-cell-number-count">{value}</span>
          </div>
        );
      }
    }
    
    // Default number formatting
    return format?.length > 0 && format !== "sticker" && value
      ? formatNumber(format, parseFloat(value))
      : value ?? "";
  };
  
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
      {renderNumberDisplay()}
    </div>
  );
};
