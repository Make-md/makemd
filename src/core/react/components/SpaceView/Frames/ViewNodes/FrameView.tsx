import { parseStylesToClass } from "core/utils/frames/renderer";
import {
  hasStatePrefixes,
  InteractionState,
  parseStylesForState,
} from "core/utils/frames/stateStyles";
import { isTouchScreen } from "core/utils/ui/screen";
import { API, Superstate } from "makemd-core";
import React, { useMemo, useState } from "react";
import {
  FrameExecutable,
  FrameNodeState,
  FrameRunInstance,
  FrameState,
} from "shared/types/frameExec";

// Helper function to execute actions that can be either functions or objects
const executeAction = (
  action: any,
  event: React.MouseEvent,
  context: any,
  frameState: FrameState,
  saveState: (state: FrameState) => void,
  api: API
) => {
  
  if (typeof action === "function") {
    // Current behavior: execute function directly
    action(event, null, frameState, saveState, api);
  } else if (typeof action === "object" && action.command) {
    // New behavior: execute command with parameters
    const parameters = {
      ...action.parameters,
      $event: event,
      $context: context,
      $frameState: frameState,
      $saveState: saveState,
      $api: api
    };
    api.commands.run(action.command, parameters);
  }
};
import { AudioNodeView } from "../EditorNodes/AudioNodeView";
import { ContentNodeView } from "../EditorNodes/ContentNodeView";
import { ContextNodeView } from "../EditorNodes/ContextNodeView";
import { DataNodeView } from "../EditorNodes/DataNodeView";
import { FlowNodeView } from "../EditorNodes/FlowNodeView";
import { defaultFrameStyles } from "../EditorNodes/FrameEditorNodeView";
import { IconNodeView } from "../EditorNodes/IconNodeView";
import { ImageNodeView } from "../EditorNodes/ImageNodeView";
import { InputNodeView } from "../EditorNodes/InputNodeView";
import { TextNodeView } from "../EditorNodes/TextNodeView";
import { VisualizationNodeView } from "../EditorNodes/VisualizationNodeView";
import { ViewNodeView } from "../EditorNodes/ViewNodeView";
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
  const styles = props.instance.state[props.treeNode.id].styles
    ? {
        ...props.instance.state[props.treeNode.id]?.styles?.theme,
        ...props.instance.state[props.treeNode.id]?.styles,
      }
    : {};
  const innerComponents =
    props.treeNode.node.type == "input" ? (
      <InputNodeView {...nodeProps}></InputNodeView>
    ) : props.treeNode.node.type == "text" ? (
      <TextNodeView {...nodeProps}></TextNodeView>
    ) : props.treeNode.node.type == "icon" ? (
      <IconNodeView {...nodeProps}></IconNodeView>
    ) : props.treeNode.node.type == "data" ? (
      <DataNodeView {...nodeProps}></DataNodeView>
    ) : props.treeNode.node.type == "audio" ? (
      <AudioNodeView {...nodeProps}></AudioNodeView>
    ) : props.treeNode.node.type == "image" ? (
      <ImageNodeView {...nodeProps}></ImageNodeView>
    ): props.treeNode.node.type == "view" ? (
            <ViewNodeView              {...nodeProps}
              source={props.source}
            ></ViewNodeView>
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
    const styles = props.instance.state[props.treeNode.id].styles
      ? {
          ...props.instance.state[props.treeNode.id]?.styles?.theme,
          ...props.instance.state[props.treeNode.id]?.styles,
        }
      : {};
    // Check for direct state prefixes in node styles
    const hasDirectStateStyles = hasStatePrefixes(styles);
    // Also enable for nodes with semantic elements (they might have hover styles in StyleAst)
    return hasDirectStateStyles;
  }, [props.instance]);

  const canClick =
    props.treeNode.node.interactions?.onClick &&
    (typeof props.instance.state[props.treeNode.id].actions?.[
      props.treeNode.node.interactions?.onClick
    ] == "function" ||
    (typeof props.instance.state[props.treeNode.id].actions?.[
      props.treeNode.node.interactions?.onClick
    ] == "object" && 
    props.instance.state[props.treeNode.id].actions?.[
      props.treeNode.node.interactions?.onClick
    ]?.command));

  const canDoubleClick = props.treeNode.node.interactions?.onDoubleClick
    ? (e: React.MouseEvent) => {
        const action = props.instance.state[props.treeNode.id].actions?.[
          props.treeNode.node.interactions?.onDoubleClick
        ];
        if (action) {
          executeAction(
            action,
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
    const styles = props.instance.state[props.treeNode.id].styles
      ? {
          ...props.instance.state[props.treeNode.id]?.styles?.theme,
          ...props.instance.state[props.treeNode.id]?.styles,
        }
      : {};
    if (hasStateStyles) {
      return parseStylesForState(styles, interactionState);
    }

    return styles;
  }, [props.instance, interactionState, hasStateStyles]);

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
            const action = props.instance.state[props.treeNode.id].actions?.[
              props.treeNode.node.interactions?.onContextMenu
            ];
            if (action) {
              executeAction(
                action,
                e,
                null,
                props.instance.state,
                (s: FrameState) => props.saveState(s, props.instance),
                props.superstate.api
              );
              e.stopPropagation?.();
            }
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
          isTouchScreen(props.superstate.ui)
            ? canDoubleClick
            : canClick
            ? (e) => {
                const action = props.instance.state[props.treeNode.id].actions?.[
                  props.treeNode.node.interactions?.onClick
                ];
                if (action) {
                  executeAction(
                    action,
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
                  const doubleClickAction = props.instance.state[props.treeNode.id].actions?.[
                    props.treeNode.node.interactions?.onDoubleClick
                  ];
                  if (doubleClickAction) {
                    executeAction(
                      doubleClickAction,
                      e,
                      null,
                      props.instance.state,
                      (s: FrameState) => props.saveState(s, props.instance),
                      props.superstate.api
                    );
                    e.stopPropagation?.();
                  }
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
