import { Pos } from "types/Pos";

import { Superstate } from "core/superstate/superstate";
import React, { useState } from "react";
import { colors } from "schemas/color";

export const ColorPicker = (props: {
  color: string;
  hide: () => void;
  saveValue: (color: string) => void;
}) => {
  const [value, setValue] = useState(props.color);
  return (
    <div>
      {colors.map((c, i) => (
        <div
          key={i}
          onMouseDown={() => {
            setValue(c[1]);
            props.saveValue(c[1]);
            props.hide();
          }}
          className="mk-color"
          style={{ background: c[1] }}
        ></div>
      ))}
    </div>
    //@ts-ignore
    // <SketchPicker
    //   color={value}
    //   onChangeComplete={(cr) => {
    //     if (loaded.current) {
    //       setValue(cr.hex);
    //       props.saveValue(cr.hex);
    //       props.hide();
    //       loaded.current = false;
    //     }
    //   }}
    // />
  );
};

export const showColorPickerMenu = (
  superstate: Superstate,
  point: Pos,
  value: string,
  setValue: (color: string) => void
) => {
  superstate.ui.openCustomMenu(point, (props: { hide: () => void }) => (
    <ColorPicker
      color={value}
      saveValue={setValue}
      hide={() => props.hide()}
    ></ColorPicker>
  ));
};
