import { Box } from "@air/react-drag-to-select";
import {
  DndContext,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { BannerView } from "core/react/components/MarkdownEditor/BannerView";
import { MarkdownHeaderView } from "core/react/components/MarkdownEditor/MarkdownHeaderView";
import {
  FramesEditorContext,
  FramesEditorProvider,
} from "core/react/context/FrameEditorContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { FMSpaceKeys } from "core/superstate/utils/spaces";
import { FMMetadataKeys } from "core/types/space";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ContextSchemaType } from "types/mdb";

import { Superstate } from "core/superstate/superstate";
import { defaultFrameListViewID } from "schemas/mdb";
import { SpaceBodyView } from "./Contexts/SpaceBodyView";
import { TitleComponent } from "./TitleComponent";

export interface SpaceProps {
  path: string;
  superstate: Superstate;
}

export const SpaceComponent = (props: SpaceProps) => {
  const { spaceInfo, spaceState, pathState } = useContext(SpaceContext);

  const [collapsed, setCollapsed] = useState(
    !props.superstate.settings.inlineContextExpanded
  );

  const [selectedView, setSelectedView] = useState<ContextSchemaType>(0);

  const frameProps = useMemo(() => {
    if (!spaceInfo) {
      return {};
    }
    const linkedNote = spaceInfo.defPath;
    return {
      ...(spaceState?.metadata ?? {}),
      note: linkedNote,
      space: props.path + "/#*" + defaultFrameListViewID,
    };
  }, [spaceInfo, props.path, spaceState]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const banner =
    pathState?.metadata.property?.[props.superstate.settings.fmKeyBanner];
  return (
    <DndContext
      sensors={sensors}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <FramesEditorProvider
        superstate={props.superstate}
        props={frameProps}
        editMode={1}
      >
        <div className="mk-space-scroller markdown-source-view mod-cm6 is-readable-line-width">
          {spaceState && pathState && (
            <BannerView
              superstate={props.superstate}
              bannerPath={banner}
              itemPath={spaceState.space.defPath}
            ></BannerView>
          )}
          {banner && (
            <div
              className="mk-spacer"
              style={
                {
                  "--mk-header-height":
                    (
                      (props.superstate.ui.getScreenType() == "mobile"
                        ? 1
                        : 0) *
                        26 +
                      138 +
                      (!props.superstate.settings.spacesStickers ||
                      props.superstate.settings.inlineContextNameLayout ==
                        "horizontal"
                        ? 1
                        : 0) *
                        50
                    ).toString() + "px",
                } as React.CSSProperties
              }
            ></div>
          )}
          {spaceState && (
            <SpaceOuter>
              <div className="mk-space-header">
                <div className={`mk-path-context-file`}>
                  <div
                    className={`mk-space-title ${
                      props.superstate.settings.inlineContextNameLayout ==
                      "horizontal"
                        ? "mk-path-context-file-horizontal"
                        : ""
                    }`}
                  >
                    <TitleComponent
                      superstate={props.superstate}
                      path={spaceState.path}
                      readOnly={spaceState.space.readOnly}
                    ></TitleComponent>
                    <div
                      className={`mk-collapse mk-icon-xsmall mk-fold ${
                        collapsed ? "mk-collapsed" : ""
                      }`}
                      dangerouslySetInnerHTML={{
                        __html:
                          props.superstate.ui.getSticker("ui//mk-ui-collapse"),
                      }}
                      onClick={(e) => {
                        setCollapsed(!collapsed);
                        e.stopPropagation();
                      }}
                    ></div>
                  </div>
                  {!collapsed && (
                    <MarkdownHeaderView
                      superstate={props.superstate}
                      path={spaceState.path}
                      showHeader={false}
                      showMetadata={true}
                      hiddenFields={[
                        ...FMMetadataKeys(props.superstate.settings),
                        ...FMSpaceKeys(props.superstate.settings),
                      ]}
                      showBanner={false}
                      editable={true}
                      showFolder={spaceState.type == "folder"}
                    ></MarkdownHeaderView>
                  )}
                </div>
              </div>
              <div className="mk-space-body">
                <SpaceBodyView
                  selectedView={selectedView}
                  superstate={props.superstate}
                  cols={
                    pathState?.properties
                      ? Object.keys(pathState.properties)
                      : []
                  }
                ></SpaceBodyView>
              </div>
            </SpaceOuter>
          )}
        </div>
      </FramesEditorProvider>
    </DndContext>
  );
};

export const SpaceOuter = (props: React.PropsWithChildren<{}>) => {
  const { selectNodes, selectableNodeBounds, selectedNodes, nodes } =
    useContext(FramesEditorContext);
  const [selectionBox, setSelectionBox] = useState<Box>();
  const selectableItems = useRef<Box[]>([]);
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      selectNodes([]);
    }
  };
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
  // const { DragSelection } = useSelectionContainer({
  //   eventsElement: ref.current,
  //   onSelectionChange: (box) => {
  //     const scroller = ref.current.parentElement;
  //     const scrollAwareBox: Box = {
  //       ...box,
  //       top: box.top + scroller.scrollTop,
  //       left: box.left + scroller.scrollLeft,
  //     };

  //     setSelectionBox(scrollAwareBox);
  //     const nodesToSelect: string[] = [];

  //     Object.keys(selectableNodeBounds.current).forEach((item) => {
  //       if (
  //         boxesIntersect(scrollAwareBox, selectableNodeBounds.current[item])
  //       ) {
  //         nodesToSelect.push(item);
  //       }
  //     });

  //     selectNodes(
  //       nodes
  //         .filter((f) => nodesToSelect.some((g) => g == f.id))
  //         .sort((a, b) => a.rank - b.rank)
  //     );
  //   },
  //   onSelectionStart: () => {
  //     setDragging(true);
  //   },
  //   onSelectionEnd: (e) => {
  //     setTimeout(function () {
  //       setDragging(false);
  //     }, 100);
  //   },
  //   selectionProps: {
  //     style: {
  //       backgroundColor: "hsla(var(--color-accent-hsl), 0.1)",
  //       border: "2px solid var(--color-accent)",
  //       borderRadius: 2,
  //       opacity: 0.5,
  //     },
  //   },
  //   isEnabled: true,
  //   shouldStartSelecting: (target: EventTarget) => {
  //     if (
  //       target instanceof HTMLElement &&
  //       (target.className.contains("mk-f-main") ||
  //         target.className.contains("mk-space-outer"))
  //     )
  //       return true;
  //     return false;
  //   },
  // });

  return (
    <div
      className="mk-space-outer cm-line"
      ref={ref}
      onClick={() => {
        if (!dragging) selectNodes([]);
      }}
    >
      {/* <DragSelection /> */}
      {props.children}
    </div>
  );
};
