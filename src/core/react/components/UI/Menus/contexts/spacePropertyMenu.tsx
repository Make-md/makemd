import i18n from "shared/i18n";

import { normalizedSortForType } from "core/utils/contexts/predicate/sort";
import { nameForField } from "core/utils/frames/frames";
import { SelectOption, SelectOptionType, Superstate } from "makemd-core";
import React, { useState } from "react";
import { fieldTypeForType, fieldTypes } from "schemas/mdb";
import { SpaceTableColumn } from "shared/types/mdb";
import { MenuObject } from "shared/types/menu";
import { Anchors, Rect } from "shared/types/Pos";
import { Sort } from "shared/types/predicate";
import { windowFromDocument } from "shared/utils/dom";
import { safelyParseJSON } from "shared/utils/json";
import { sanitizeColumnName } from "shared/utils/sanitizers";
import StickerModal from "../../../../../../shared/components/StickerModal";
import { defaultMenu, menuInput, menuSeparator } from "../menu/SelectionMenu";
import { PropertyValueComponent } from "./PropertyValue";

export const PropertyMenuComponent = (props: {
  superstate: Superstate;
  field: SpaceTableColumn;
  fields: SpaceTableColumn[];
  contextPath: string;
  options: string[];
  saveField: (field: SpaceTableColumn) => void;
  onSubmenu: (
    openSubmenu: (offset: Rect, onHide: () => void) => MenuObject
  ) => void;
}) => {
  const [field, setField] = useState(props.field);
  const selectedType = (_: string[], value: string[]) => {
    const newField = {
      ...field,
      type: value[0],
      value: JSON.stringify(getNewValueForType(field, value)),
    };
    setField(newField);
    props.saveField(newField);
  };
  const selectPropertyTypeMenu = (
    rect: Rect,
    win: Window,
    selectedType: (_: string[], value: string[]) => void
  ) => {
    return props.superstate.ui.openMenu(
      rect,
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        searchable: false,
        saveOptions: selectedType,
        value: [],
        showAll: true,
        options: fieldTypes
          .filter((f) => !f.restricted)
          .map((f, i) => ({
            id: i + 1,
            name: f.label,
            value: f.type,
            icon: f.icon,
          })),
      },
      win
    );
  };

  const selectedValue = (value: string) => {
    const newField = { ...field, value: value };
    setField(newField);
    props.saveField(newField);
  };

  const toggleMulti = () => {
    const newField = {
      ...field,
      type:
        field.type == fieldType.multiType
          ? fieldType.type
          : fieldType.multiType,
    };
    setField(newField);
    props.saveField(newField);
  };
  const fieldType = fieldTypeForType(field.type, field.name) ?? fieldTypes[0];
  const getNewValueForType = (f: SpaceTableColumn, value: string[]): string => {
    if (value[0].startsWith("option")) {
      return JSON.stringify({
        options: props.options.map((f) => ({
          name: f,
          value: f,
        })),
      });
    }
    return value[0] == fieldType.type || value[0] == fieldType.multiType
      ? f.value
      : null;
  };

  return (
    <>
      <li>
        <div
          className="mk-menu-option"
          onClick={(e) =>
            props.onSubmenu((rect, onHide) =>
              selectPropertyTypeMenu(
                rect,
                windowFromDocument(e.view.document),
                selectedType
              )
            )
          }
        >
          <span>{i18n.labels.propertyType}</span>
          <span>{fieldType.label}</span>
        </div>
      </li>

      {fieldType.multi ? (
        <div className="mk-menu-option">
          <span>{i18n.labels.multiple}</span>
          <input
            type="checkbox"
            checked={field.type == fieldType.multiType}
            onChange={() => toggleMulti()}
          ></input>
        </div>
      ) : (
        <></>
      )}

      <div className="mk-menu-separator"></div>
      <PropertyValueComponent
        superstate={props.superstate}
        name={field.name}
        table={field.table}
        fields={props.fields}
        fieldType={fieldType.type}
        value={field.value}
        contextPath={props.contextPath}
        saveValue={selectedValue}
      ></PropertyValueComponent>
    </>
  );
};
type PropertyMenuProps = {
  superstate: Superstate;
  rect: Rect;
  win: Window;
  editable: boolean;
  options: string[];
  field: SpaceTableColumn;
  fields: SpaceTableColumn[];
  contextPath: string;
  saveField: (field: SpaceTableColumn) => void;
  hide?: (column: SpaceTableColumn, hidden: boolean) => void;
  deleteColumn?: (property: SpaceTableColumn) => void;
  sortColumn?: (sort: Sort) => void;
  hidden?: boolean;
  editCode?: () => void;
  anchor?: Anchors;
};
export const showPropertyMenu = (
  props: PropertyMenuProps,
  onHide?: () => void,
  isSubmenu?: boolean
) => {
  const {
    superstate,
    rect,
    editable,
    options,
    field,
    fields,
    contextPath,
    saveField,

    hide,
    deleteColumn,
    sortColumn,
    editCode,
    hidden,
  } = props;

  const saveName = (value: string) => {
    const sanitizedName = sanitizeColumnName(value);
    if (sanitizedName != field.name || !editable) {
      const fieldValue = safelyParseJSON(field.value);
      saveField({
        ...field,
        value: JSON.stringify({
          ...fieldValue,
          alias: value,
        }),
      });
      return;
    }
    saveField({ ...field, name: value });
  };
  const menuOptions: SelectOption[] = [];

  menuOptions.push(
    menuInput(nameForField(field, props.superstate) ?? "", (value) =>
      saveName(value)
    )
  );
  menuOptions.push(menuSeparator);
  if (editable) {
    menuOptions.push({
      name: "",
      type: SelectOptionType.Custom,
      fragment: (props: {
        hide: () => void;
        onSubmenu: (
          openSubmenu: (offset: Rect, onHide: () => void) => MenuObject
        ) => void;
      }) => (
        <PropertyMenuComponent
          superstate={superstate}
          field={field}
          fields={fields}
          contextPath={contextPath}
          options={options}
          saveField={saveField}
          onSubmenu={props.onSubmenu}
        ></PropertyMenuComponent>
      ),
    });
  }
  menuOptions.push(menuSeparator);

  menuOptions.push({
    name: i18n.menu.setIcon,
    icon: "ui//gem",
    onClick: (e: React.MouseEvent) => {
      superstate.ui.openPalette(
        <StickerModal
          ui={superstate.ui}
          selectedSticker={(emoji) =>
            saveField({ ...field, attrs: JSON.stringify({ icon: emoji }) })
          }
        />,
        windowFromDocument(e.view.document)
      );
    },
  });
  menuOptions.push(menuSeparator);

  const sortableString = normalizedSortForType(field.type, false);

  if (sortableString && sortColumn) {
    menuOptions.push({
      name: i18n.menu.sortAscending,
      icon: "ui//sort-asc",
      onClick: () => {
        sortColumn({
          field: field.name + field.table,
          fn: sortableString,
        });
      },
    });
    menuOptions.push({
      name: i18n.menu.sortDescending,
      icon: "ui//sort-desc",
      onClick: () => {
        sortColumn({
          field: field.name + field.table,
          fn: normalizedSortForType(field.type, true),
        });
      },
    });
  }

  menuOptions.push(menuSeparator);
  if (hide) {
    if (!hidden) {
      menuOptions.push({
        name: i18n.menu.hideProperty,
        icon: "ui//eye-off",
        onClick: () => {
          hide(field, true);
        },
      });
    } else {
      menuOptions.push({
        name: i18n.menu.unhideProperty,
        icon: "ui//eye",
        onClick: () => {
          hide(field, false);
        },
      });
    }
  }
  if (editable) {
    if (editCode) {
      menuOptions.push({
        name: i18n.menu.editCode,
        icon: "ui//code",
        onClick: () => {
          editCode();
        },
      });
    }
    if (deleteColumn) {
      menuOptions.push({
        name: i18n.menu.deleteProperty,
        icon: "ui//trash",
        onClick: () => {
          deleteColumn(field);
        },
      });
    }
  }

  const menu = superstate.ui.openMenu(
    rect,
    defaultMenu(superstate.ui, menuOptions),
    props.win,
    props.anchor,
    onHide
  );
  return menu;
};
