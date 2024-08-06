import { Superstate } from "core/superstate/superstate";
import { parseStylesToClass } from "core/utils/frames/renderer";
import { isTouchScreen } from "core/utils/ui/screen";
import React from "react";
import {
  FrameExecutable,
  FrameNodeState,
  FrameRunInstance,
  FrameState,
} from "types/mframe";
import { AudioNodeView } from "../EditorNodes/AudioNodeView";
import { ContentNodeView } from "../EditorNodes/ContentNodeView";
import { ContextNodeView } from "../EditorNodes/ContextNodeView";
import { FlowNodeView } from "../EditorNodes/FlowNodeView";
import { defaultFrameStyles } from "../EditorNodes/FrameEditorNodeView";
import { IconNodeView } from "../EditorNodes/IconNodeView";
import { ImageNodeView } from "../EditorNodes/ImageNodeView";
import { InputNodeView } from "../EditorNodes/InputNodeView";
import { TextNodeView } from "../EditorNodes/TextNodeView";
export type FrameNodeViewProps = {
  superstate: Superstate;
  treeNode: FrameExecutable;
  state: FrameNodeState;
};
export const FrameView = (props: {
  superstate: Superstate;
  treeNode: FrameExecutable;
  instance: FrameRunInstance;
  saveState: (state: FrameState, instance: FrameRunInstance) => void;
  source?: string;
  children?: React.ReactNode;
}) => {
  const nodeProps: FrameNodeViewProps = {
    superstate: props.superstate,
    treeNode: props.treeNode,
    state: props.instance.state[props.treeNode.id],
  };
  const innerComponents =
    props.treeNode.node.type == "input" ? (
      <InputNodeView {...nodeProps}></InputNodeView>
    ) : props.treeNode.node.type == "text" ? (
      <TextNodeView {...nodeProps}></TextNodeView>
    ) : props.treeNode.node.type == "icon" ? (
      <IconNodeView {...nodeProps}></IconNodeView>
    ) : props.treeNode.node.type == "audio" ? (
      <AudioNodeView {...nodeProps}></AudioNodeView>
    ) : props.treeNode.node.type == "image" ? (
      <ImageNodeView {...nodeProps}></ImageNodeView>
    ) : props.treeNode.node.type == "space" ? (
      <ContextNodeView {...nodeProps} source={props.source}></ContextNodeView>
    ) : props.treeNode.node.type == "content" ? (
      <ContentNodeView>
        {props.treeNode.children
          .filter((f) => f.node.type != "slides")
          .map((c, i) => (
            <FrameView
              superstate={props.superstate}
              key={i}
              treeNode={c}
              instance={props.instance}
              saveState={props.saveState}
              source={props.source}
            >
              {props.children}
            </FrameView>
          ))}
        {props.children}
      </ContentNodeView>
    ) : props.treeNode.node.type == "flow" ? (
      <FlowNodeView {...nodeProps} source={props.source}></FlowNodeView>
    ) : (
      props.treeNode.children
        .filter((f) => f.node.type != "slides")
        .map((c, i) => (
          <FrameView
            superstate={props.superstate}
            key={i}
            treeNode={c}
            instance={props.instance}
            saveState={props.saveState}
            source={props.source}
          >
            {props.children}
          </FrameView>
        ))
    );

  const hidden = props.instance.state[props.treeNode.id]?.styles
    ? props.instance.state[props.treeNode.id]?.styles?.hidden
      ? true
      : false
    : false;
  return (
    props.instance.state[props.treeNode.id] &&
    !hidden && (
      <div
        className={`mk-frame ${parseStylesToClass(
          props.instance.state[props.treeNode.id]?.styles
        )}`}
        data-path={props.treeNode.id}
        data-type={props.treeNode.node.type}
        onContextMenu={(e) => {
          if (
            typeof props.instance.state[props.treeNode.id].actions
              ?.onContextMenu == "function"
          ) {
            props.instance.state[props.treeNode.id].actions?.onContextMenu(
              e,
              null,
              props.instance.state,
              (s: FrameState) => props.saveState(s, props.instance),
              props.superstate.api
            );
            e.stopPropagation();
          }
        }}
        onClick={(e) => {
          if (e.detail === 2 || isTouchScreen(props.superstate.ui)) {
            if (
              typeof props.instance.state[props.treeNode.id].actions
                ?.onDoubleClick == "function"
            ) {
              props.instance.state[props.treeNode.id].actions?.onDoubleClick(
                e,
                null,
                props.instance.state,
                (s: FrameState) => props.saveState(s, props.instance),
                props.superstate.api
              );
              e.stopPropagation();
              return;
            }
          }
          if (e.detail === 1) {
            if (
              typeof props.instance.state[props.treeNode.id].actions?.onClick ==
              "function"
            ) {
              props.instance.state[props.treeNode.id].actions?.onClick(
                e,
                null,
                props.instance.state,
                (s: FrameState) => props.saveState(s, props.instance),
                props.superstate.api
              );
              e.stopPropagation();
            }
          }
        }}
        style={
          {
            ...defaultFrameStyles,
            ...props.instance.state[props.treeNode.id]?.styles,
          } as React.CSSProperties
        }
      >
        {innerComponents}
      </div>
    )
  );
};
