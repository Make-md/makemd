import {
  Box,
  boxesIntersect,
  useSelectionContainer,
} from "@air/react-drag-to-select";
import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import {
  FrameInstanceContext,
  FrameInstanceProvider,
} from "core/react/context/FrameInstanceContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import { saveProperties } from "core/superstate/utils/spaces";
import { PathPropertyName } from "core/types/context";
import { linkContextRow } from "core/utils/contexts/linkContextRow";
import React, {
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { FrameEditorInstance } from "./Frames/ViewNodes/FrameEditorInstance";
import { FrameInstanceView } from "./Frames/ViewNodes/FrameInstance";

const SpaceOuter = forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<{
    superstate: Superstate;
    containerRef: React.RefObject<HTMLDivElement>;
  }>
>(
  (
    props: React.PropsWithChildren<{
      superstate: Superstate;
      containerRef: React.RefObject<HTMLDivElement>;
    }>,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const [selectionBox, setSelectionBox] = useState<Box>();
    const selectableItems = useRef<Box[]>([]);
    const { frameProperties } = useContext(FramesEditorRootContext);
    const { selectableNodeBounds, id } = useContext(FrameInstanceContext);
    const { selectMulti } = useContext(FrameSelectionContext);
    const { tableData } = useContext(FramesMDBContext);
    const [dragging, setDragging] = useState(false);
    const localRef = useRef(null);
    const [contexts, setContexts] = useState({});
    const [frameProps, setFrameProps] = useState({});
    const { pathState } = useContext(PathContext);
    const { spaceInfo } = useContext(SpaceContext);
    useEffect(() => {
      if (!spaceInfo) {
        return;
      }
      const linkedNote = spaceInfo.notePath;
      const refreshProps = () => {
        if (tableData) {
          const properties = {
            ...(pathState?.metadata?.property ?? {}),
          };

          const row = linkContextRow(
            props.superstate.formulaContext,
            props.superstate.pathsIndex,
            properties,
            tableData?.cols ?? [],
            pathState
          );
          setFrameProps(row);
        } else {
          const properties = {
            ...(pathState?.metadata?.property ?? {}),
          };
          setFrameProps(properties);
        }

        if (!pathState) {
          setContexts({});
          return;
        }
        const pathContexts: Set<string> =
          props.superstate.spacesMap.get(pathState.path) ?? new Set();
        const contexts = [...pathContexts].reduce(
          (p, c) => {
            const context = props.superstate.contextsIndex
              .get(c)
              ?.contextTable?.rows.find(
                (f) => f[PathPropertyName] == pathState.path
              );
            return context ? { ...p, [c]: context } : p;
          },
          {
            $space: {
              note: linkedNote,
              space: pathState.path,
              path: pathState.path,
            },
            $context: {
              _keyValue: pathState.path,
              _schema: "main",
            },
            $properties: frameProperties,
          }
        );
        setContexts(contexts);
      };
      refreshProps();
    }, [spaceInfo, pathState, tableData]);
    const propSetters = Object.keys(frameProps).reduce(
      (p, c) => ({
        ...p,
        [c]: (value: any) => {
          setFrameProps((p) => ({ ...p, [c]: value }));
          saveProperties(props.superstate, pathState.path, {
            [c]: value,
          });
        },
      }),
      {}
    );
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.superstate.ui.resetSelection(null);
      }
    };
    useEffect(() => {
      window.addEventListener("keydown", onKeyDown);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
      };
    }, []);
    const { DragSelection } = useSelectionContainer({
      eventsElement: localRef.current,
      onSelectionChange: (box) => {
        const scroller = localRef.current.parentElement;
        const scrollAwareBox: Box = {
          ...box,
          top: box.top + scroller.scrollTop,
          left: box.left + scroller.scrollLeft,
        };
        setSelectionBox(scrollAwareBox);
        const nodesToSelect: string[] = [];
        Object.keys(selectableNodeBounds.current).forEach((item) => {
          if (
            boxesIntersect(scrollAwareBox, selectableNodeBounds.current[item])
          ) {
            nodesToSelect.push(item);
          }
        });
        selectMulti(nodesToSelect, false);
      },
      onSelectionStart: () => {
        setDragging(true);
      },
      onSelectionEnd: (e) => {
        setTimeout(function () {
          setDragging(false);
        }, 100);
      },
      selectionProps: {
        style: {
          backgroundColor: "hsla(var(--color-accent-hsl), 0.1)",
          border: "2px solid var(--color-accent)",
          borderRadius: 2,
          opacity: 0.5,
        },
      },
      isEnabled: true,
      shouldStartSelecting: (target: EventTarget) => {
        if (
          target instanceof HTMLElement &&
          (target.className.includes("mk-f-main") ||
            target.className.includes("mk-space-outer"))
        )
          return true;
        return false;
      },
    });
    return (
      <div
        className="mk-space-body cm-line"
        ref={(el) => {
          localRef.current = el;
          if (typeof ref == "function") ref(el);
          else if (ref !== null) (ref as any).current = el;
        }}
      >
        <DragSelection />

        {spaceInfo.readOnly ? (
          <FrameInstanceProvider
            id={id ?? "root"}
            superstate={props.superstate}
            props={frameProps}
            contexts={contexts}
            propSetters={propSetters}
            editable={false}
          >
            <FrameInstanceView
              superstate={props.superstate}
            ></FrameInstanceView>
          </FrameInstanceProvider>
        ) : (
          <FrameInstanceProvider
            id={id ?? "root"}
            superstate={props.superstate}
            props={frameProps}
            contexts={contexts}
            propSetters={propSetters}
            editable={true}
          >
            <FrameEditorInstance
              containerRef={props.containerRef}
              superstate={props.superstate}
            ></FrameEditorInstance>
          </FrameInstanceProvider>
        )}
      </div>
    );
  }
);

SpaceOuter.displayName = "SpaceOuter";

export default SpaceOuter;
