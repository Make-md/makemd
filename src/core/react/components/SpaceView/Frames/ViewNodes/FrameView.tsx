import { parseStylesToClass } from "core/utils/frames/renderer";
import {
  hasStatePrefixes,
  InteractionState,
  parseStylesForState,
} from "core/utils/frames/stateStyles";
import { isTouchScreen } from "core/utils/ui/screen";
import { Superstate } from "makemd-core";
import React, { useMemo, useState } from "react";
import {
  FrameExecutable,
  FrameNodeState,
  FrameRunInstance,
  FrameState,
} from "shared/types/frameExec";
import { AudioNodeView } from "../EditorNodes/AudioNodeView";
import { ContentNodeView } from "../EditorNodes/ContentNodeView";
import { ContextNodeView } from "../EditorNodes/ContextNodeView";
import { FlowNodeView } from "../EditorNodes/FlowNodeView";
import { defaultFrameStyles } from "../EditorNodes/FrameEditorNodeView";
import { IconNodeView } from "../EditorNodes/IconNodeView";
import { ImageNodeView } from "../EditorNodes/ImageNodeView";
import { InputNodeView } from "../EditorNodes/InputNodeView";
import { TextNodeView } from "../EditorNodes/TextNodeView";
import { VisualizationNodeView } from "../EditorNodes/VisualizationNodeView";
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
  const styles = useMemo(
    () =>
      props.instance.state[props.treeNode.id].styles
        ? {
            ...props.instance.state[props.treeNode.id]?.styles?.theme,
            ...props.instance.state[props.treeNode.id]?.styles,
          }
        : {},
    [props.instance.state, props.treeNode.id]
  );
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
    ) : props.treeNode.node.type == "visualization" ? (
      <VisualizationNodeView
        {...nodeProps}
        source={props.source}
      ></VisualizationNodeView>
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

  const hidden = styles ? (styles.hidden ? true : false) : false;

  // Interaction state management for hover, press, focus, etc.
  const [interactionState, setInteractionState] = useState<InteractionState>(
    {}
  );

  // Check if this node has any state-prefixed styles to determine if we need interaction tracking
  const hasStateStyles = useMemo(() => {
    // Check for direct state prefixes in node styles
    const hasDirectStateStyles = hasStatePrefixes(styles);
    // Also enable for nodes with semantic elements (they might have hover styles in StyleAst)
    return hasDirectStateStyles;
  }, [styles]);

  const canClick =
    props.treeNode.node.interactions?.onClick &&
    typeof props.instance.state[props.treeNode.id].actions?.[
      props.treeNode.node.interactions?.onClick
    ] == "function";

  const canDoubleClick = props.treeNode.node.interactions?.onDoubleClick
    ? (e: React.MouseEvent) => {
        if (
          typeof props.instance.state[props.treeNode.id].actions?.[
            props.treeNode.node.interactions?.onDoubleClick
          ] == "function"
        ) {
          props.instance.state[props.treeNode.id].actions?.[
            props.treeNode.node.interactions?.onDoubleClick
          ](
            e,
            null,
            props.instance.state,
            (s: FrameState) => props.saveState(s, props.instance),
            props.superstate.api
          );
          e.stopPropagation?.();
        }
      }
    : undefined;

  // Compute styles with interaction state
  const processedStyles = useMemo(() => {
    // Apply state-based styles if we have interaction states
    if (hasStateStyles) {
      return parseStylesForState(styles, interactionState);
    }

    return styles;
  }, [styles, interactionState, hasStateStyles]);

  return (
    props.instance.state[props.treeNode.id] &&
    !hidden && (
      <div
        className={`mk-frame ${parseStylesToClass(processedStyles)}`}
        data-path={props.treeNode.id}
        data-type={props.treeNode.node.type}
        onContextMenu={(e) => {
          if (props.treeNode.node.interactions?.onContextMenu) {
            e.preventDefault?.();
            props.instance.state[props.treeNode.id].actions?.[
              props.treeNode.node.interactions?.onContextMenu
            ](
              e,
              null,
              props.instance.state,
              (s: FrameState) => props.saveState(s, props.instance),
              props.superstate.api
            );
            e.stopPropagation?.();
          }
        }}
        onMouseEnter={() => {
          // Update interaction state for hover
          if (hasStateStyles && !isTouchScreen(props.superstate.ui)) {
            setInteractionState((prev) => ({ ...prev, hover: true }));
          }
        }}
        onMouseLeave={() => {
          // Update interaction state for hover
          if (hasStateStyles && !isTouchScreen(props.superstate.ui)) {
            setInteractionState((prev) => ({ ...prev, hover: false }));
          }
        }}
        onMouseDown={() => {
          if (hasStateStyles && !isTouchScreen(props.superstate.ui)) {
            setInteractionState((prev) => ({ ...prev, press: true }));
          }
        }}
        onMouseUp={() => {
          if (hasStateStyles && !isTouchScreen(props.superstate.ui)) {
            setInteractionState((prev) => ({ ...prev, press: false }));
          }
        }}
        onDoubleClick={canDoubleClick}
        onClick={
          canClick
            ? (e) => {
                if (
                  typeof props.instance.state[props.treeNode.id].actions?.[
                    props.treeNode.node.interactions?.onClick
                  ] == "function"
                ) {
                  props.instance.state[props.treeNode.id].actions?.[
                    props.treeNode.node.interactions?.onClick
                  ](
                    e,
                    null,
                    props.instance.state,
                    (s: FrameState) => props.saveState(s, props.instance),
                    props.superstate.api
                  );
                  e.stopPropagation?.();
                }
                if (
                  isTouchScreen(props.superstate.ui) &&
                  props.treeNode.node.interactions?.onDoubleClick
                ) {
                  props.instance.state[props.treeNode.id].actions?.[
                    props.treeNode.node.interactions?.onDoubleClick
                  ]?.(
                    e,
                    null,
                    props.instance.state,
                    (s: FrameState) => props.saveState(s, props.instance),
                    props.superstate.api
                  );
                  e.stopPropagation?.();
                }
              }
            : undefined
        }
        style={
          {
            ...defaultFrameStyles,
            ...processedStyles,
          } as React.CSSProperties
        }
      >
        {innerComponents}
      </div>
    )
  );
};
