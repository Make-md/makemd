import { showColorPickerMenu } from "core/react/components/UI/Menus/properties/colorPickerMenu";
import { Superstate } from "core/superstate/superstate";
import React from "react";

export const ColorPicker = (props: {
  superstate: Superstate;
  value: string;
  setValue: (value: string) => void;
}) => {
  const showMenu = (e: React.MouseEvent) => {
    const handleChangeComplete = (color: string) => {
      props.setValue(color);
    };
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showColorPickerMenu(
      props.superstate,
      { x: offset.left, y: offset.top + 30 },
      props.value,
      handleChangeComplete
    );
  };
  return (
    <div>
      <div
        className="mk-setter-color"
        onClick={(e) => showMenu(e)}
        style={{
          backgroundColor: props.value,
          width: 30,
          height: 30,
        }}
      ></div>
    </div>
  );
};
