import { DragOverlay, useDndMonitor } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { showNewPropertyMenu } from "core/react/components/UI/Menus/contexts/newSpacePropertyMenu";
import {
  defaultMenu,
  menuSeparator,
} from "core/react/components/UI/Menus/menu/SelectionMenu";
import { InputModal } from "core/react/components/UI/Modals/InputModal";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { SelectOption, Superstate } from "makemd-core";
import { fieldTypes } from "schemas/mdb";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import i18n from "shared/i18n";
import { DBRow, SpaceTableColumn } from "shared/types/mdb";
import { MenuObject } from "shared/types/menu";
import { windowFromDocument } from "shared/utils/dom";
import { parseLinkString, parseObject } from "utils/parsers";
import {
  coerceStringToType,
  defaultValueForType,
  inferCellTypeForValue,
  propertyIsObjectType,
  tryParseJSON,
} from "utils/properties";
import { CollapseToggleSmall } from "core/react/components/UI/Toggles/CollapseToggleSmall";
import { CellEditMode, TableCellMultiProp } from "../TableView/TableView";
import { DataPropertyView } from "./DataPropertyView";

export type ObjectType = {
  [key: string]: { type: string; label: string; value?: Record<string, any> };
};

const SortableObjectItem: React.FC<{
  id: string;
  namespace: string;
  index: number;
  children: (handleProps: any) => React.ReactNode;
}> = ({ id, namespace, index, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: "object", namespace, index },
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
    >
      {children(listeners)}
    </div>
  );
};

