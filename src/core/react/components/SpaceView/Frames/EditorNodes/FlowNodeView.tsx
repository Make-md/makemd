import { PathView } from "core/react/components/PathView/PathView";
import { SpaceFragmentViewComponent } from "core/react/components/SpaceView/Editor/EmbedView/SpaceFragmentView";
import { PathCrumb } from "core/react/components/UI/Crumbs/PathCrumb";
import { CollapseToggle } from "core/react/components/UI/Toggles/CollapseToggle";
import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { useMKitContext } from "core/react/context/MKitContext";
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

// FlowNodeView supports both regular paths and space fragment views
// Space fragment views are paths like "./#*frameId" or "spacePath#*frameId"
// When a fragment view is detected, it renders using SpaceFragmentViewComponent
// Otherwise it renders using PathView
export const FlowNodeView = (
  props: FrameNodeViewProps & {
    source?: string;
    containerRef?: React.RefObject<HTMLDivElement>;
  }
) => {
  const fullPath = props.state?.props?.value;
  const parsedPath = fullPath ? parseContent(fullPath) : null;
  
  // Check if this is a space fragment view (e.g., ./#*frameId or path#*frameId)
  const isSpaceFragment = useMemo(() => {
    if (!parsedPath) return false;
    const uri = props.superstate.spaceManager.uriByString(
      parsedPath,
      props.source
    );
    return (
      uri?.refType === "frame" ||
      uri?.refType === "context" ||
      uri?.refType === "action"
    );
  }, [parsedPath, props.source]);

  const mkitContext = useMKitContext();
  
  const pathState: PathState = useMemo(() => {
    if (!parsedPath || isSpaceFragment) return null;

    const path = props.superstate.spaceManager.resolvePath(
      parsedPath,
      props.source
    );

   

    // Check MKit context first
    if (mkitContext?.isPreviewMode) {
      const spaceData = mkitContext.getSpaceByFullPath(path) || 
                       mkitContext.getSpaceByRelativePath(parsedPath);
                        
      if (spaceData) {
        return spaceData.pseudoPath;
      }
    }

    const uri = props.superstate.spaceManager.uriByString(parsedPath);
    if (uri?.scheme == "https" || uri?.scheme == "http") {
      return {
        path: parsedPath,
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
  }, [parsedPath, props.source, isSpaceFragment, mkitContext]);
  const { updateNode, nodes } = useContext(FramesEditorRootContext);
  const { selectionMode } = useContext(FrameSelectionContext);
  const [expanded, setExpanded] = useState<boolean>(
    props.state?.styles?.["--mk-expanded"]
  );
  const updateValue = (newValue: string) => {
    // Don't allow updates in MKit preview mode
    if (mkitContext?.isPreviewMode) {
      return;
    }
    
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
        (pathState || isSpaceFragment ? (
          <div className="mk-node-link">
            <PathCrumb
              superstate={props.superstate}
              path={pathState?.path ?? parsedPath}
            >
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
              path={pathState?.path ?? props.state?.props?.value}
            ></PathCrumb>
          </div>
        ))}
      {props.state &&
        expanded &&
        (props.state?.props?.value?.length > 0 ? (
          isSpaceFragment ? (
            <SpaceFragmentViewComponent
              id={id}
              source={props.source}
              showTitle={false}
              superstate={props.superstate}
              path={parsedPath}
              minMode={props.state?.styles?.["--mk-min-mode"]}
              containerRef={props.containerRef}
            />
          ) : (
            <PathView
              id={id}
              superstate={props.superstate}
              path={pathState?.path ?? props.state?.props?.value}
              containerRef={props.containerRef}
              styles={{}}
              readOnly={true}
            ></PathView>
          )
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
