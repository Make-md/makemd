import i18n from "core/i18n";
import { showNewFrameMenu } from "core/react/components/UI/Menus/frames/newFrameMenu";
import { SelectOption, defaultMenu } from "core/react/components/UI/Menus/menu";
import { FramesEditorContext } from "core/react/context/FrameEditorContext";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { isMouseEvent } from "core/react/hooks/useLongPress";
import { Superstate } from "core/superstate/superstate";
import { SelectionEvent, eventTypes } from "core/types/types";
import React, { useContext, useEffect, useState } from "react";
import { groupableTypes } from "schemas/frames";
import {
  FrameNode,
  FrameTreeNode,
  defaultFrameEditorProps,
} from "types/mframe";

export const FrameLayerList = (props: { superstate: Superstate }) => {
  const [elements, setElements] = useState<FrameNode[]>([]);
  const { spaceInfo } = useContext(SpaceContext);
  const {
    frameSchema,
    deleteSchema,
    saveFrame,
    tableData,
    frameSchemas: schemas,
    setFrameSchema,
    saveSchema,
  } = useContext(FramesMDBContext);
  const {
    selectNodes,
    root,
    nodes,
    delProperty,
    deleteNode: delFrame,
    selectedNodes,
  } = useContext(FramesEditorContext);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="mk-frame-sidebar">
      <div
        onClick={(e) => {
          setCollapsed(!collapsed);
          e.stopPropagation();
        }}
        className="mk-path-context-title"
      >
        {i18n.labels.layers}
        <button
          className={`mk-collapse mk-inline-button mk-icon-xsmall ${
            collapsed ? "mk-collapsed" : ""
          }`}
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//mk-ui-collapse-sm"),
          }}
        ></button>
      </div>
      {root && !collapsed && (
        <div className="mk-frame-layers">
          <FrameLayerGroup
            superstate={props.superstate}
            node={root}
            depth={0}
          ></FrameLayerGroup>
          {(nodes ?? [])
            .filter(
              (f) => (!f.parentId || f.parentId.length == 0) && f.id != root.id
            )
            .map((f) => (
              <FrameLayerGroup
                key={f.id}
                superstate={props.superstate}
                node={{
                  id: f.id,
                  node: f,
                  children: [],
                  isRef: false,
                  editorProps: defaultFrameEditorProps,
                }}
                depth={0}
              ></FrameLayerGroup>
            ))}
        </div>
      )}
    </div>
  );
};
export const FrameLayerGroup = (props: {
  superstate: Superstate;
  node: FrameTreeNode;
  depth: number;
}) => {
  const { spaceInfo } = useContext(SpaceContext);
  const {
    selectNodes: selectNodes,
    root,
    delProperty,
    deleteNode,
    moveUp,
    moveDown,
    addNode,
    nodes,
    groupNodes,
    selectedNodes,
    saveNodes,
  } = useContext(FramesEditorContext);

  const viewContextMenu = (e: React.MouseEvent) => {
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.menu.groupNodes,
      icon: "lucide//layers",
      onClick: (e) => {
        groupNodes(selectedNodes);
      },
    });
    menuOptions.push({
      name: i18n.menu.moveUp,
      icon: "lucide//arrow-up",
      onClick: (e) => {
        moveUp(props.node.node);
      },
    });
    menuOptions.push({
      name: i18n.menu.moveDown,
      icon: "lucide//arrow-down",
      onClick: (e) => {
        moveDown(props.node.node);
      },
    });
    menuOptions.push({
      name: i18n.menu.moveTo,
      icon: "lucide//arrow-right",
      onClick: (e) => {
        showMoveMenu(e, props.node.node);
      },
    });
    menuOptions.push({
      name: i18n.menu.delete,
      icon: "lucide//trash",
      onClick: (e) => {
        deleteNode(props.node.node);
      },
    });
    props.superstate.ui.openMenu(
      isMouseEvent(e)
        ? { x: e.pageX, y: e.pageY }
        : {
            // @ts-ignore
            x: e.nativeEvent.locationX,
            // @ts-ignore
            y: e.nativeEvent.locationY,
          },
      defaultMenu(props.superstate.ui, menuOptions)
    );
  };

  const showMoveMenu = (e: React.MouseEvent, node: FrameNode) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const f = nodes.filter((n) => groupableTypes.some((t) => t == n.type));
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        ui: props.superstate.ui,
        multi: false,
        editable: true,
        value: [],
        options: f.map((m) => ({ name: m.id, value: m.id })),
        saveOptions: (_, value) => saveNodes([{ ...node, parentId: value[0] }]),
        searchable: true,
        showAll: true,
      }
    );
  };
  const selectNode = () => {
    const evt = new CustomEvent<SelectionEvent>(eventTypes.frameLayerSelected, {
      detail: { selection: [props.node.node.id] },
    });
    window.dispatchEvent(evt);
  };
  const nodesSelected = (evt: CustomEvent<SelectionEvent>) => {
    selectNodes(
      evt.detail.selection
        .map((f) => nodes.find((n) => n.id == f))
        .filter((f) => f)
    );
  };
  useEffect(() => {
    window.addEventListener(eventTypes.frameLayerSelected, nodesSelected);
    return () => {
      window.removeEventListener(eventTypes.frameLayerSelected, nodesSelected);
    };
  }, []);
  return (
    <div>
      <div
        className={`mk-frame-layer ${
          selectedNodes.some((f) => f.id == props.node.id) ? "is-selected" : ""
        }`}
        style={
          {
            "--spacing": `${10 * props.depth}px`,
          } as React.CSSProperties
        }
        onClick={() => selectNode()}
        onContextMenu={(e) => viewContextMenu(e)}
      >
        <span>{props.node.id}</span>
        {!props.node.isRef && props.node.children.length > 0 && (
          <button
            className="mk-inline-button mk-icon-xsmall"
            onClick={(e) => {
              showNewFrameMenu(e, props.superstate, spaceInfo, addNode);
              e.stopPropagation();
            }}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//mk-ui-plus"),
            }}
          ></button>
        )}
      </div>

      {props.node.children
        .filter((f) => !f.isRef)
        .map((f, i) => (
          <FrameLayerGroup
            superstate={props.superstate}
            key={i}
            node={f}
            depth={props.depth + 1}
          ></FrameLayerGroup>
        ))}
    </div>
  );
};
