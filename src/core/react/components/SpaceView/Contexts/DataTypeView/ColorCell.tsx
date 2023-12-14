import { showColorPickerMenu } from "core/react/components/UI/Menus/properties/colorPickerMenu";
import React from "react";
import { TableCellProp } from "../TableView/TableView";

export const ColorCell = (props: TableCellProp) => {
  const showMenu = (e: React.MouseEvent) => {
    const handleChangeComplete = (color: string) => {
      props.saveValue(color);
    };
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showColorPickerMenu(
      props.superstate,
      { x: offset.left, y: offset.top + 30 },
      props.initialValue,
      handleChangeComplete
    );
  };
  return (
    <div>
      <div
        className="mk-setter-color"
        onClick={(e) => showMenu(e)}
        style={{
          backgroundColor: props.initialValue,
          width: 30,
          height: 30,
        }}
      ></div>
    </div>
  );
};
