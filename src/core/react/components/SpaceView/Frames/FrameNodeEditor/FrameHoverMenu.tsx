import {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { showNewFrameMenu } from "core/react/components/UI/Menus/frames/newFrameMenu";

import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import { isTouchScreen } from "core/utils/ui/screen";
import React, { useContext } from "react";
import { FrameNode } from "types/mframe";
export const FrameHoverMenu = (props: {
  superstate: Superstate;
  node: FrameNode;
  selected: boolean;
  visible: boolean;
  mode: number;
  listeners?: DraggableSyntheticListeners;
  attributes?: DraggableAttributes;
  dragRef: (element: HTMLElement | null) => void;
}) => {
  const { spaceInfo } = useContext(SpaceContext);
  const { addNode, moveUp, moveDown, setLastCreatedId } = useContext(
    FramesEditorRootContext
  );
  const { select, selection } = useContext(FrameSelectionContext);
  const selected = selection.includes(props.node.id);
  return (
    <>
      <div
        className={`${"mk-editor-frame-hover-horizontal"}`}
        style={{
          pointerEvents: "auto",
          opacity: props.visible ? "1" : "0",
        }}
      >
        {props.dragRef && (
          <div
            className={"mk-icon-small mk-editor-frame-hover-button"}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//handle"),
            }}
            style={{ cursor: "grab" }}
            ref={props.dragRef}
            onClick={(e) => {
              e.stopPropagation();
              if (selection.length == 1 && selected) {
                select(null);
                return;
              }
              if (e.shiftKey) {
                select(props.node.id, true);
              } else {
                select(props.node.id);
              }
              // showPropsMenu(e);
            }}
            {...(props.listeners ?? {})}
            {...(props.attributes ?? {})}
          ></div>
        )}
        {!isTouchScreen(props.superstate.ui) && (
          <div
            onClick={(e) => {
              showNewFrameMenu(
                (e.target as HTMLElement).getBoundingClientRect(),
                window,
                props.superstate,
                spaceInfo,
                (newNode: FrameNode) =>
                  addNode(newNode, props.node).then((f) => select(f.id))
              );
              e.stopPropagation();
            }}
            className={"mk-icon-small mk-editor-frame-hover-button"}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//plus"),
            }}
          ></div>
        )}
      </div>
    </>
  );
};