export const ObjectEditor = (props: {
  value: Record<string, any>;
  superstate: Superstate;
  type?: ObjectType;
  typeName: string;
  compactMode: boolean;
  columns: SpaceTableColumn[];
  saveValue: (newValue: Record<string, any>) => void;
  saveType: (newType: ObjectType, newValue: Record<string, any>) => void;
  editMode: CellEditMode;
  row: DBRow;
  index?: number;
  draggable: boolean;
  showDragMenu?: (e: React.MouseEvent) => void;
  showHeader?: boolean;
  dragHandleListeners?: any;
}) => {
  const { value, saveValue, saveType } = props;
  // Two sources of fields: keys with a declared schema in props.type, and
  // keys present in the value that have no declared type (untyped frontmatter
  // sub-keys). For the latter we infer a sensible cell type so links render
  // as links, dates as dates, etc., instead of leaking as text or
  // [object Object]. Memoized because rebuilding this on every render
  // cascaded fresh string identities into nested ObjectCells, which in turn
  // invalidated their useMemos and made deeply-nested frontmatter very slow.
  const allProperties = useMemo(
    () => [
      ...Object.keys(props.type ?? {}).map((f) => ({
        name: f,
        type: props.type[f].type,
        value: JSON.stringify({
          ...props.type[f].value,
          alias: props.type[f].label,
        }),
      })),
      ...Object.keys(value)
        .filter((f) => !Object.keys(props.type ?? {}).includes(f))
        .map((f) => ({
          name: f,
          type: inferCellTypeForValue(value[f], f),
        })),
    ],
    [props.type, value],
  );
  const saveKey = (key: string, newKey: string) => {
    if (key != newKey)
      saveValue({
        ...value,
        [newKey]: value[key],
        [key]: undefined,
      });
  };
  const saveVal = (key: string, val: string | Record<string, any> | any[]) => {
    saveValue({
      ...value,
      [key]: val,
    });
  };

  const showPropertyMenu = (e: React.MouseEvent, field: string) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.menu.rename,
      icon: "ui//edit",
      value: "edit",
      onClick: () => {
        props.superstate.ui.openModal(
          i18n.labels.rename,
          <InputModal
            value={field}
            saveLabel={i18n.labels.rename}
            saveValue={(value) => {
              saveKey(field, value);
            }}
          ></InputModal>,
          windowFromDocument(e.view.document),
        );
      },
    });
    menuOptions.push({
      name: i18n.menu.changePropertyType ?? "Change Type",
      icon: "ui//list",
      value: "change-type",
      onClick: (ev: React.MouseEvent) => {
        // Direct type-picker — onClick on each option fires saveType
        // immediately. Mirrors the top-level Change Type behavior in
        // PropertiesView.selectType: writes a default value for the new
        // type so inference takes effect even when the file's m_fields
        // write is a no-op (orphaned properties without a backing mdb).
        const r = (ev.target as HTMLElement).getBoundingClientRect();
        const currentType = props.type?.[field]?.type;
        const applyType = (newType: string) => {
          if (!newType || newType === currentType) return;
          // Try to convert the existing value to a shape inference will
          // recognise as the new type. Falls back to the new type's
          // default when the value is empty or incompatible.
          const existing = value[field];
          const isEmpty =
            existing == null || existing === "" || existing === " ";
          const fallback = () => defaultValueForType(newType) ?? "";
          const next = (() => {
            if (isEmpty) return fallback();
            switch (newType) {
              case "text":
                return String(existing);
              case "boolean": {
                if (typeof existing === "boolean") return existing;
                if (existing === "true") return true;
                if (existing === "false") return false;
                return fallback();
              }
              case "number": {
                if (typeof existing === "number") return existing;
                const n = Number(existing);
                return Number.isNaN(n) ? fallback() : n;
              }
              case "date":
                if (
                  typeof existing === "string" &&
                  /^\d{4}-\d{2}-\d{2}/.test(existing)
                )
                  return existing;
                return fallback();
              default:
                return existing;
            }
          })();
          saveType(
            {
              ...(props.type ?? {}),
              [field]: {
                ...(props.type?.[field] ?? { label: field }),
                type: newType,
                label: props.type?.[field]?.label ?? field,
              },
            },
            { ...value, [field]: next },
          );
        };
        props.superstate.ui.openMenu(
          r,
          {
            ui: props.superstate.ui,
            multi: false,
            editable: false,
            searchable: true,
            value: currentType ? [currentType] : [],
            showAll: true,
            options: fieldTypes
              .filter((f) => f.metadata)
              .map((f, i) => ({
                id: i + 1,
                name: f.label,
                value: f.type,
                icon: f.icon,
                onClick: () => applyType(f.type),
              })),
            saveOptions: (_keys, values) => applyType(values[0]),
          },
          windowFromDocument(ev.view.document),
        );
      },
    });
    menuOptions.push({
      name: i18n.buttons.delete,
      icon: "ui//trash",
      value: "delete",
      onClick: () => {
        props.saveType(
          Object.keys(props.type ?? {}).reduce((p, c) => {
            if (c != field) return { ...p, [c]: props.type[c] };
            return p;
          }, {}),
          Object.keys(value).reduce((p, c) => {
            if (c != field) return { ...p, [c]: value[c] };
            return p;
          }, {}),
        );
      },
    });
    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document),
    );
  };

  const addProperty = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showNewPropertyMenu(
      props.superstate,
      offset,
      windowFromDocument(e.view.document),
      {
        spaces: [],
        fields: [],
        saveField: (_source, newField) => {
          // Seed the default value for the chosen type — critical for
          // object/object-multi so the live widening hook (which infers from
          // the value shape) sees an object/array rather than "" and types
          // the column entry correctly.
          const seed = defaultValueForType(newField.type);
          saveType(
            {
              ...(props.type ?? {}),
              [newField.name]: {
                type: newField.type,
                label: newField.name,
              },
            },
            { ...value, [newField.name]: seed === undefined ? "" : seed },
          );
          return true;
        },
        fileMetadata: true,
      },
    );
  };

  const saveFieldValue = (
    field: SpaceTableColumn,
    fieldValue: string,
    value: string,
  ) => {
    if (field.type == "object" || field.type == "object-multi") {
      const val = parseObject(value, field.type == "object-multi");
      if (propertyIsObjectType(field)) {
        const parsedValue = parseFieldValue(fieldValue, field.type);

        const newType = {
          ...props.type,
          [field.name]: {
            type: field.type,
            label: field.name,
            value: parsedValue,
          },
        };

        // Pass the merged outer value (current value with just this
        // sub-field replaced) — without this, saveType overwrites our
        // entire value with the inner cell's value, wiping every other
        // sibling key.
        saveType(newType, { ...value, [field.name]: val });
      }
    } else {
      saveVal(field.name, value);
    }
  };
  return (
    <div className="mk-cell-object-group">
      {props.draggable && (
        <div
          className="mk-cell-object-group-header"
          style={{ cursor: "grab", userSelect: "none" }}
          onClick={(e) => {
            props.showDragMenu(e);
          }}
          {...(props.dragHandleListeners ?? {})}
        >
          {props.typeName ?? i18n.fieldTypes.object}
        </div>
      )}
      <div className="mk-cell-object">
        {allProperties.map((f, i) => {
          const raw = value[f.name];
          // DataPropertyView/cell renderers expect a string. Object/array
          // values get JSON-stringified so the routed-to ObjectCell can
          // re-parse them and recurse; primitives get stringified too because
          // BooleanCell, NumberCell, etc. compare on string equality.
          // Link values arrive as raw "[[path]]" strings; LinkCell expects
          // the resolved path without brackets, so strip them here.
          const initial = (() => {
            if (raw == null) return "";
            // Some values may have been serialized once already; peel
            // a JSON-array string back to a live array so multi-link
            // unwrapping below applies uniformly.
            let working: any = raw;
            if (
              typeof working === "string" &&
              (f.type === "link-multi" ||
                f.type === "option-multi" ||
                f.type === "object-multi") &&
              working.trimStart().startsWith("[")
            ) {
              const peeled = tryParseJSON(working);
              if (Array.isArray(peeled)) working = peeled;
            }
            if (Array.isArray(working)) {
              if (f.type === "link-multi") {
                return JSON.stringify(
                  working.map((r) =>
                    typeof r === "string" ? parseLinkString(r) : r,
                  ),
                );
              }
              return JSON.stringify(working);
            }
            if (typeof working === "object") return JSON.stringify(working);
            if (f.type === "link" && typeof working === "string")
              return parseLinkString(working);
            return String(working);
          })();

          // Cell renderers (BooleanCell, NumberCell, the inner ObjectCell)
          // bubble values up as strings. Coerce them back to their native
          // shape before storing so YAML stays clean and downstream
          // inference doesn't misread them as text.
          const isObjectField =
            f.type === "object" || f.type === "object-multi";
          const handleUpdate = (nv: any) => {
            if (isObjectField && typeof nv === "string") {
              const parsed = tryParseJSON(nv);
              if (parsed !== undefined) return saveVal(f.name, parsed);
            }
            saveVal(f.name, coerceStringToType(nv, f.type));
          };

          return (
            <DataPropertyView
              key={f.name}
              initialValue={initial}
              superstate={props.superstate}
              updateValue={handleUpdate}
              updateFieldValue={(fv, nv) => saveFieldValue(f, fv, nv)}
              propertyMenu={(e) => showPropertyMenu(e, f.name)}
              row={value}
              columns={allProperties}
              source={(props.row?.["File"] as string) ?? null}
              compactMode={props.compactMode}
              column={f}
              editMode={CellEditMode.EditModeAlways}
            ></DataPropertyView>
          );
        })}
        <button
          onClick={addProperty}
          className="mk-inline-button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            opacity: 0.7,
          }}
        >
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//plus"),
            }}
          ></div>
          {i18n.labels.propertyFileProp ?? "Property"}
        </button>
      </div>
    </div>
  );
};

