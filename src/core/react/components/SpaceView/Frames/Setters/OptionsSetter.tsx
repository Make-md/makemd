import { OptionCell } from "core/react/components/SpaceView/Contexts/DataTypeView/OptionCell";
import { Superstate } from "core/superstate/superstate";
import React from "react";
export const OptionSetter = (props: {
  superstate: Superstate;
  value: string;
  saveValue: (value: string) => void;
  options: string[];
}) => {
  const viewProps = {
    initialValue: props.value as string,
    saveValue: props.saveValue,
    editMode: 3,
    setEditMode: () => {},
    superstate: props.superstate,
  };

  return (
    <OptionCell
      {...viewProps}
      options={props.options.join(",")}
      multi={false}
      saveOptions={(_: string, value: string) => props.saveValue(value)}
    ></OptionCell>
  );
};
