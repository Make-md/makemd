import {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";

import { showNewFrameMenu } from "core/react/components/UI/Menus/frames/newFrameMenu";
import { FramesEditorContext } from "core/react/context/FrameEditorContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import React, { useContext } from "react";
import { FrameNode } from "types/mframe";
export const FrameHoverMenu = (props: {
  superstate: Superstate;
  node: FrameNode;
  listeners?: DraggableSyntheticListeners;
  attributes?: DraggableAttributes;
  dragRef: (element: HTMLElement | null) => void;
}) => {
  const { spaceInfo } = useContext(SpaceContext);
  const { addNode, selectNodes, selectedNodes } =
    useContext(FramesEditorContext);

  return (
    <>
      <div className="mk-frame-hover-menu-container">
        <div className="mk-frame-hover-menu">
          {props.dragRef && (
            <div
              className={"mk-icon-small mk-hover-button"}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//mk-ui-handle"),
              }}
              ref={props.dragRef}
              onClick={(e) => {
                e.stopPropagation();
                if (
                  selectedNodes.length == 1 &&
                  selectedNodes[0].id == props.node.id
                ) {
                  selectNodes([]);
                  return;
                }
                if (e.shiftKey) {
                  selectNodes(
                    [...selectedNodes, props.node].sort(
                      (a, b) => a.rank - b.rank
                    )
                  );
                } else {
                  selectNodes([props.node]);
                }
                // showPropsMenu(e);
              }}
              {...(props.listeners ?? {})}
              {...(props.attributes ?? {})}
            ></div>
          )}
          <div
            onClick={(e) =>
              showNewFrameMenu(
                e,
                props.superstate,
                spaceInfo,
                (newNode: FrameNode) => addNode(newNode, props.node)
              )
            }
            className={"mk-icon-small mk-hover-button"}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//mk-ui-plus"),
            }}
          ></div>
        </div>
      </div>
    </>
  );
};
