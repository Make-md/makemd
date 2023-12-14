import { TextCell } from "core/react/components/SpaceView/Contexts/DataTypeView/TextCell";
import { CellEditMode } from "core/react/components/SpaceView/Contexts/TableView/TableView";
import { Superstate } from "core/superstate/superstate";
import React from "react";

export const TextSetter = (props: {
  superstate: Superstate;
  name: string;
  value: string;
  setValue: (value: string) => void;
}) => {
  return (
    <div className="mk-setter-text">
      <TextCell
        initialValue={props.value}
        saveValue={props.setValue}
        editMode={CellEditMode.EditModeActive}
        setEditMode={() => null}
        superstate={props.superstate}
        propertyValue=""
      ></TextCell>
      <span>{props.name}</span>
    </div>
  );
};
