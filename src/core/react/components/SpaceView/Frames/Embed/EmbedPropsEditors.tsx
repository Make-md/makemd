import i18n from "core/i18n";
import React from "react";
import { SpaceProperty } from "types/mdb";
import { FrameNode, FrameTreeProp } from "types/mframe";

import { Superstate } from "core/superstate/superstate";
import { PropSetter } from "../Setters/PropSetter";
export const EmbedPropsEditor = (props: {
  node: FrameNode;
  fields: SpaceProperty[];
  superstate: Superstate;
  properties: FrameTreeProp;
  saveProperty: (properties: FrameTreeProp) => void;
  deleteNode: (node: FrameNode) => void;
}) => {
  return (
    <div>
      {props.fields.map((f, i) => (
        <div className="mk-frame-props" key={i}>
          {f.name}
          <PropSetter
            node={props.node}
            superstate={props.superstate}
            value={props.node.props[f.name]}
            field={f}
            saveValue={(value) => {
              props.saveProperty({ [f.name]: value });
            }}
            editCode={() => {}}
          ></PropSetter>
        </div>
      ))}

      <button onClick={() => props.deleteNode(props.node)}>
        {i18n.buttons.delete}
      </button>
    </div>
  );
};
