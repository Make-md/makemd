import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import React, { useContext, useMemo, useState } from "react";
export const SpacePropertyEditor = (props: {
  superstate: Superstate;
  colsOrder: string[];
  setColumnOrder: (cols: string[]) => void;
  colsHidden: string[];
  columns: SpaceProperty[];
  contexts: string[];
  saveContexts: (contexts: string[]) => void;
  hideColumn: (column: SpaceTableColumn, hidden: boolean) => void;
  delColumn: (column: SpaceTableColumn) => void;
  saveColumn: (column: SpaceTableColumn, oldColumn?: SpaceTableColumn) => void;
}) => {
  const [activeId, setActiveId] = useState("");
  const items = props.columns.map((f) => ({ ...f, table: "", id: f.name }));
  const [openNodes, setOpenNodes] = useState<string[]>([]);
  const [overId, setOverId] = useState("");

  const contextProperties: Record<
    string,
    { space: SpaceState; cols: SpaceTableColumn[]; path: PathState }
  > = useMemo(() => {
    return props.contexts.reduce((p, c) => {
      return {
        ...p,
        [c]: {
          path: props.superstate.pathsIndex.get(tagSpacePathFromTag(c)),
          space: props.superstate.spacesIndex.get(tagSpacePathFromTag(c)),
          cols:
            props.superstate.contextsIndex.get(tagSpacePathFromTag(c))
              ?.contextTable?.cols ?? [].map((f) => ({ ...f, table: c })),
        },
      };
    }, {});
  }, [props.contexts]);
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
  const resetState = () => {
    setActiveId(null);
    setOverId(null);
  };
  const saveNewField = (source: string, field: SpaceProperty) => {
    props.saveColumn({ ...field, table: "" });
  };
  const newProperty = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showNewPropertyMenu(
      props.superstate,
      offset,
      windowFromDocument(e.view.document),
      {
        spaces: props.contexts ?? [],
        fields: [],
        saveField: saveNewField,
        schemaId: defaultContextSchemaID,
      }
    );
  };
  const newContexts = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const f = props.superstate.spaceManager.readTags();
    const addTag = async (tag: string) => {
      const newTag = ensureTag(tag);
      props.saveContexts([
        ...props.contexts.filter((f) => f != newTag),
        newTag,
      ]);
    };
    props.superstate.ui.openMenu(
      offset,
      {
        ui: props.superstate.ui,
        multi: false,
        editable: true,
        value: [],
        options: f.map((m) => ({ name: m, value: m })),
        saveOptions: (_, value) => addTag(value[0]),
        placeholder: i18n.labels.contextItemSelectPlaceholder,
        searchable: true,
        showAll: true,
      },
      windowFromDocument(e.view.document)
    );
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={({ active }) => {
        setActiveId(active.data.current.id as string);
      }}
      onDragOver={({ active, over }) => {
        const overId = over?.data.current?.id;
        if (overId) setOverId(overId as string);
      }}
      onDragEnd={({ active, over }) => {
        const overId = over?.data.current?.id;

        if (!overId) {
          resetState();
          return;
        }

        props.setColumnOrder(
          arrayMove(
            props.colsOrder,
            props.colsOrder.findIndex((f) => f == activeId),
            props.colsOrder.findIndex((f) => f == overId)
          )
        );

        resetState();
      }}
      onDragCancel={resetState}
    >
      <div className="mk-space-editor">
        <div className="mk-space-editor-header">
          <div className="mk-space-editor-header-title">
            <div className="mk-space-editor-title">
              {i18n.labels.properties}
            </div>
            <div className="mk-space-editor-description">
              {i18n.descriptions.spaceProperties}
            </div>
          </div>
          <span></span>
          <button
            className="mk-toolbar-button"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//combine"),
            }}
            onClick={(e) => {
              newContexts(e);
            }}
          ></button>
          <button
            className="mk-button-new"
            aria-label={i18n.buttons.addItem}
            onClick={(e) => newProperty(e)}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//plus"),
            }}
          ></button>
        </div>

        <div className="mk-space-editor-contents">
          <div className="mk-space-editor-context-list">
            {props.contexts.map((f, i) => (
              <div
                key={i}
                className="mk-props-pill"
                style={
                  contextProperties[f].path?.label?.color?.length > 0
                    ? ({
                        "--tag-background":
                          contextProperties[f].path?.label?.color,
                        "--tag-color": "var(--color-white)",
                      } as React.CSSProperties)
                    : {}
                }
              >
                <div
                  className={`mk-icon-xsmall`}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker(
                      contextProperties[f].path?.label?.sticker
                    ),
                  }}
                ></div>
                {f}
                <div
                  className="mk-icon-small"
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//close"),
                  }}
                  onClick={(e) => {
                    props.saveContexts(props.contexts.filter((g) => g != f));
                  }}
                ></div>
              </div>
            ))}
          </div>
          <div className="mk-space-editor-contents">
            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              {items.map((value, index) => {
                return (
                  <SortableItem
                    key={index}
                    id={value.id}
                    field={value}
                    superstate={props.superstate}
                    saveColumn={(field: SpaceTableColumn) =>
                      props.saveColumn(field, value)
                    }
                    cols={items}
                    colsHidden={props.colsHidden}
                    hideColumn={props.hideColumn}
                    delColumn={props.delColumn}
                  ></SortableItem>
                );
              })}
            </SortableContext>
          </div>
          {props.contexts.map((f, i) => (
            <div key={i} className="mk-property-editor-context">
              <div className="mk-property-editor-list">
                {contextProperties[f]?.cols
                  .filter((f) => f.primary != "true")
                  .map((g, h) => (
                    <SortableItem
                      key={h}
                      id={g.name + "#" + f}
                      field={g}
                      superstate={props.superstate}
                      saveColumn={(field: SpaceTableColumn) =>
                        props.saveColumn(field, g)
                      }
                      cols={contextProperties[f].cols}
                      colsHidden={props.colsHidden}
                      hideColumn={props.hideColumn}
                      delColumn={props.delColumn}
                    ></SortableItem>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {createPortal(
        <DragOverlay adjustScale={false}>
          {activeId ? (
            <SortableItem
              id={items.find((f) => f.id == activeId).id}
              field={items.find((f) => f.id == activeId)}
              superstate={props.superstate}
              cols={items}
              colsHidden={props.colsHidden}
            ></SortableItem>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};

import { CSS } from "@dnd-kit/utilities";
import i18n from "core/i18n";
import { showNewPropertyMenu } from "core/react/components/UI/Menus/contexts/newSpacePropertyMenu";
import {
  selectPropertyTypeMenu,
  showPropertyMenu,
} from "core/react/components/UI/Menus/contexts/spacePropertyMenu";
import { SpaceContext } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import { PathState, SpaceState } from "core/types/superstate";
import { tagSpacePathFromTag } from "core/utils/strings";
import { createPortal } from "react-dom";
import { defaultContextSchemaID, stickerForField } from "schemas/mdb";
import { SpaceProperty, SpaceTableColumn } from "types/mdb";
import { windowFromDocument } from "utils/dom";
import { ensureTag } from "utils/tags";

function SortableItem(props: {
  id: string;
  field: SpaceTableColumn;
  superstate: Superstate;
  cols: SpaceTableColumn[];
  colsHidden: string[];
  hideColumn?: (column: SpaceTableColumn, hidden: boolean) => void;
  delColumn?: (column: SpaceTableColumn) => void;
  saveColumn?: (column: SpaceTableColumn, oldColumn?: SpaceTableColumn) => void;
}) {
  const { spaceInfo } = useContext(SpaceContext);
  const { field } = props;

  const saveField = (field: SpaceTableColumn, oldField: SpaceTableColumn) => {
    if (field.name.length > 0) {
      if (
        field.name != oldField.name ||
        field.type != oldField.type ||
        field.value != oldField.value ||
        field.attrs != oldField.attrs
      ) {
        const saveResult = props.saveColumn(field, oldField);
      }
    }
  };

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const icon = stickerForField(props.field);

  const selectedType = (_: string[], value: string[]) => {
    const newField = {
      ...props.field,
      type: value[0],
    };
    props.saveColumn(newField);
  };
  return (
    <div
      className="mk-property-editor-property"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div
        className="mk-path-context-field-icon"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker(icon),
        }}
        onClick={(e) => {
          selectPropertyTypeMenu(e, props.superstate.ui, selectedType);
        }}
      ></div>
      {props.field.name}
      <span></span>
      <div
        className="mk-icon-small"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//options"),
        }}
        onClick={(e) => {
          const offset = (e.target as HTMLElement).getBoundingClientRect();

          showPropertyMenu({
            superstate: props.superstate,
            rect: offset,
            win: windowFromDocument(e.view.document),
            editable: true,
            options: [],
            field,
            fields: props.cols,
            contextPath: spaceInfo?.path,
            saveField: (newField) => saveField(newField, field),
            hide: props.hideColumn,
            deleteColumn: props.delColumn,
            hidden: props.colsHidden.includes(field.name + field.table),
          });
        }}
      ></div>
    </div>
  );
}
