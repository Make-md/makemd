import { default as i18n } from "core/i18n";
import React, { useState } from "react";
type Action = "rename" | "create folder" | "create note";

export type SectionAction = "rename" | "create";

export const InputModal = (props: {
  value: string;
  saveValue: (value: string) => void;
  saveLabel: string;
  hide: () => void;
}) => {
  const [value, setValue] = useState(props.value);
  const save = () => {
    props.saveValue(value);
    props.hide();
  };
  return (
    <div className="mk-layout-column mk-gap-8">
      <input
        value={value}
        type="text"
        onChange={(e) => setValue(e.target.value)}
        className="mk-input mk-input-large"
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
        }}
      ></input>
      <div className="mk-layout-row mk-justify-end mk-gap-8">
        <button onClick={() => save()}>{props.saveLabel}</button>
        <button onClick={() => props.hide()}>{i18n.buttons.cancel}</button>
      </div>
    </div>
  );
};
