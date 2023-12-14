import { DataTypeView } from "core/react/components/SpaceView/Contexts/DataTypeView/DataTypeView";
import { Superstate } from "core/superstate/superstate";
import { stringIsConst } from "core/utils/frames/frames";
import { removeQuotes } from "core/utils/strings";
import React from "react";
import { SpaceProperty } from "types/mdb";
import { FrameNode } from "types/mframe";
import { CodeEditorSetter } from "./CodeEditorSetter";
export const PropSetter = (props: {
  superstate: Superstate;
  node: FrameNode;
  value: string;
  field: SpaceProperty;
  saveValue: (value: string) => void;
  editCode: () => void;
}) => {
  return stringIsConst(props.value) ? (
    <>
      <DataTypeView
        superstate={props.superstate}
        initialValue={removeQuotes(props.value)}
        column={{ ...props.field, table: "" }}
        editable={true}
        updateValue={(value) => props.saveValue(`${value}`)}
      ></DataTypeView>
    </>
  ) : (
    <CodeEditorSetter
      superstate={props.superstate}
      name={props.field.name}
      value={props.value}
      type={"props"}
      node={props.node.id}
      editCode={props.editCode}
    ></CodeEditorSetter>
  );
};
