import { Sticker } from "core/react/components/UI/Stickers/Sticker";
import { Superstate } from "core/superstate/superstate";
import React from "react";

type Option = {
  icon: string;
  label: string;
  value: string | { [key: string]: string };
};
export const RadioGroup = (props: {
  name: string;
  value: string;
  options: Option[];
  superstate: Superstate;
  setValue: (value: string | { [key: string]: string }) => void;
}) => {
  return (
    <div className="mk-cell-radio-group">
      {props.options.map((f, i) => (
        <div key={i} onClick={() => props.setValue(f.value)}>
          <Sticker sticker={f.icon} ui={props.superstate.ui}></Sticker>
        </div>
      ))}
    </div>
  );
};
