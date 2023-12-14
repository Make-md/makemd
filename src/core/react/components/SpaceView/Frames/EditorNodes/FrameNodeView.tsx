import {
  DraggableAttributes,
  DraggableSyntheticListeners,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import classNames from "classnames";
import { FramesEditorContext } from "core/react/context/FrameEditorContext";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { Superstate } from "core/superstate/superstate";
import { SelectionEvent, eventTypes } from "core/types/types";
import { propertiesForNode } from "core/utils/frames/ast";
import { parseStylesToClass } from "core/utils/frames/renderer";
import { Resizable } from "re-resizable";
import React, { FunctionComponent, useContext, useRef } from "react";
import {
  FrameDropMode,
  FrameNode,
  FrameRunInstance,
  FrameState,
  FrameTreeNode,
  FrameTreeProp,
} from "types/mframe";
import { FrameHoverMenu } from "../FrameHoverMenu/FrameHoverMenu";
import { HoverMultiMenu } from "../FrameHoverMenu/HoverMultiMenu";
import { HoverPropsMenu } from "../FrameHoverMenu/HoverPropsMenu";
import { FrameEditorDropZone } from "../Placeholders/ColumnPlaceholder";
import { RowPlaceholder } from "../Placeholders/RowPlaceholder";
import { ContentNodeView } from "./ContentNodeView";
import { FlowNodeView } from "./FlowNodeView";
import { IconNodeView } from "./IconNodeView";
import { ImageNodeView } from "./ImageNodeView";
import { SpaceNodeView } from "./SpaceNodeView";
import { TextNodeView } from "./TextNodeView";

export const defaultFrameStyles = {
  position: "relative",
};

export const FrameEditorNodeView = (props: {
  size: FrameTreeProp;
  resize: (size: FrameTreeProp) => void;
  listeners?: DraggableSyntheticListeners;
  column: boolean;
}) => {
  return (
    <>
      <Resizable
        className={classNames(
          props.column ? "mk-frame-column" : "mk-frame-bounds"
        )}
        enable={
          props.column
            ? { right: true }
            : {
                top: true,
                right: true,
                bottom: true,
                left: true,
                topRight: true,
                bottomRight: true,
                bottomLeft: true,
                topLeft: true,
              }
        }
        onResizeStop={(e, direction, ref, d) => {
          props.resize({
            width: ref.clientWidth,
            height: props.column ? "" : ref.clientHeight,
          });
        }}
        onResizeStart={(e) => {
          e.stopPropagation();
        }}
        size={{
          width: props.size.width ?? "100%",
          height: props.size.height ?? "100%",
        }}
        {...props.listeners}
      ></Resizable>
    </>
  );
};

export const FrameNodeView = (props: {
  superstate: Superstate;
  treeNode: FrameTreeNode;
  instance: FrameRunInstance;
  editMode: number;
  children?: React.ReactNode;
}) => {
  const {
    selectedNodes,
    saveState,
    hoverNode,
    saveNodes,
    addNode,
    deleteNode,
    dragNode,
  } = useContext(FramesEditorContext);
  const { frameSchema } = useContext(FramesMDBContext);
  const {
    attributes,
    listeners,

    setNodeRef: setDraggableNodeRef,
    transform,
  } = useDraggable({
    id: frameSchema.id + props.treeNode.id,
    data: {
      id: props.treeNode.id,
      type: "item",
      parent: props.treeNode.node.parentId,
      frame: frameSchema.id,
    },
    disabled: props.treeNode.editorProps.dragMode == 0,
  });
  const { setNodeRef } = useDroppable({
    id: frameSchema.id + props.treeNode.id,
    data: {
      id: props.treeNode.id,
      type: "item",
      parent: props.treeNode.node.parentId,
      frame: frameSchema.id,
    },
    disabled: props.treeNode.editorProps.dropMode == 0,
  });
  const menuRef = useRef(null);
  const ref = useRef<HTMLDivElement>(null);

  const isSelected = selectedNodes.some((f) => props.treeNode.id == f.id);
  const innerComponents =
    props.treeNode.node.type == "text" ? (
      <TextNodeView
        treeNode={props.treeNode}
        instance={props.instance}
        editable={props.editMode > 0 && !props.treeNode.isRef}
      ></TextNodeView>
    ) : props.treeNode.node.type == "icon" ? (
      <IconNodeView
        superstate={props.superstate}
        treeNode={props.treeNode}
        instance={props.instance}
        editable={!props.treeNode.isRef}
      ></IconNodeView>
    ) : props.treeNode.node.type == "image" ? (
      <ImageNodeView
        treeNode={props.treeNode}
        instance={props.instance}
        editable={!props.treeNode.isRef}
        superstate={props.superstate}
      ></ImageNodeView>
    ) : props.treeNode.node.type == "space" ? (
      <SpaceNodeView
        treeNode={props.treeNode}
        instance={props.instance}
        superstate={props.superstate}
        editable={!props.treeNode.isRef}
      ></SpaceNodeView>
    ) : props.treeNode.node.type == "flow" ? (
      <FlowNodeView
        treeNode={props.treeNode}
        instance={props.instance}
        superstate={props.superstate}
        editable={!props.treeNode.isRef}
        menuRef={menuRef}
      ></FlowNodeView>
    ) : props.treeNode.node.type == "content" ? (
      <ContentNodeView editable={!props.treeNode.isRef}>
        {props.children}
      </ContentNodeView>
    ) : (props.treeNode.node.type == "column" ||
        props.treeNode.node.type == "container") &&
      props.treeNode.children.length == 0 ? (
      <RowPlaceholder
        superstate={props.superstate}
        id={props.treeNode.id}
        parentId={props.treeNode.node.parentId}
      ></RowPlaceholder>
    ) : (
      props.treeNode.children.map((c, i) => (
        <FrameNodeView
          editMode={props.editMode}
          superstate={props.superstate}
          key={i}
          treeNode={c}
          instance={props.instance}
        >
          {props.children}
        </FrameNodeView>
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
  const onResize = (size: FrameTreeProp) => {
    saveNodes([
      {
        ...props.treeNode.node,
        styles: { ...props.treeNode.node.styles, ...size },
      },
    ]);
  };
  const selectNode = (nodes: FrameNode[]) => {
    const evt = new CustomEvent<SelectionEvent>(eventTypes.frameLayerSelected, {
      detail: { selection: nodes.map((f) => f.id) },
    });
    window.dispatchEvent(evt);
  };
  const onClick = (e: React.MouseEvent) => {
    if (isSelected) return;
    if (
      typeof props.instance.state[props.treeNode.id].actions?.onClick ==
      "function"
    ) {
      props.instance.state[props.treeNode.id].actions?.onClick(
        e,
        props.instance.state,
        (s: FrameState) => saveState(s, props.instance),
        props.superstate.api
      );
      e.stopPropagation();
    } else if (props.editMode > 1) {
      if (e.shiftKey) {
        selectNode([
          ...selectedNodes.filter((f) => f.id != props.treeNode.node.id),
          props.treeNode.node,
        ]);
      } else {
        selectNode([props.treeNode.node]);
      }
      e.stopPropagation();
    }
  };
  const onKeyDown = (e: any) => {
    if (e.key == "Backspace" || e.key == "Delete") {
      deleteNode(props.treeNode.node);
    }
  };

  const canResize =
    (isSelected && props.treeNode.editorProps.resizeMode == 1) ||
    props.treeNode.editorProps.resizeMode == 2;

  const dropMode = props.treeNode.editorProps.dropMode;
  const inner =
    tag == "input" ? (
      <input
        data-path={props.treeNode.id}
        type={type}
        onChange={(e) => {
          if (
            typeof props.instance.state[props.treeNode.id].actions?.onChange ==
            "function"
          ) {
            props.instance.state[props.treeNode.id].actions?.onChange(
              e.target.value,
              props.instance.state,
              (s: FrameState) => saveState(s, props.instance),
              props.superstate.api
            );
          }
        }}
        style={
          {
            "--translate-x": `${transform?.x ?? 0}px`,
            "--translate-y": `${transform?.y ?? 0}px`,
            ...props.instance.state[props.treeNode.id]?.styles,
          } as React.CSSProperties
        }
      />
    ) : (
      React.createElement(
        tag,
        {
          type: type,
          ref: (el: HTMLDivElement) => {
            ref.current = el;
          },
          className: `mk-frame-edit ${parseStylesToClass(
            props.instance.state[props.treeNode.id]?.styles
          )}`,
          "data-path": props.treeNode.id,
          "data-type": props.treeNode.node.type,

          onClick: onClick,
          style: {
            ...defaultFrameStyles,
            ...props.instance.state[props.treeNode.id]?.styles,
            "--translate-x": `${transform?.x ?? 0}px`,
            "--translate-y": `${transform?.y ?? 0}px`,
            ...(props.editMode == -1 &&
            props.treeNode.node.parentId == props.instance.root.id
              ? { left: 0, top: 0 }
              : {}),
          },
        },
        [
          ...[
            dragNode &&
              props.editMode > 0 &&
              dropMode > FrameDropMode.DropModeNone && (
                <FrameEditorDropZone
                  parentId={props.treeNode.node.parentId}
                  key={`|${props.treeNode.node.id}`}
                  insertRow={hoverNode == props.treeNode.id}
                  columnInsert={hoverNode == `|${props.treeNode.node.id}`}
                  superstate={props.superstate}
                  height={`100%`}
                  width={`${
                    dropMode != FrameDropMode.DropModeColumnOnly
                      ? ref.current?.parentElement.clientWidth
                      : ref.current?.clientWidth
                  }px`}
                  id={`|${props.treeNode.node.id}`}
                  mode={dropMode}
                  dropRef={setNodeRef}
                ></FrameEditorDropZone>
              ),
          ],
          ...(props.editMode > 0 && canResize
            ? [
                <FrameEditorNodeView
                  key={props.treeNode.id}
                  size={props.instance.state[props.treeNode.id]?.styles}
                  column={props.treeNode.node.type == "column"}
                  resize={onResize}
                ></FrameEditorNodeView>,
              ]
            : []),
          ...(props.editMode > 0 &&
          props.treeNode.editorProps.dragMode == 2 &&
          !isSelected
            ? [
                <div
                  key={props.treeNode.id}
                  tabIndex={-1}
                  className={classNames(
                    "mk-frame-bounds",
                    dragNode == props.treeNode.id ? "is-selected" : ""
                  )}
                  onKeyDown={onKeyDown}
                  // onClick={onClick}
                  {...listeners}
                ></div>,
              ]
            : []),
          innerComponents,
        ]
      )
    );

  return (
    props.instance.state[props.treeNode.id] &&
    (props.editMode != 0 && props.treeNode.editorProps.dragMode == 1 ? (
      <SelectableFrameNode
        node={props.treeNode.id}
        maxWidth={props.instance.state[props.treeNode.id]?.styles?.maxWidth}
        selected={selectedNodes.some((f) => props.treeNode.id == f.id)}
        {...(props.superstate.ui.getScreenType() == "mobile"
          ? {
              dragRef: setDraggableNodeRef,
              listeners: listeners,
              attributes: attributes,
            }
          : {})}
      >
        {selectedNodes.length == 1 &&
        selectedNodes[0].id == props.treeNode.id ? (
          <HoverPropsMenu
            superstate={props.superstate}
            node={props.treeNode.node}
            triggerMenu={(e) => menuRef?.current?.triggerMenu(e)}
            duplicateFrame={() => {
              addNode(props.treeNode.node, props.treeNode.node);
            }}
            deleteFrame={() => deleteNode(props.treeNode.node)}
            fields={propertiesForNode(props.treeNode.node)}
            schemaProps={Object.keys(props.instance.root.node.props).map(
              (f) => ({
                name: f,
                schemaId: props.instance.root.id,
                type: props.instance.root.node.types[f],
                value: props.instance.root.node.propsValue[f],
              })
            )}
          ></HoverPropsMenu>
        ) : (
          selectedNodes.length > 1 &&
          selectedNodes[0].id == props.treeNode.id && (
            <HoverMultiMenu superstate={props.superstate}></HoverMultiMenu>
          )
        )}
        {inner}
        {props.superstate.ui.getScreenType() != "mobile" && (
          <FrameHoverMenu
            superstate={props.superstate}
            node={props.treeNode.node}
            dragRef={setDraggableNodeRef}
            attributes={attributes}
            listeners={listeners}
          ></FrameHoverMenu>
        )}
      </SelectableFrameNode>
    ) : (
      <>{inner}</>
    ))
  );
};

export const SelectableFrameNode = (
  props: React.PropsWithChildren<{
    selected: boolean;
    node: string;
    attributes?: DraggableAttributes;
    listeners?: DraggableSyntheticListeners;
    dragRef?: (element: HTMLElement | null) => void;
    maxWidth?: string;
  }>
) => {
  const ref = useRef(null);
  const { selectableNodeBounds, selectNodes } = useContext(FramesEditorContext);
  const resetSize = () => {
    if (ref.current) {
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      selectableNodeBounds.current[props.node] = {
        left,
        top,
        width,
        height,
      };
    }
  };
  // useEffect(() => {
  //   const observer = new ResizeObserver((entries) => {
  //     resetSize();
  //   });
  //   const element = ref.current;
  //   if (element) observer.observe(element);

  //   return () => {
  //     if (element) observer.unobserve(element);
  //   };
  // }, []);
  return (
    <div
      className={`mk-f ${props.selected ? "is-selected" : ""}`}
      // ref={props.dragRef ?? ref}
      onClick={() => !props.selected && selectNodes([])}
      {...(props.listeners ?? {})}
      {...(props.attributes ?? {})}
      style={
        {
          ...(props.maxWidth ? { maxWidth: props.maxWidth } : {}),
        } as React.CSSProperties
      }
    >
      {props.children}
    </div>
  );
};
