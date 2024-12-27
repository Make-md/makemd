import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { parseLinkedNode } from "core/utils/frames/frame";
import React, { useContext, useEffect, useState } from "react";
import { FrameState } from "shared/types/frameExec";
import { FrameNodeViewProps } from "../ViewNodes/FrameView";
export const InputNodeView = (props: FrameNodeViewProps) => {
  const { selectionMode } = useContext(FrameSelectionContext);
  const { saveState, instance } = useContext(FrameInstanceContext);
  const [value, setValue] = useState("");
  const state = props.state;
  const type = props.state.styles?.as;

  useEffect(() => {
    const linkedNode = parseLinkedNode(props.state?.props?.value);

    if (linkedNode) {
      const node =
        linkedNode.node == "$root" ? instance.exec.id : linkedNode.node;
      setValue(instance.state?.[node]?.props?.[linkedNode.prop]);
    }
  }, [props.state.props]);
  return (
    <input
      className="mk-node-input"
      type={type}
      value={type == "checkbox" ? null : value}
      checked={value == "true"}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key == "Enter") {
          const _value =
            type == "text"
              ? e.currentTarget.value
              : type == "checkbox"
              ? (!e.currentTarget.checked).toString()
              : e.currentTarget.value;
          setValue("");
          if (typeof state.actions?.onEnter == "function") {
            state.actions?.onEnter(
              e,
              _value,
              instance.state,
              (s: FrameState) => saveState(s, instance),
              props.superstate.api
            );
          }
        }
      }}
      onChange={(e) => {
        const _value =
          type == "text"
            ? e.target.value
            : type == "checkbox"
            ? (!e.target.checked).toString()
            : e.target.value;
        setValue(_value);
        if (typeof state.actions?.onChange == "function") {
          state.actions?.onChange(
            e,
            _value,
            instance.state,
            (s: FrameState) => saveState(s, instance),
            props.superstate.api
          );
        }
      }}
      placeholder={state.styles.placeholder}
      style={
        {
          ...state?.styles,
        } as React.CSSProperties
      }
    />
  );
};
