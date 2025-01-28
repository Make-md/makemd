import { PathView } from "core/react/components/PathView/PathView";

import { PathCrumb } from "core/react/components/UI/Crumbs/PathCrumb";
import { CollapseToggle } from "core/react/components/UI/Toggles/CollapseToggle";
import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { wrapQuotes } from "core/utils/strings";
import { i18n } from "makemd-core";
import React, { useContext, useMemo, useState } from "react";
import { BlinkMode } from "shared/types/blink";
import { FrameEditorMode } from "shared/types/frameExec";
import { PathState } from "shared/types/PathState";
import { windowFromDocument } from "shared/utils/dom";
import { FrameNodeViewProps } from "../ViewNodes/FrameView";

function parseContent(input: string): string {
  // Define regular expressions to match ![![content]] and !![[content]]
  const regex1 = /!\[!\[(.*?)\]\]/;
  const regex2 = /!!\[\[(.*?)\]\]/;

  // Apply the regex to the input string
  const match1 = input.match(regex1);
  const match2 = input.match(regex2);

  // If a match was found for the first regex, return the content.
  // If no match was found, check for the second regex. If a match is found, return the content.
  // If no match was found for both, return the original string
  return match1 ? match1[1] : match2 ? match2[1] : input;
}

export const FlowNodeView = (
  props: FrameNodeViewProps & {
    source?: string;
    containerRef?: React.RefObject<HTMLDivElement>;
  }
) => {
  const { spaceState } = useContext(SpaceContext);
  const pathState: PathState = useMemo(() => {
    const fullPath = props.state?.props?.value;
    const path = fullPath
      ? props.superstate.spaceManager.resolvePath(
          parseContent(fullPath),
          props.source
        )
      : null;

    const uri = props.superstate.spaceManager.uriByString(fullPath);
    if (uri?.scheme == "https" || uri?.scheme == "http") {
      return {
        path: fullPath,
        label: {
          sticker: uri.scheme,
          name: uri.path,
          color: "",
        },
        hidden: false,
        subtype: "md",
        type: "remote",
        readOnly: true,
      };
    }
    // if (props.superstate.spacesIndex.get(path)) {
    //   return props.superstate.pathsIndex.get(
    //     props.superstate.spacesIndex.get(path).defPath
    //   );
    // }
    return props.superstate.pathsIndex.get(path);
  }, [props.state, props.source]);
  const { updateNode, nodes } = useContext(FramesEditorRootContext);
  const { selectionMode } = useContext(FrameSelectionContext);
  const [expanded, setExpanded] = useState<boolean>(
    props.state?.styles?.["--mk-expanded"]
  );
  const updateValue = (newValue: string) => {
    if (newValue != props.state.props?.value) {
      if (props.treeNode.editorProps?.linkedNode) {
        const node = nodes.find(
          (f) => f.id == props.treeNode.editorProps.linkedNode.node
        );
        updateNode(node, {
          props: {
            ...node.props,
            [props.treeNode.editorProps.linkedNode.prop]: wrapQuotes(newValue),
          },
        });
      } else {
        updateNode(props.treeNode.node, {
          props: { ...props.treeNode.node.props, value: wrapQuotes(newValue) },
        });
      }
    }
  };
  const hideToggle = props.state?.styles?.["--mk-link"];
  const { id } = useContext(FrameInstanceContext);
  const [pathString, setPathString] = useState<string>("");

  const toggleCollapse = () => {
    setExpanded((p) => !p);
    if (selectionMode > FrameEditorMode.Read)
      updateNode(props.treeNode.node, {
        styles: {
          ...props.treeNode.node.styles,
          "--mk-expanded": (!props.state?.styles?.["--mk-expanded"]).toString(),
        },
      });
  };
  return (
    <div className="mk-node-flow">
      {!props.state?.styles?.["--mk-min-mode"] &&
        (pathState ? (
          <div className="mk-node-link">
            <PathCrumb superstate={props.superstate} path={pathState.path}>
              {!hideToggle && (
                <CollapseToggle
                  superstate={props.superstate}
                  collapsed={!expanded}
                  onToggle={toggleCollapse}
                ></CollapseToggle>
              )}
            </PathCrumb>
          </div>
        ) : (
          <div className="mk-node-link">
            <PathCrumb
              superstate={props.superstate}
              path={props.state?.props?.value}
            ></PathCrumb>
          </div>
        ))}
      {props.state &&
        expanded &&
        (props.state?.props?.value?.length > 0 ? (
          <PathView
            id={id}
            superstate={props.superstate}
            path={pathState?.path ?? props.state?.props?.value}
            containerRef={props.containerRef}
            styles={{}}
            readOnly={true}
          ></PathView>
        ) : (
          selectionMode > FrameEditorMode.Read && (
            <div
              className="mk-node-text-placeholder"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                props.superstate.ui.quickOpen(
                  BlinkMode.Open,
                  rect,
                  windowFromDocument(e.view.document),
                  (path) => {
                    updateValue(path);
                  }
                );
              }}
            >
              {i18n.hintText.selectNote}
            </div>
          )
        ))}
    </div>
  );
};
