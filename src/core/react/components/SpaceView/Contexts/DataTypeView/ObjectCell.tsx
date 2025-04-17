import { DragOverlay, useDndMonitor } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { showNewPropertyMenu } from "core/react/components/UI/Menus/contexts/newSpacePropertyMenu";
import {
  defaultMenu,
  menuSeparator,
} from "core/react/components/UI/Menus/menu/SelectionMenu";
import { InputModal } from "core/react/components/UI/Modals/InputModal";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { SelectOption, Superstate } from "makemd-core";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import i18n from "shared/i18n";
import { DBRow, SpaceTableColumn } from "shared/types/mdb";
import { MenuObject } from "shared/types/menu";
import { windowFromDocument } from "shared/utils/dom";
import { parseObject } from "utils/parsers";
import { propertyIsObjectType } from "utils/properties";
import { CellEditMode, TableCellMultiProp } from "../TableView/TableView";
import { DataPropertyView } from "./DataPropertyView";

export type ObjectType = {
  [key: string]: { type: string; label: string; value?: Record<string, any> };
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
}) => {
  const { value, saveValue, saveType } = props;
  const allProperties = [
    ...Object.keys(props.type ?? {}).map((f) => {
      return {
        name: f,
        type: props.type[f].type,
        value: JSON.stringify({
          ...props.type[f].value,
          alias: props.type[f].label,
        }),
      };
    }),
    ...Object.keys(value)
      .filter((f) => !Object.keys(props.type ?? {}).includes(f))
      .map((f) => {
        return {
          name: f,
          type: "text",
        };
      }),
  ];
  const saveKey = (key: string, newKey: string) => {
    if (key != newKey)
      saveValue({
        ...value,
        [newKey]: value[key],
        [key]: undefined,
      });
  };
  const saveVal = (key: string, val: string) => {
    saveValue({
      ...value,
      [key]: val,
    });
  };

  const showPropertyMenu = (e: React.MouseEvent, field: string) => {
    if (props.editMode <= CellEditMode.EditModeValueOnly) {
      return;
    }
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
          windowFromDocument(e.view.document)
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
          }, {})
        );
      },
    });
    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document)
    );
  };

  const saveFieldValue = (
    field: SpaceTableColumn,
    fieldValue: string,
    value: string
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

        saveType(newType, val);
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
          onClick={(e) => {
            props.showDragMenu(e);
          }}
        >
          {props.typeName ?? "Object"}
        </div>
      )}
      <div className="mk-cell-object">
        {allProperties.map((f, i) => (
          <DataPropertyView
            key={i}
            initialValue={value[f.name] ?? ""}
            superstate={props.superstate}
            updateValue={(v) => saveVal(f.name, v)}
            updateFieldValue={(fv, v) => saveFieldValue(f, fv, v)}
            propertyMenu={(e) => showPropertyMenu(e, f.name)}
            row={value}
            columns={allProperties}
            source={null}
            compactMode={props.compactMode}
            column={f}
            editMode={CellEditMode.EditModeAlways}
          ></DataPropertyView>
        ))}
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
  }
) => {
  const parsedValue = parseFieldValue(props.propertyValue, "object");
  const type = parsedValue.type as ObjectType;
  const { initialValue, superstate } = props;
  const value = useMemo(
    () => parseObject(initialValue, props.multi),
    [initialValue, props.multi]
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
        JSON.stringify(newValues)
      );
    } else {
      props.savePropValue(
        JSON.stringify({ ...parsedValue, type: newType }),
        JSON.stringify(_value)
      );
    }
  };
  const saveValue = (newValue: { [key: string]: string }) => {
    props.saveValue(JSON.stringify(newValue));
  };
  const insertMultiValue = (index: number) => {
    const item = Object.keys(type).reduce((p, c) => ({ ...p, [c]: "" }), {});
    props.saveValue(
      JSON.stringify([...value.slice(0, index), item, ...value.slice(index)])
    );
  };
  const saveMultiValue = (
    newValue: { [key: string]: string },
    index: number
  ) => {
    if (index >= value.length) {
      props.saveValue(JSON.stringify([...value, newValue]));
      return;
    }
    props.saveValue(
      JSON.stringify(
        (value as Record<string, any>[]).map((f, i) =>
          i == index ? newValue : f
        )
      )
    );
  };
  const deleteMultiValue = (index: number) => {
    props.saveValue(
      JSON.stringify(
        (value as Record<string, any>[]).filter((f, i) => i != index)
      )
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
              arrayMove(value as Record<string, any>[], index, index - 1)
            )
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
              arrayMove(value as Record<string, any>[], index, index + 1)
            )
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
      windowFromDocument(e.view.document)
    );
  };

  const [dragProperty, setDragProperty] = useState<number>(-1);
  const [hoverNode, setHoverNode] = useState<number>(-1);
  const resetState = () => {
    setHoverNode(-1);
    setDragProperty(-1);
  };
  useDndMonitor({
    onDragStart({ active }) {
      if (active.data.current.type == "object")
        setDragProperty(active.data.current.id);
    },
    onDragOver({ active, over }) {
      const overId = over?.data.current.id;
      if (active.data.current.type == "object")
        if (overId) setHoverNode(overId as number);
    },
    onDragCancel() {
      resetState();
    },
    onDragEnd({ active, over }) {
      if (!active || hoverNode != -1) {
        resetState();
        return;
      }
      props.saveValue(
        JSON.stringify(
          arrayMove(value as Record<string, any>[], dragProperty, hoverNode)
        )
      );
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
        {(value as Record<string, any>[]).map((f, i) => (
          <ObjectEditor
            key={i}
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
          ></ObjectEditor>
        ))}
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
            document.body
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
            windowFromDocument(e.view.document)
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
  }
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
        JSON.stringify(newValue)
      );
    } else {
      savePropValue(
        JSON.stringify({ ...parsedValue, type: newType }),
        JSON.stringify(_value)
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
            }
          );
          return true;
        },
        fileMetadata: true,
      }
    );
  };
  const insertMultiValue = (index: number) => {
    const val = parseObject(value, props.property.type == "object-multi");
    const type = parseFieldValue(fieldValue, props.property.type)?.type;

    const item = Object.keys(type).reduce((p, c) => ({ ...p, [c]: "" }), {});
    saveValue(
      JSON.stringify([...val.slice(0, index), item, ...val.slice(index)])
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
            Object
          </button>
        )}
      </div>
    </div>
  );
};
