import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import type { Transform } from "@dnd-kit/utilities";
import classNames from "classnames";
import { FlowView } from "components/FlowEditor/FlowView";
import MakeMDPlugin from "main";
import React, { useContext, useEffect, useState } from "react";
import { FilePropertyName } from "types/context";
import { DBRow, MDBColumn } from "types/mdb";
import { DataTypeView } from "../DataTypeView/DataTypeView";
import { MDBContext } from "../MDBContext";

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
  plugin: MakeMDPlugin;
  cols: MDBColumn[];
  value: DBRow;
  onSelect?(modifier: number, index: string): void;
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
        plugin,
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
          onSelect(e.shiftKey ? 1 : e.metaKey ? 2 : 0, value["_index"]);
        } else if (e.detail === 2) {
          onSelect(3, value["_index"]);
        }
      };
      const { updateValue, updateFieldValue, contextTable } =
        useContext(MDBContext);
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
          {value &&
            cols
              .filter((f) => f.type == "preview" && f.table == "")
              .map((f) => (
                <DataTypeView
                  row={value}
                  cols={cols}
                  plugin={plugin}
                  initialValue={value[f.name + f.table]}
                  column={f}
                  index={parseInt(id)}
                  file={value[FilePropertyName]}
                  editable={false}
                  updateValue={(v) =>
                    updateValue(
                      f.name,
                      v,
                      f.table,
                      parseInt(id),
                      value[FilePropertyName]
                    )
                  }
                  updateFieldValue={(v, fv) =>
                    updateFieldValue(
                      f.name,
                      fv,
                      v,
                      f.table,
                      parseInt(id),
                      value[FilePropertyName]
                    )
                  }
                  contextTable={contextTable}
                ></DataTypeView>
              ))}
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
                      plugin={plugin}
                      initialValue={value[f.name + f.table]}
                      column={f}
                      index={parseInt(id)}
                      file={value[FilePropertyName]}
                      editable={false}
                      updateValue={(v) =>
                        updateValue(
                          f.name,
                          v,
                          f.table,
                          parseInt(id),
                          value[FilePropertyName]
                        )
                      }
                      updateFieldValue={(v, fv) =>
                        updateFieldValue(
                          f.name,
                          fv,
                          v,
                          f.table,
                          parseInt(id),
                          value[FilePropertyName]
                        )
                      }
                      contextTable={contextTable}
                    ></DataTypeView>
                  ) : (
                    <></>
                  );
                })}
            </div>
            <FlowView
              plugin={plugin}
              path={value.File}
              load={openFlow}
            ></FlowView>
          </div>
        </li>
      );
    }
  )
);
