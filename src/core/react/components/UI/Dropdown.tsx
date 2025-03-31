import { SelectOption, Superstate } from "makemd-core";
import React from "react";
import { windowFromDocument } from "shared/utils/dom";
export const Dropdown = (props: {
  superstate: Superstate;
  options?: SelectOption[];
  triggerMenu?: (e: React.MouseEvent) => void;
  value: string;
  selectValue?: (value: string) => void;
}) => {
  const openMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      offset,
      {
        ui: props.superstate.ui,
        editable: false,
        value: [props.value],
        options: props.options,
        saveOptions: (options: string[], value: string[]) => {
          props.selectValue(value[0]);
        },
        searchable: false,
      },
      windowFromDocument(e.view.document)
    );
  };
  return (
    <div
      className="mk-cell-option-item"
      onClick={(e) => (props.triggerMenu ? props.triggerMenu(e) : openMenu(e))}
    >
      <div>
        {props.options
          ? props.options.find((f) => f.value == props.value)?.name
          : props.value}
      </div>
      <div
        className="mk-cell-option-select mk-icon-xxsmall mk-icon-rotated"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//collapse-solid"),
        }}
      />
    </div>
  );
};
