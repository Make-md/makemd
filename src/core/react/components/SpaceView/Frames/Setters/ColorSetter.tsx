import { showColorPickerMenu } from "core/react/components/UI/Menus/properties/colorPickerMenu";
import { Superstate } from "makemd-core";
import React from "react";
import { windowFromDocument } from "utils/dom";
export const ColorSetter = (props: {
  superstate: Superstate;
  value: string;
  setValue: (value: string) => void;
}) => {
  const showColorMenu = (e: React.MouseEvent, prop: string) => {
    const handleChangeComplete = (color: string) => {
      props.setValue(color);
    };
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showColorPickerMenu(
      props.superstate,
      offset,
      windowFromDocument(e.view.document),
      props.value,
      handleChangeComplete
    );
  };
  return (
    <div
      className="mk-color"
      style={{
        background: props.value,
      }}
      onClick={(e) => {
        showColorMenu(e, "--text-normal");
      }}
    ></div>
  );
};
