import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import type { Transform } from "@dnd-kit/utilities";
import classNames from "classnames";
import { PathView } from "core/react/components/PathView/PathView";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { Superstate } from "core/superstate/superstate";
import { PathPropertyName } from "core/types/context";
import { Predicate } from "core/types/predicate";
import { PointerModifiers } from "core/types/ui";
import React, { useContext, useEffect, useState } from "react";
import { DBRow, SpaceTableColumn } from "types/mdb";
import { DataTypeView } from "../DataTypeView/DataTypeView";
import { PreviewCell } from "../DataTypeView/PreviewCell";

export interface CardViewProps {
  dragOverlay?: boolean;
  id: string;
  color?: string;
  disabled?: boolean;
  dragging?: boolean;
  handle?: boolean;
  height?: number;
  index?: number;
  fadeIn?: boolean;
  transform?: Transform | null;
  listeners?: DraggableSyntheticListeners;
  selected?: boolean;
  sorting?: boolean;
  style?: React.CSSProperties;
  transition?: string | null;
  wrapperStyle?: React.CSSProperties;
  superstate: Superstate;
  cols: SpaceTableColumn[];
  value: DBRow;

  onSelect?(modifier: PointerModifiers, index: string): void;
  onRemove?(): void;
  renderItem?(args: {
    dragOverlay: boolean;
    dragging: boolean;
    sorting: boolean;
    index: number | undefined;
    fadeIn: boolean;
    listeners: DraggableSyntheticListeners;
    ref: React.Ref<HTMLElement>;
    style: React.CSSProperties | undefined;
    transform: CardViewProps["transform"];
    transition: CardViewProps["transition"];
    value: CardViewProps["value"];
    predicate: Predicate;
  }): React.ReactElement;
}

export const CardView = React.memo(
  React.forwardRef<HTMLLIElement, CardViewProps>(
    (
      {
        color,
        dragOverlay,
        dragging,
        disabled,
        fadeIn,
        handle,
        height,
        index,
        listeners,
        selected,
        onSelect,
        onRemove,
        renderItem,
        superstate,
        id,
        sorting,
        style,
        transition,
        transform,
        value,
        cols,
        wrapperStyle,
        ...props
      },
      ref
    ) => {
      const onClickHandler = (e: React.MouseEvent) => {
        if (!onSelect) {
          return;
        }

        if (e.detail === 1) {
          onSelect(
            {
              metaKey: e.metaKey,
              ctrlKey: e.ctrlKey,
              altKey: e.altKey,
              shiftKey: e.shiftKey,
            },
            value["_index"]
          );
        } else if (e.detail === 2) {
          onSelect(
            {
              doubleClick: true,
              metaKey: e.metaKey,
              ctrlKey: e.ctrlKey,
              altKey: e.altKey,
            },
            value["_index"]
          );
        }
      };
      const { updateValue, updateFieldValue, contextTable, predicate } =
        useContext(ContextEditorContext);
      useEffect(() => {
        if (!dragOverlay) {
          return;
        }

        document.body.style.cursor = "grabbing";

        return () => {
          document.body.style.cursor = "";
        };
      }, [dragOverlay]);
      const [openFlow, setOpenFlow] = useState(false);

      return renderItem ? (
        renderItem({
          dragOverlay: Boolean(dragOverlay),
          dragging: Boolean(dragging),
          sorting: Boolean(sorting),
          index,
          fadeIn: Boolean(fadeIn),
          listeners,
          ref,
          style,
          transform,
          transition,
          value,
          predicate,
        })
      ) : (
        <li
          className={classNames(
            "mk-list-item",
            fadeIn && "fadeIn",
            sorting && "sorting",
            dragOverlay && "dragOverlay",
            selected && "mk-is-active"
          )}
          onClick={onClickHandler}
          style={
            {
              ...wrapperStyle,
              transition,
              "--translate-x": transform
                ? `${Math.round(transform.x)}px`
                : undefined,
              "--translate-y": transform
                ? `${Math.round(transform.y)}px`
                : undefined,
              "--scale-x": transform?.scaleX
                ? `${transform.scaleX}`
                : undefined,
              "--scale-y": transform?.scaleY
                ? `${transform.scaleY}`
                : undefined,
              "--index": index,
              "--color": color,
            } as React.CSSProperties
          }
          ref={ref}
        >
          {value && (
            <PreviewCell
              row={value}
              columns={cols}
              superstate={superstate}
              initialValue={""}
              saveValue={() => {}}
              path={value[PathPropertyName]}
            ></PreviewCell>
          )}
          <div className="mk-list-content">
            <div
              className={classNames(
                "mk-list-fields",
                dragging && "dragging",
                handle && "withHandle",
                dragOverlay && "dragOverlay",
                disabled && "disabled",
                color && "color"
              )}
              style={style}
              data-cypress="draggable-item"
              {...listeners}
              {...props}
              tabIndex={!handle ? 0 : undefined}
            >
              {value &&
                cols.map((f) => {
                  return value[f.name + f.table]?.length > 0 ? (
                    <DataTypeView
                      openFlow={() => setOpenFlow((o) => !o)}
                      superstate={superstate}
                      initialValue={value[f.name + f.table]}
                      column={f}
                      row={value}
                      editable={false}
                      updateValue={(v) =>
                        updateValue(
                          f.name,
                          v,
                          f.table,
                          parseInt(id),
                          value[PathPropertyName]
                        )
                      }
                      updateFieldValue={(v, fv) =>
                        updateFieldValue(
                          f.name,
                          fv,
                          v,
                          f.table,
                          parseInt(id),
                          value[PathPropertyName]
                        )
                      }
                      contextTable={contextTable}
                    ></DataTypeView>
                  ) : (
                    <></>
                  );
                })}
            </div>
            <PathView
              superstate={superstate}
              path={value[PathPropertyName]}
              load={openFlow}
            ></PathView>
          </div>
        </li>
      );
    }
  )
);
