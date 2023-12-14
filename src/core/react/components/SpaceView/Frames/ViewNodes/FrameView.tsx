import { Superstate } from "core/superstate/superstate";
import { parseStylesToClass } from "core/utils/frames/renderer";
import React, { FunctionComponent } from "react";
import { FrameRunInstance, FrameState, FrameTreeNode } from "types/mframe";
import { ContentNodeView } from "../EditorNodes/ContentNodeView";
import { FlowNodeView } from "../EditorNodes/FlowNodeView";
import { defaultFrameStyles } from "../EditorNodes/FrameNodeView";
import { IconNodeView } from "../EditorNodes/IconNodeView";
import { ImageNodeView } from "../EditorNodes/ImageNodeView";
import { SpaceNodeView } from "../EditorNodes/SpaceNodeView";
import { TextNodeView } from "../EditorNodes/TextNodeView";

export const FrameView = (props: {
  superstate: Superstate;
  treeNode: FrameTreeNode;
  instance: FrameRunInstance;
  saveState: (state: FrameState, instance: FrameRunInstance) => void;
  source?: string;
  children?: React.ReactNode;
}) => {
  const innerComponents =
    props.treeNode.node.type == "text" ? (
      <TextNodeView
        treeNode={props.treeNode}
        instance={props.instance}
        editable={false}
      ></TextNodeView>
    ) : props.treeNode.node.type == "icon" ? (
      <IconNodeView
        superstate={props.superstate}
        treeNode={props.treeNode}
        instance={props.instance}
        editable={false}
      ></IconNodeView>
    ) : props.treeNode.node.type == "image" ? (
      <ImageNodeView
        superstate={props.superstate}
        treeNode={props.treeNode}
        instance={props.instance}
        editable={false}
      ></ImageNodeView>
    ) : props.treeNode.node.type == "space" ? (
      <SpaceNodeView
        treeNode={props.treeNode}
        instance={props.instance}
        superstate={props.superstate}
        editable={false}
      ></SpaceNodeView>
    ) : props.treeNode.node.type == "content" ? (
      <ContentNodeView>{props.children}</ContentNodeView>
    ) : props.treeNode.node.type == "flow" ? (
      <FlowNodeView
        treeNode={props.treeNode}
        instance={props.instance}
        superstate={props.superstate}
        source={props.source}
        editable={false}
      ></FlowNodeView>
    ) : (
      props.treeNode.children.map((c, i) => (
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
  const parseAs = (role: string) =>
    role == "checkbox" || role == "text" || role == "range" || role == "number"
      ? "input"
      : role;
  const tag: string | FunctionComponent =
    parseAs(props.instance.state[props.treeNode.id]?.styles?.as) ?? "div";
  const type =
    tag == "input" ? props.instance.state[props.treeNode.id]?.styles?.as : null;

  return (
    props.instance.state[props.treeNode.id] &&
    React.createElement(
      tag,
      {
        className: `mk-frame ${parseStylesToClass(
          props.instance.state[props.treeNode.id]?.styles
        )}`,
        type: type,
        onClick: (e) => {
          if (
            typeof props.instance.state[props.treeNode.id].actions?.onClick ==
            "function"
          ) {
            props.instance.state[props.treeNode.id].actions?.onClick(
              e,
              props.instance.state,
              (s: FrameState) => props.saveState(s, props.instance),
              props.superstate.api
            );
            e.stopPropagation();
          }
        },
        style: {
          ...defaultFrameStyles,
          ...props.instance.state[props.treeNode.id]?.styles,
        },
      },
      [innerComponents]
    )
  );
};
