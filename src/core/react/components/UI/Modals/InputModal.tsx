import { default as i18n } from "core/i18n";
import { Superstate } from "makemd-core";
import React, { useEffect, useRef, useState } from "react";
type Action = "rename" | "create folder" | "create note";

export type SectionAction = "rename" | "create";

export const openInputModal = (
  superstate: Superstate,
  title: string,
  value: string,
  saveValue: (val: string) => void,
  saveLabel: string,
  win: Window
) => {
  superstate.ui.openModal(
    title,
    <InputModal value={value} saveValue={saveValue} saveLabel={saveLabel} />,
    win
  );
};

export const InputModal = (props: {
  value: string;
  saveValue: (value: string) => void;
  saveLabel: string;
  hide?: () => void;
}) => {
  const [value, setValue] = useState(props.value);
  const save = () => {
    props.saveValue(value);
    if (props.hide) props.hide();
  };
  const ref = useRef(null);
  useEffect(() => {
    if (ref?.current) {
      ref.current.focus();
    }
  }, [ref]);
  return (
    <div className="mk-layout-column mk-gap-8">
      <input
        ref={ref}
        value={value}
        type="text"
        onChange={(e) => setValue(e.target.value)}
        className="mk-input mk-input-large"
        style={{
          width: "100%",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
        }}
      ></input>
      <div className="mk-modal-actions">
        <button onClick={() => save()}>{props.saveLabel}</button>
        <button onClick={() => props.hide && props.hide()}>
          {i18n.buttons.cancel}
        </button>
      </div>
    </div>
  );
};
