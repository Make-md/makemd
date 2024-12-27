import { useDndMonitor, useDraggable } from "@dnd-kit/core";
import classNames from "classnames";
import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import {
  FrameSelectionContext,
  FrameSelectionProvider,
} from "core/react/context/FrameSelectionContext";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { propertiesForNode } from "core/utils/frames/ast";
import { parseStylesToClass } from "core/utils/frames/renderer";
import { Superstate } from "makemd-core";
import React, {
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  FrameDragMode,
  FrameDropMode,
  FrameEditorMode,
  FrameExecutable,
  FrameResizeMode,
  FrameRunInstance,
  FrameState,
  FrameTreeNode,
} from "shared/types/frameExec";
import { FrameNode, FrameTreeProp } from "shared/types/mframe";
import { FrameMultiNodeEditor } from "../FrameNodeEditor/FrameMultiNodeEditor";
import { FrameNodeEditor } from "../FrameNodeEditor/FrameNodeEditor";
import { ContentNodeView } from "./ContentNodeView";
import { FlowNodeView } from "./FlowNodeView";

import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { PathContext } from "core/react/context/PathContext";
import { WindowContext } from "core/react/context/WindowContext";
import { isTouchScreen } from "core/utils/ui/screen";
import { Rect } from "shared/types/Pos";
import { FrameHoverMenu } from "../FrameNodeEditor/FrameHoverMenu";
import { FrameNodeEditorContainer } from "../FrameNodeEditor/FrameNodeEditorContainer";
import { FrameCorners } from "../FrameNodeEditor/Overlays/FrameCorners";
import { FrameEditorDropZone } from "../FrameNodeEditor/Overlays/FrameDropZone";
import { FrameGapHandle } from "../FrameNodeEditor/Overlays/FrameGapHandle";
import { FramePadding } from "../FrameNodeEditor/Overlays/FramePaddingHandle";
import { FrameResizer } from "../FrameNodeEditor/Overlays/FrameResizer";
import { FrameView } from "../ViewNodes/FrameView";
import { AudioNodeView } from "./AudioNodeView";
import { ContextNodeView } from "./ContextNodeView";
import { IconNodeView } from "./IconNodeView";
import { ImageNodeView } from "./ImageNodeView";
import { InputNodeView } from "./InputNodeView";
import { NewNodeView } from "./NewNodeView";
import { TextNodeView } from "./TextNodeView";

export const defaultFrameStyles = {
  position: "relative",
};
const FrameEditorInner = memo(function FrameEditorInner(props: {
  treeNode: FrameTreeNode;
  superstate: Superstate;
  state: FrameTreeProp;
  containerRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
  instance: FrameRunInstance;
  editMode: FrameEditorMode;
}) {
  const nodeProps = {
    superstate: props.superstate,
    treeNode: props.treeNode,
    state: props.state,
  };
  const { treeNode } = props;
  const { pathState } = useContext(PathContext);
  const { instance } = useContext(FrameInstanceContext);
  return (
    <>
      {treeNode.node.type == "new" ? (
        <NewNodeView {...nodeProps}></NewNodeView>
      ) : treeNode.node.type == "input" ? (
        <InputNodeView {...nodeProps}></InputNodeView>
      ) : treeNode.node.type == "text" ? (
        <TextNodeView {...nodeProps}></TextNodeView>
      ) : treeNode.node.type == "icon" ? (
        <IconNodeView {...nodeProps}></IconNodeView>
      ) : treeNode.node.type == "audio" ? (
        <AudioNodeView {...nodeProps}></AudioNodeView>
      ) : treeNode.node.type == "image" ? (
        <ImageNodeView {...nodeProps}></ImageNodeView>
      ) : treeNode.node.type == "space" ? (
        <ContextNodeView
          {...nodeProps}
          containerRef={props.containerRef}
          source={pathState.path}
        ></ContextNodeView>
      ) : treeNode.node.type == "flow" ? (
        <FlowNodeView
          {...nodeProps}
          source={pathState.path}
          containerRef={props.containerRef}
        ></FlowNodeView>
      ) : treeNode.node.type == "content" ? (
        <ContentNodeView editable={!props.treeNode.isRef}>
          {props.treeNode.children.map((c, i) =>
            c.node.type == "slides" ? null : (
              <FrameEditorNodeView
                superstate={props.superstate}
                key={c.id}
                treeNode={c}
                instance={props.instance}
                containerRef={props.containerRef}
              >
                {props.children}
              </FrameEditorNodeView>
            )
          )}
          {props.children}
        </ContentNodeView>
      ) : (treeNode.node.type == "column" ||
          treeNode.node.type == "container") &&
        treeNode.children.length == 0 ? null : props.treeNode.id ==
          props.instance.exec.id ||
        treeNode.node.type == "column" ||
        treeNode.node.type == "container" ? (
        props.treeNode.children.map((c, i) =>
          c.node.type == "slides" ? null : (
            <FrameEditorNodeView
              superstate={props.superstate}
              key={c.id}
              treeNode={c}
              instance={props.instance}
              containerRef={props.containerRef}
            >
              {props.children}
            </FrameEditorNodeView>
          )
        )
      ) : (
        <>
          <FrameSelectionProvider
            superstate={props.superstate}
            id={treeNode.id}
            editMode={props.editMode}
          >
            {treeNode.children.map((c, i) =>
              c.node.type == "slides" ? null : (
                <FrameEditorNodeView
                  superstate={props.superstate}
                  key={c.id}
                  treeNode={c}
                  instance={props.instance}
                  containerRef={props.containerRef}
                >
                  {props.children}
                </FrameEditorNodeView>
              )
            )}
          </FrameSelectionProvider>
        </>
      )}
    </>
  );
});

