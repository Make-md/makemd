import { useDroppable } from "@dnd-kit/core";
import { showNewFrameMenu } from "core/react/components/UI/Menus/frames/newFrameMenu";
import { matchAny } from "core/react/components/UI/Menus/menu/concerns/matchers";
import { FramesEditorContext } from "core/react/context/FrameEditorContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import React, { useContext, useMemo, useState } from "react";
import {
  buttonNode,
  cardNode,
  flowNode,
  iconNode,
  imageNode,
  linkNode,
  progressNode,
  spaceNode,
  textNode,
} from "schemas/frames";
import { FrameRoot } from "types/mframe";
import { FrameHoverMenu } from "../FrameHoverMenu/FrameHoverMenu";
export const RowPlaceholder = (props: {
  superstate: Superstate;
  id: string;
  parentId: string;
}) => {
  const { hoverNode, root, deleteNode, nodes } =
    useContext(FramesEditorContext);
  const { setNodeRef } = useDroppable({
    id: props.id,
    data: {
      id: props.id,
      type: "item",
      parent: props.parentId,
    },
  });

  const presets = [
    {
      name: "New Note",
      value: { type: "preset", value: "note" },
      section: "default",
      icon: "ui//mk-make-flow",
    },
    {
      name: "Table",
      value: { type: "preset", value: "table" },
      section: "default",
      icon: "ui//mk-make-table",
    },
  ];
  const defaultElements: FrameRoot[] = [
    flowNode,
    spaceNode,
    textNode,
    imageNode,
    iconNode,
    // contentNode,
  ];
  const defaultFrames: FrameRoot[] = [
    buttonNode,
    linkNode,
    cardNode,
    progressNode,
  ];
  const [queryStr, setQueryStr] = useState("");
  const allOptions = [
    ...presets,
    ...defaultElements.map((f) => ({
      name: f.node.name,
      value: { type: "element", value: f },
      section: "element",
      icon: f.def?.icon,
    })),
    ...defaultFrames.map((f) => ({
      name: f.node.name,
      value: { type: "default", value: f },
      section: "element",
      icon: f.def?.icon,
    })),
  ];
  const { spaceInfo } = useContext(SpaceContext);
  const { addNode, selectNodes, selectedNodes } =
    useContext(FramesEditorContext);
  const options = useMemo(() => {
    return queryStr.length == 0
      ? allOptions
      : allOptions.filter((f) => matchAny(queryStr).test(f.name));
  }, [queryStr]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (
      e.key == "Backspace" &&
      (e.target as HTMLInputElement).textContent.length == 0
    ) {
      if (props.id) deleteNode(nodes.find((f) => f.id == props.id));
    }
  };
  return (
    <div className="mk-f">
      <div
        className={`mk-frame-row-placeholder ${
          hoverNode == props.id && "mk-indicator-bottom"
        }`}
        ref={setNodeRef}
      >
        <div
          onClick={(e) =>
            showNewFrameMenu(e, props.superstate, spaceInfo, addNode)
          }
        ></div>
      </div>
      <FrameHoverMenu
        superstate={props.superstate}
        node={root.node}
        listeners={null}
        dragRef={null}
      ></FrameHoverMenu>
    </div>
  );
};