export const ObjectCell = (
  props: TableCellMultiProp & {
    savePropValue: (fieldValue: string, newValue: string) => void;
    columns: SpaceTableColumn[];
    compactMode: boolean;
    row: DBRow;
  },
) => {
  const parsedValue = parseFieldValue(props.propertyValue, "object");
  const type = parsedValue.type as ObjectType;
  const { initialValue, superstate } = props;
  const value = useMemo(
    () => parseObject(initialValue, props.multi),
    [initialValue, props.multi],
  );
  const saveType = (newType: ObjectType, _value: Record<string, string>) => {
    if (props.multi) {
      const newValues = (value as Record<string, any>[]).map((f) => ({
        ...Object.keys(newType).reduce((p, c) => {
          if (f[c]) return { ...p, [c]: f[c] };
          return p;
        }, {}),
      }));
      props.savePropValue(
        JSON.stringify({ ...parsedValue, type: newType }),
        JSON.stringify(newValues),
      );
    } else {
      props.savePropValue(
        JSON.stringify({ ...parsedValue, type: newType }),
        JSON.stringify(_value),
      );
    }
  };
  const saveValue = (newValue: { [key: string]: string }) => {
    props.saveValue(JSON.stringify(newValue));
  };
  const insertMultiValue = (index: number) => {
    // type may be undefined when the column has no declared schema yet; in
    // that case start with an empty object so the user can populate via
    // + Property after insertion.
    const item = Object.keys(type ?? {}).reduce(
      (p, c) => ({ ...p, [c]: "" }),
      {},
    );
    const arr = (value as Record<string, any>[]) ?? [];
    props.saveValue(
      JSON.stringify([...arr.slice(0, index), item, ...arr.slice(index)]),
    );
  };
  const saveMultiValue = (
    newValue: { [key: string]: string },
    index: number,
  ) => {
    if (index >= value.length) {
      props.saveValue(JSON.stringify([...value, newValue]));
      return;
    }
    props.saveValue(
      JSON.stringify(
        (value as Record<string, any>[]).map((f, i) =>
          i == index ? newValue : f,
        ),
      ),
    );
  };
  const deleteMultiValue = (index: number) => {
    props.saveValue(
      JSON.stringify(
        (value as Record<string, any>[]).filter((f, i) => i != index),
      ),
    );
  };
  const newKey = (key: string) => {
    if (key)
      saveValue({
        ...value,
        [key]: "",
      });
  };

  // If the initialValue is changed external, sync it up with our state
  const showPropertyMultiMenu = (e: React.MouseEvent, index: number) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.menu.insertAbove,
      value: "insert-above",
      onClick: (e) => {
        insertMultiValue(index);
      },
    });
    menuOptions.push({
      name: i18n.menu.insertBelow,
      value: "insert-below",
      onClick: (e) => {
        insertMultiValue(index + 1);
      },
    });
    menuOptions.push(menuSeparator);
    if (index > 0)
      menuOptions.push({
        name: i18n.menu.moveUp,
        value: "move-up",
        onClick: (e) => {
          props.saveValue(
            JSON.stringify(
              arrayMove(value as Record<string, any>[], index, index - 1),
            ),
          );
        },
      });
    if (index < value.length - 1)
      menuOptions.push({
        name: i18n.menu.moveDown,
        value: "move-down",
        onClick: () => {
          props.saveValue(
            JSON.stringify(
              arrayMove(value as Record<string, any>[], index, index + 1),
            ),
          );
        },
      });

    menuOptions.push(menuSeparator);
    menuOptions.push({
      name: i18n.buttons.delete,
      icon: "ui//trash",
      value: "delete",
      onClick: () => {
        deleteMultiValue(index);
      },
    });

    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document),
    );
  };

  // Per-instance namespace stamped onto each sortable item's data. Without
  // this, a drag started in one ObjectCell's multi-list would also fire the
  // useDndMonitor in any ancestor/sibling ObjectCell (single global DndContext)
  // and reorder the wrong array. Namespace gates onDrag* to this cell only.
  const sortableNamespace = useMemo(
    () => `mk-obj-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );
  const [dragProperty, setDragProperty] = useState<number>(-1);
  const [hoverNode, setHoverNode] = useState<number>(-1);
  const resetState = () => {
    setHoverNode(-1);
    setDragProperty(-1);
  };
  useDndMonitor({
    onDragStart({ active }) {
      const data: any = active.data.current;
      if (data?.type === "object" && data?.namespace === sortableNamespace)
        setDragProperty(data.index);
    },
    onDragOver({ active, over }) {
      const data: any = active.data.current;
      if (data?.type !== "object" || data?.namespace !== sortableNamespace)
        return;
      const overData: any = over?.data.current;
      if (overData?.namespace !== sortableNamespace) return;
      if (typeof overData?.index === "number") setHoverNode(overData.index);
    },
    onDragCancel() {
      resetState();
    },
    onDragEnd({ active }) {
      const data: any = active.data.current;
      if (data?.type !== "object" || data?.namespace !== sortableNamespace) {
        return;
      }
      if (
        dragProperty !== -1 &&
        hoverNode !== -1 &&
        dragProperty !== hoverNode
      ) {
        props.saveValue(
          JSON.stringify(
            arrayMove(value as Record<string, any>[], dragProperty, hoverNode),
          ),
        );
      }
      resetState();
    },
  });

  const menuRef = useRef<MenuObject>();
  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.update(props);
    }
  }, [props]);
  return !props.compactMode ? (
    props.multi ? (
      <div className="mk-cell-object-multi">
        <SortableContext
          items={(value as Record<string, any>[]).map(
            (_, i) => `${sortableNamespace}-${i}`,
          )}
          strategy={verticalListSortingStrategy}
        >
          {(value as Record<string, any>[]).map((f, i) => (
            <SortableObjectItem
              key={i}
              id={`${sortableNamespace}-${i}`}
              namespace={sortableNamespace}
              index={i}
            >
              {(listeners) => (
                <ObjectEditor
                  superstate={superstate}
                  value={f}
                  compactMode={props.compactMode}
                  row={props.row}
                  typeName={parsedValue.typeName}
                  columns={props.columns}
                  type={type}
                  saveValue={(newValue) => saveMultiValue(newValue, i)}
                  saveType={saveType}
                  editMode={props.editMode}
                  draggable={true}
                  index={i}
                  showDragMenu={(e) => showPropertyMultiMenu(e, i)}
                  dragHandleListeners={listeners}
                />
              )}
            </SortableObjectItem>
          ))}
        </SortableContext>
        {/* Bottom-of-list affordance — without this, an empty object-multi
            cell renders nothing and the user has no way to seed the first
            entry from this view. */}
        <button
          onClick={() =>
            insertMultiValue((value as Record<string, any>[]).length)
          }
          className="mk-inline-button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            opacity: 0.7,
          }}
        >
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//plus"),
            }}
          ></div>
          {parsedValue?.typeName ?? i18n.fieldTypes.object}
        </button>
        {dragProperty != -1 &&
          createPortal(
            <DragOverlay dropAnimation={null} zIndex={1600}>
              <ObjectEditor
                superstate={superstate}
                value={value[dragProperty]}
                typeName={parsedValue.typeName}
                compactMode={props.compactMode}
                row={props.row}
                columns={props.columns}
                type={type}
                saveValue={null}
                saveType={null}
                editMode={props.editMode}
                draggable={false}
              ></ObjectEditor>
            </DragOverlay>,
            document.body,
          )}
      </div>
    ) : (
      <ObjectEditor
        superstate={superstate}
        value={value}
        typeName={parsedValue.typeName}
        compactMode={props.compactMode}
        row={props.row}
        columns={props.columns}
        type={type}
        saveValue={saveValue}
        saveType={saveType}
        editMode={props.editMode}
        draggable={false}
      ></ObjectEditor>
    )
  ) : (
    <div className="mk-cell-object">
      <div
        className="mk-cell-clickable"
        onClick={(e) => {
          menuRef.current = superstate.ui.openCustomMenu(
            e.currentTarget.getBoundingClientRect(),
            <ObjectEditorModal {...props}></ObjectEditorModal>,
            props,
            windowFromDocument(e.view.document),
          );
        }}
      >
        <div
          className="mk-icon-xsmall"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//edit"),
          }}
        ></div>
        {`${i18n.menu.edit} ${props.property.name}`}
      </div>
    </div>
  );
};

export const ObjectEditorModal = (
  props: TableCellMultiProp & {
    savePropValue: (fieldValue: string, newValue: string) => void;
    columns: SpaceTableColumn[];
    compactMode: boolean;
    row: DBRow;
    hide?: () => void;
  },
) => {
  const [value, setValue] = useState(props.initialValue);
  const [fieldValue, setFieldValue] = useState(props.propertyValue);
  const saveValue = (value: string) => {
    setValue(value);
    props.saveValue(value);
  };
  const savePropValue = (propValue: string, value: string) => {
    setValue(value);
    setFieldValue(propValue);
    props.savePropValue(propValue, value);
  };

  const saveType = (newType: ObjectType, _value: Record<string, string>) => {
    const parsedValue = parseFieldValue(fieldValue, props.property.type);
    const newValue = parseObject(value, props.property.type == "object-multi");

    if (props.property.type == "object-multi") {
      savePropValue(
        JSON.stringify({ ...parsedValue, type: newType }),
        JSON.stringify(newValue),
      );
    } else {
      savePropValue(
        JSON.stringify({ ...parsedValue, type: newType }),
        JSON.stringify(_value),
      );
    }
  };

  const newProperty = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const type = parseFieldValue(fieldValue, props.property.type)?.type;
    const _value = parseObject(value, props.property.type == "object-multi");
    showNewPropertyMenu(
      props.superstate,
      offset,
      windowFromDocument(e.view.document),
      {
        spaces: [],
        fields: [],
        saveField: (source, field) => {
          saveType(
            {
              ...(type ?? {}),
              [field.name]: { type: field.type, label: field.name },
            },
            {
              ..._value,
              [field.name]: "",
            },
          );
          return true;
        },
        fileMetadata: true,
      },
    );
  };
  const insertMultiValue = (index: number) => {
    const val = parseObject(value, props.property.type == "object-multi");
    const type = parseFieldValue(fieldValue, props.property.type)?.type;

    const item = Object.keys(type).reduce((p, c) => ({ ...p, [c]: "" }), {});
    saveValue(
      JSON.stringify([...val.slice(0, index), item, ...val.slice(index)]),
    );
  };
  return (
    <div className="mk-editor-frame-properties">
      <div className="mk-editor-actions-name">
        <div className="mk-editor-actions-name-icon">
          <div
            className="mk-icon-small"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//list"),
            }}
          ></div>
        </div>
        <div className="mk-editor-actions-name-text">
          {i18n.labels.editObject}
        </div>
        <span></span>
        <div
          className="mk-icon-small mk-inline-button"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//close"),
          }}
          onClick={() => props.hide()}
        ></div>
      </div>

      <ObjectCell
        {...props}
        initialValue={value}
        compactMode={false}
        propertyValue={fieldValue}
        saveValue={(v) => {
          saveValue(v);
        }}
        savePropValue={(v, p) => {
          savePropValue(v, p);
        }}
        editMode={CellEditMode.EditModeAlways}
      ></ObjectCell>
      <div className="mk-cell-object-options">
        <button onClick={(e) => newProperty(e)} className="mk-toolbar-button">
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//plus"),
            }}
          ></div>
          {i18n.labels.propertyFileProp}
        </button>
        {props.property.type == "object-multi" && (
          <button
            onClick={(e) => insertMultiValue(0)}
            className="mk-inline-button"
          >
            <div
              className="mk-icon-xsmall"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//insert"),
              }}
            ></div>
            {i18n.fieldTypes.object}
          </button>
        )}
      </div>
    </div>
  );
};
