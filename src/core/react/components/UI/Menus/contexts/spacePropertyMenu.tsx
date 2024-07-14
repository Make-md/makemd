import i18n from "core/i18n";

import { UIManager } from "core/middleware/ui";
import { Superstate } from "core/superstate/superstate";
import { Sort } from "core/types/predicate";
import { normalizedSortForType } from "core/utils/contexts/predicate/sort";
import React, { useState } from "react";
import { fieldTypeForType, fieldTypes } from "schemas/mdb";
import { Anchors, Rect } from "types/Pos";
import { SpaceTableColumn } from "types/mdb";
import { windowFromDocument } from "utils/dom";
import StickerModal from "../../Modals/StickerModal";
import {
  SelectOption,
  SelectOptionType,
  defaultMenu,
  menuInput,
  menuSeparator,
} from "../menu/SelectionMenu";
import { PropertyValueComponent } from "./PropertyValue";

export const selectPropertyTypeMenu = (
  e: React.MouseEvent,
  ui: UIManager,
  selectedType: (_: string[], value: string[]) => void
) => {
  ui.openMenu(
    (e.target as HTMLElement).getBoundingClientRect(),
    {
      ui: ui,
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
    windowFromDocument(e.view.document)
  );
};

export const PropertyMenuComponent = (props: {
  superstate: Superstate;
  field: SpaceTableColumn;
  fields: SpaceTableColumn[];
  contextPath: string;
  options: string[];
  saveField: (field: SpaceTableColumn) => void;
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
            selectPropertyTypeMenu(e, props.superstate.ui, selectedType)
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
  onHide?: () => void
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

  const menuOptions: SelectOption[] = [];

  if (editable) {
    menuOptions.push(
      menuInput(field?.name ?? "", (value) =>
        saveField({ ...field, name: value })
      )
    );
    menuOptions.push(menuSeparator);

    menuOptions.push({
      name: "",
      type: SelectOptionType.Custom,
      fragment: () => (
        <PropertyMenuComponent
          superstate={superstate}
          field={field}
          fields={fields}
          contextPath={contextPath}
          options={options}
          saveField={saveField}
        ></PropertyMenuComponent>
      ),
    });

    menuOptions.push(menuSeparator);

    menuOptions.push({
      name: i18n.menu.setIcon,
      icon: "ui//gem",
      onClick: (e: React.MouseEvent) => {
        superstate.ui.openPalette(
          (_props: { hide: () => void }) => (
            <StickerModal
              ui={superstate.ui}
              hide={_props.hide}
              selectedSticker={(emoji) =>
                saveField({ ...field, attrs: JSON.stringify({ icon: emoji }) })
              }
            />
          ),
          windowFromDocument(e.view.document)
        );
      },
    });
    menuOptions.push(menuSeparator);
  }
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
  if (editable) {
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
