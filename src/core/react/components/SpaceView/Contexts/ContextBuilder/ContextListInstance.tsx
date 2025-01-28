import { Active, Over, useDndMonitor } from "@dnd-kit/core";
import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { FrameInstanceProvider } from "core/react/context/FrameInstanceContext";
import { FrameSelectionProvider } from "core/react/context/FrameSelectionContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { WindowContext } from "core/react/context/WindowContext";
import {
  saveProperties,
  updatePathRankInSpace,
} from "core/superstate/utils/spaces";
import { updateTableValue } from "core/utils/contexts/context";
import _ from "lodash";
import { Superstate } from "makemd-core";
import React, { useContext, useEffect, useState } from "react";
import { defaultContextSchemaID } from "shared/schemas/context";
import { FrameContexts, FrameEditorMode } from "shared/types/frameExec";
import { DBRow, SpaceProperty } from "shared/types/mdb";
import { FrameTreeProp } from "shared/types/mframe";
import { URI } from "shared/types/path";
import { SpaceInfo } from "shared/types/spaceInfo";
import { FrameEditorInstance } from "../../Frames/ViewNodes/FrameEditorInstance";
import { FrameInstanceView } from "../../Frames/ViewNodes/FrameInstance";
export const ContextListInstance = (
  props: React.PropsWithChildren<{
    superstate: Superstate;
    id: string;
    props: FrameTreeProp;
    type: string;
    cols: SpaceProperty[];
    contexts: FrameContexts;
    uri: URI;
    propSetters: {
      [key: string]: (value: any) => void;
    };
    editMode: FrameEditorMode;
    containerRef: React.RefObject<HTMLDivElement>;
    path?: string;
  }>
) => {
  const [contexts, setContexts] = useState(props.contexts);
  useEffect(
    () =>
      setContexts((p) => (_.isEqual(props.contexts, p) ? p : props.contexts)),
    [props.contexts]
  );
  const { spaceInfo } = useContext(SpaceContext);
  const { dbSchema } = useContext(ContextEditorContext);
  const { setDragNode } = useContext(WindowContext);
  const ref = React.useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    active,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging,
    transition,
    isOver,
    over,
  } = useSortable({
    id: props.id,
    data: {
      id: props.id,
      type: props.type,
      space: spaceInfo?.path,
      schema: dbSchema?.id,
      props: props.props,
      contexts: contexts,
    },
    disabled: props.type != "listItem" || props.editMode > FrameEditorMode.Read,
    animateLayoutChanges: defaultAnimateLayoutChanges,
  });

  useDndMonitor({
    onDragStart: (e) => {
      if (e.active.data.current.id == props.id) {
        setDragNode(
          // <FrameRootView
          //   superstate={props.superstate}
          //   path={props.uri}
          //   props={props.props}
          //   cols={props.cols}
          //   propSetters={props.propSetters}
          //   contexts={props.contexts}
          // >
          //   {props.children}
          // </FrameRootView>
          <div dangerouslySetInnerHTML={{ __html: ref.current.innerHTML }} />
        );
      }
    },
    onDragOver: (over) => {},
    onDragEnd: ({ active, over }) => {
      const dragReorder =
        over &&
        over.data.current.space == spaceInfo?.path &&
        over.data.current.schema == dbSchema?.id;

      dropListItem(dragReorder, over, props, active, spaceInfo);
    },
  });

  return props.editMode >= FrameEditorMode.Page &&
    props.uri.authority != "$kit" ? (
    <FrameSelectionProvider
      superstate={props.superstate}
      id={props.id}
      editMode={props.editMode}
      selected={props.editMode == FrameEditorMode.Group}
    >
      <FrameInstanceProvider
        id={props.id}
        superstate={props.superstate}
        props={props.props}
        propSetters={props.propSetters}
        contexts={contexts}
        editable={true}
      >
        <FrameEditorInstance
          superstate={props.superstate}
          containerRef={props.containerRef}
        >
          {props.children}
        </FrameEditorInstance>
      </FrameInstanceProvider>
    </FrameSelectionProvider>
  ) : (
    <>
      {over?.id == props.id &&
        active.data.current.type == props.type &&
        !(
          active.data.current.space == spaceInfo?.path &&
          active.data.current.schema == dbSchema?.id &&
          active.data.current.props?._groupValue == props.props?._groupValue
        ) && (
          <FrameInstanceProvider
            id={props.id}
            superstate={props.superstate}
            props={props.props}
            propSetters={props.propSetters}
            contexts={contexts}
            editable={false}
          >
            <FrameInstanceView
              superstate={props.superstate}
              source={spaceInfo.path}
            ></FrameInstanceView>
          </FrameInstanceProvider>
        )}
      {
        <div
          ref={(el) => {
            setDraggableNodeRef(el);
            ref.current = el;
          }}
          {...attributes}
          {...listeners}
          style={{
            transform: CSS.Transform.toString(transform),
            transition,
          }}
        >
          <FrameInstanceProvider
            id={props.id}
            superstate={props.superstate}
            props={props.props}
            propSetters={props.propSetters}
            contexts={contexts}
            editable={false}
          >
            <FrameInstanceView
              superstate={props.superstate}
              source={spaceInfo.path}
            >
              {props.children}
            </FrameInstanceView>
          </FrameInstanceProvider>
        </div>
      }
    </>
  );
};
const dropListItem = async (
  dragReorder: boolean,
  over: Over,
  props: React.PropsWithChildren<{
    superstate: Superstate;
    id: string;
    props: DBRow;
    type: string;
    cols: SpaceProperty[];
    contexts: FrameContexts;
    uri: URI;
    propSetters: { [key: string]: (value: any) => void };
    editMode: FrameEditorMode;
    containerRef: React.RefObject<HTMLDivElement>;
    path?: string;
  }>,
  active: Active,
  spaceInfo: SpaceInfo
) => {
  if (dragReorder && over.id == props.id) {
    if (active.data.current.schema == defaultContextSchemaID) {
      const activePath = active.data.current.contexts?.$context?.["_keyValue"];
      const context = over.data.current.contexts?.$context;
      const groupValueMismatch =
        props.props?._groupValue != active.data.current.props?._groupValue;

      if (activePath && context) {
        if (groupValueMismatch) {
          {
            saveProperties(props.superstate, activePath, {
              [props.props?._groupField]: props.props?._groupValue,
            });
          }
        } else {
          updatePathRankInSpace(
            props.superstate,
            activePath,
            context._index,
            spaceInfo.path
          );
        }
      }
    } else {
      const context = over.data.current.contexts?.$context;
      updateTableValue(
        props.superstate.spaceManager,
        spaceInfo,
        active.data.current.schema,
        active.data.current.contexts?.$context?.["_index"],
        props.props?._groupField,
        props.props?._groupValue,
        context?._index
      );
    }
  }
};
