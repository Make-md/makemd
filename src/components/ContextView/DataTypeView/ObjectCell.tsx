import React from "react";
import { safelyParseJSON } from "utils/json";
import { TableCellProp } from "../TableView/TableView";

export const ObjectCell = (props: TableCellProp) => {
  const { initialValue, saveValue } = props;

  const [value, setValue] = React.useState(safelyParseJSON(initialValue));

  const saveKey = (key: string, newKey: string) => {
    if (key != newKey)
      saveValue({
        ...value,
        [newKey]: value[key],
        [key]: undefined,
      });
  };
  const saveVal = (key: string, val: string) => {
    saveValue({
      ...value,
      [key]: val,
    });
  };

  // If the initialValue is changed external, sync it up with our state
  React.useEffect(() => {
    setValue(safelyParseJSON(initialValue));
  }, [initialValue]);

  return (
    <div className="mk-cell-object">
      {Object.keys(value).map((f) => (
        <div className="mk-cell-object-row">
          <input
            onClick={(e) => e.stopPropagation()}
            className="mk-cell-text"
            type="text"
            value={f as string}
            onBlur={(e) => saveKey(f, e.target.value)}
          />
          <input
            onClick={(e) => e.stopPropagation()}
            className="mk-cell-text"
            type="text"
            value={value[f] as string}
            onBlur={(e) => saveVal(f, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
};