export const FrameEditorNodeView = (props: {
  superstate: Superstate;
  treeNode: FrameExecutable;
  instance: FrameRunInstance;
  children?: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement>;
}) => {
  const {
    selectionMode,
    selectable,
    selected: _selected,
    isParentToSelection,
    select,
    selection,
  } = useContext(FrameSelectionContext);
  const {
    updateNode,
    addNode,
    deleteNode,

    nodes,

    selectedSlide,
  } = useContext(FramesEditorRootContext);
  const { setDragNode } = useContext(WindowContext);
  const { saveState, selectableNodeBounds, id } =
    useContext(FrameInstanceContext);
  const { dragActive } = useContext(WindowContext);
  const editMode = props.treeNode.isRef
    ? FrameEditorMode.Read
    : props.treeNode.id == props.instance.exec.id
    ? selectionMode
    : FrameEditorMode.Group;
  const selected = selection.some((f) => f == props.treeNode.id);
  const isSelectable = selectable && !props.treeNode.isRef && !selected;
  const state = props.instance.state[props.treeNode.id];

  const deltas: FrameNode = useMemo(
    () =>
      selectedSlide
        ? nodes.find(
            (f) => f.ref == props.treeNode.id && selectedSlide == f.parentId
          ) ?? null
        : null,
    [nodes, props.treeNode, selectedSlide]
  );
  const treeNode = useMemo(
    () =>
      deltas
        ? {
            ...props.treeNode,
            node: {
              ...props.treeNode.node,
              styles: {
                ...props.treeNode.node.styles,
                ...deltas.styles,
              },
              props: {
                ...props.treeNode.node.props,
                ...deltas.props,
              },
              actions: {
                ...props.treeNode.node.actions,
                ...deltas.actions,
              },
            },
          }
        : props.treeNode,
    [deltas, props.treeNode]
  );

  const { frameSchema } = useContext(FramesMDBContext);
  const dragId = id + frameSchema.id + props.treeNode.id;
  const [hover, setHover] = useState(false);
  const [isMouseOverElement, setIsMouseOverElement] = React.useState(false);
  const [isMouseOverPortal, setIsMouseOverPortal] = React.useState(false);
  const draggable =
    props.treeNode.editorProps.dragMode == FrameDragMode.DragHandle ||
    (((isSelectable && !isParentToSelection) || selected) &&
      props.treeNode.editorProps.dragMode != 0);
  const {
    attributes,
    listeners,

    setNodeRef: setDraggableNodeRef,
    transform,
  } = useDraggable({
    id: dragId,
    data: {
      id: dragId,
      root: id,
      type: "node",
      parent: props.treeNode.node.parentId,
      frame: frameSchema.id,
      node: props.treeNode.id,
    },
    disabled: !draggable,
  });

  const ref = useRef<HTMLDivElement>(null);
  const onLongPress = () => {
    if (isSelectable && props.treeNode.id != props.instance.exec.id) {
      select(treeNode.node.id);
      return;
    }
  };

  const hidden = props.instance.state[props.treeNode.id]?.styles
    ? props.instance.state[props.treeNode.id]?.styles?.hidden
      ? true
      : false
    : false;
  const nodeProps = {
    superstate: props.superstate,
    treeNode: treeNode,
    state: state,
  };

  const saveStyles = (size: FrameTreeProp) => {
    updateNode(treeNode.node, {
      styles: { ...size },
    });
  };

  const onClick = (e: React.MouseEvent) => {
    if (
      isSelectable &&
      (selectionMode != FrameEditorMode.Page ||
        (isParentToSelection && props.treeNode.id != props.instance.exec.id))
    ) {
      if (e.shiftKey) {
        select(treeNode.node.id, true);
      } else {
        select(treeNode.node.id);
      }
      e.stopPropagation();
      return;
    } else if (props.treeNode.id == props.instance.exec.id) {
      select(null);
    }
    if (!selected) {
      if (e.detail === 2 || isTouchScreen(props.superstate.ui)) {
        if (typeof state.actions?.onDoubleClick == "function") {
          state.actions?.onDoubleClick(
            e,
            null,
            props.instance.state,
            (s: FrameState) => saveState(s, props.instance),
            props.superstate.api
          );
          e.stopPropagation();
          return;
        }
      }
      if (e.detail === 1) {
        if (typeof state.actions?.onClick == "function") {
          state.actions?.onClick(
            e,
            null,
            props.instance.state,
            (s: FrameState) => saveState(s, props.instance),
            props.superstate.api
          );
          e.stopPropagation();
        }
      }
    } else {
      e.stopPropagation();
    }
  };
  // useLongPress(ref, onLongPress);
  useEffect(() => {
    selection.some((f) => f != props.treeNode.id) && setHover(false);
  }, [selection, props.treeNode]);
  const [canEditLayout, setCanEditLayout] = useState(false);
  useEffect(() => {
    if (
      selected &&
      isTouchScreen(props.superstate.ui) &&
      (props.treeNode.node.type == "group" ||
        props.treeNode.node.type == "image" ||
        selectionMode >= FrameEditorMode.Group)
    ) {
      setCanEditLayout(true);
    } else {
      if (selected && canEditLayout) {
      } else {
        setCanEditLayout(false);
      }
    }
  }, [props.treeNode, selectionMode, selected]);

  const dropMode = props.treeNode.editorProps.dropMode;
  const computedStyle = ref.current && getComputedStyle(ref.current);
  const clientWidth = ref.current && ref.current.clientWidth;
  const clientHeight = ref.current && ref.current.clientHeight;

  const [childNodeSizes, setChildNodeSizes] = useState<Rect[]>([]);
  const calculateRectInContainer = (rect: Rect, containerRect: Rect) => {
    return {
      left: rect.x - containerRect.x,
      top: rect.y - containerRect.y,
      width: rect.width,
      height: rect.height,
    };
  };

  useEffect(() => {
    if (!ref.current || !props.containerRef?.current) {
      return () => null;
    }
    if (props.treeNode.node.parentId == props.instance.exec.id)
      selectableNodeBounds.current[props.treeNode.id] =
        calculateRectInContainer(
          ref.current.getBoundingClientRect(),
          props.containerRef.current.getBoundingClientRect()
        );
    setChildNodeSizes(() => {
      const sizes = Array.from(ref.current?.children ?? []).map(
        (node: HTMLElement) => {
          return {
            x: node.offsetLeft,
            y: node.offsetTop,
            width: node.clientWidth,
            height: node.clientHeight,
          };
        }
      );

      return sizes;
    });
    const resizeObserver = new ResizeObserver(() => {
      if (props.treeNode.node.parentId == props.instance.exec.id && ref.current)
        selectableNodeBounds.current[props.treeNode.id] =
          calculateRectInContainer(
            ref.current.getBoundingClientRect(),
            props.containerRef.current.getBoundingClientRect()
          );
      setChildNodeSizes(() => {
        const sizes = Array.from(ref.current?.children ?? []).map(
          (node: HTMLElement) => {
            return {
              x: node.offsetLeft,
              y: node.offsetTop,
              width: node.clientWidth,
              height: node.clientHeight,
            };
          }
        );

        return sizes;
      });
    });
    resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect(); // clean up
  }, [state]);
  const nodeRect = ref.current?.getBoundingClientRect();
  const containerRect = props.containerRef?.current?.getBoundingClientRect();
  const styles = {
    ...defaultFrameStyles,
    ...(props.treeNode.node.type != "flow"
      ? state?.styles
      : {
          width: state?.styles?.width,
          height: state?.styles?.height,
          "--max-width": state?.styles?.["--max-width"],
        }),
    "--translate-x": `${transform?.x ?? 0}px`,
    "--translate-y": `${transform?.y ?? 0}px`,
  } as React.CSSProperties;
  useDndMonitor({
    onDragStart: (e) => {
      if (e.active?.id == dragId) {
        setDragNode(
          <div
            style={{
              width: ref.current.clientWidth,
            }}
          >
            <FrameView
              superstate={props.superstate}
              treeNode={props.treeNode}
              instance={props.instance}
              saveState={null}
            ></FrameView>
          </div>
        );
      }
    },
  });

  return (
    <>
      {(!hidden || !props.treeNode.isRef) && (
        <div
          ref={(el: HTMLDivElement) => {
            ref.current = el;
            selectionMode > FrameEditorMode.Page &&
              draggable &&
              setDraggableNodeRef(el);
          }}
          onContextMenu={() =>
            isTouchScreen(props.superstate.ui) && onLongPress()
          }
          className={classNames(
            `mk-frame-edit ${parseStylesToClass(state?.styles)}`,
            isSelectable &&
              selectionMode != FrameEditorMode.Page &&
              "mk-f-editable",
            selected && selectionMode == FrameEditorMode.Page && "mk-selected"
          )}
          data-path={treeNode.id}
          data-type={treeNode.node.type}
          onMouseEnter={() => {
            setHover(true);
            setIsMouseOverElement(true);
          }}
          onMouseLeave={() => {
            if (!isMouseOverPortal) {
              setHover(false);
            }
            setIsMouseOverElement(false);
          }}
          {...{ onClick }}
          {...(selectionMode > FrameEditorMode.Page
            ? { ...listeners, ...attributes }
            : {})}
          style={styles}
        >
          <FrameEditorInner
            {...nodeProps}
            containerRef={props.containerRef}
            editMode={editMode}
            instance={props.instance}
          >
            {props.children}
          </FrameEditorInner>
        </div>
      )}
      {state &&
        props.treeNode.node.type != "new" &&
        props.containerRef?.current &&
        selectionMode > FrameEditorMode.Read &&
        ref.current &&
        createPortal(
          <>
            <div
              style={{
                position: "absolute",
                top: nodeRect.top - containerRect.top,
                left: nodeRect.left - containerRect.left,
                width: clientWidth,
                height: clientHeight,
                pointerEvents: "none",
              }}
              className={classNames(
                !dragActive &&
                  isSelectable &&
                  selectionMode != FrameEditorMode.Page &&
                  "mk-f-editable",
                !dragActive &&
                  selected &&
                  (selectionMode != FrameEditorMode.Page ||
                    props.treeNode.node.type == "group") &&
                  "mk-f-edit",
                !dragActive &&
                  hover &&
                  selectionMode != FrameEditorMode.Page &&
                  "mk-f-edit-hover"
              )}
              onClick={(e) => {
                if (isSelectable && selectionMode != FrameEditorMode.Page) {
                  if (e.shiftKey) {
                    select(treeNode.node.id, true);
                  } else {
                    select(treeNode.node.id);
                  }
                  e.stopPropagation();
                  return;
                }
              }}
            >
              {props.treeNode.editorProps.resizeMode ==
                FrameResizeMode.ResizeColumn && (
                <FrameResizer
                  size={state?.styles}
                  superstate={props.superstate}
                  resizeMode={props.treeNode.editorProps.resizeMode}
                  resize={saveStyles}
                  clientSize={{
                    width: clientWidth,
                    height: clientHeight,
                  }}
                ></FrameResizer>
              )}
              {dragActive &&
                (selectionMode == FrameEditorMode.Page ||
                  selectionMode == FrameEditorMode.Group) &&
                dropMode > FrameDropMode.DropModeNone && (
                  <FrameEditorDropZone
                    parentId={treeNode.node.parentId}
                    superstate={props.superstate}
                    height={clientHeight}
                    width={clientWidth}
                    node={treeNode.node.id}
                    id={dragId}
                    mode={dropMode}
                    insertMode={
                      treeNode.node.type == "group"
                        ? 1
                        : treeNode.node.type == "space"
                        ? -1
                        : 0
                    }
                  ></FrameEditorDropZone>
                )}
              {canEditLayout && (
                <>
                  <FrameResizer
                    superstate={props.superstate}
                    resizeMode={FrameResizeMode.ResizeSelected}
                    size={state?.styles}
                    resize={saveStyles}
                    clientSize={{
                      width: clientWidth,
                      height: clientHeight,
                    }}
                  ></FrameResizer>
                  <FrameCorners
                    styles={state?.styles}
                    saveStyles={saveStyles}
                    clientSize={{
                      width: clientWidth,
                      height: clientHeight,
                    }}
                  ></FrameCorners>
                  {(treeNode.node.type == "group" ||
                    treeNode.node.type == "content") &&
                    (state.styles?.layout == "row" ||
                      state.styles?.layout == "column") && (
                      <>
                        <FrameGapHandle
                          childSizes={childNodeSizes}
                          clientSize={{
                            width: clientWidth,
                            height: clientHeight,
                            paddingBottom: parseInt(
                              computedStyle?.paddingBottom ?? "0"
                            ),
                            paddingLeft: parseInt(
                              computedStyle?.paddingLeft ?? "0"
                            ),
                            paddingRight: parseInt(
                              computedStyle?.paddingRight ?? "0"
                            ),
                            paddingTop: parseInt(
                              computedStyle?.paddingTop ?? "0"
                            ),
                          }}
                          styles={state?.styles}
                          saveStyles={saveStyles}
                          direction={
                            state?.styles.layout == "column" ? "column" : "row"
                          }
                        ></FrameGapHandle>

                        <FramePadding
                          clientSize={{
                            width: clientWidth,
                            height: clientHeight,
                          }}
                          styles={state?.styles}
                          saveStyles={saveStyles}
                        ></FramePadding>
                      </>
                    )}
                  {/* <FrameMargin
                  clientSize={{
                    width: ref.current?.clientWidth,
                    height: ref.current?.clientHeight,
                  }}
                  margin={state.styles?.margin}
                  setMargin={(margin) => saveStyles({ margin: margin })}
                ></FrameMargin> */}
                </>
              )}
              {treeNode.editorProps.dragMode == FrameDragMode.DragHandle &&
              (!isTouchScreen(props.superstate.ui) || selected) ? (
                <div
                  onMouseEnter={() => {
                    setIsMouseOverPortal(true);
                    setHover(true);
                  }}
                  onMouseLeave={() => {
                    if (!isMouseOverElement) {
                      setHover(false);
                    }
                    setIsMouseOverPortal(false);
                  }}
                  className="mk-editor-frame-hover-menu-container"
                  style={{
                    zIndex: hover
                      ? "calc(var(--layer-popover) + 1)"
                      : "var(--layer-popover)",
                  }}
                >
                  <FrameHoverMenu
                    superstate={props.superstate}
                    node={treeNode.node}
                    mode={selectionMode == FrameEditorMode.Page ? 0 : 1}
                    selected={selected}
                    visible={isTouchScreen(props.superstate.ui) || hover}
                    dragRef={setDraggableNodeRef}
                    attributes={attributes}
                    listeners={listeners}
                  ></FrameHoverMenu>
                </div>
              ) : (
                <></>
              )}
            </div>
            {selection && !dragActive && selected && selection.length == 1 ? (
              <FrameNodeEditorContainer
                nodeRect={nodeRect}
                containerRect={containerRect}
              >
                <FrameNodeEditor
                  editLayout={(state: boolean) => setCanEditLayout(state)}
                  superstate={props.superstate}
                  node={treeNode.node}
                  duplicateFrame={() => {
                    addNode(treeNode.node, treeNode.node);
                  }}
                  state={state}
                  deleteFrame={() => deleteNode(treeNode.node)}
                  fields={propertiesForNode(treeNode.node)}
                ></FrameNodeEditor>
              </FrameNodeEditorContainer>
            ) : selection.length > 1 && selection[0] == treeNode.id ? (
              <FrameNodeEditorContainer
                nodeRect={nodeRect}
                containerRect={containerRect}
              >
                <FrameMultiNodeEditor
                  superstate={props.superstate}
                ></FrameMultiNodeEditor>
              </FrameNodeEditorContainer>
            ) : null}
          </>,
          props.containerRef.current
        )}
    </>
  );
};
