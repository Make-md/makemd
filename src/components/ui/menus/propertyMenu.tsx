import { filePropTypes } from "components/ContextView/TableView/ColumnHeader";
import i18n from "i18n";
import MakeMDPlugin from "main";
import { Menu, Point } from "obsidian";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { fieldTypeForType, fieldTypes } from "schemas/mdb";
import { MDBColumn } from "types/mdb";
import { Sort } from "types/predicate";
import { normalizedSortForType } from "utils/contexts/predicate/sort";
import { loadTags } from "utils/metadata/tags";
import { serializeMultiString } from "utils/serializer";
import { inputMenuItem, showSelectMenu } from "./menuItems";

export const PropertyValueComponent = (props: {
  plugin: MakeMDPlugin;
  table: string;
  fieldType: string;
  value: string;
  fields: MDBColumn[];
  contextPath: string;
  saveValue: (value: string) => void;
  saveContext: (context: string) => void;
}) => {
  const selectContext = (e: React.MouseEvent) => {
    showSelectMenu((e.target as HTMLElement).getBoundingClientRect(), {
      multi: false,
      editable: true,
      searchable: true,
      saveOptions: (_, v) => props.saveContext(v[0]),
      placeholder: i18n.labels.propertyContext,
      value: [props.value ?? ""],
      options: loadTags(props.plugin).map((m) => ({ name: m, value: m })),
    });
  };
  const selectFileProp = (e: React.MouseEvent) => {
    const properties = props.plugin.index.contextsIndex
      .get(props.contextPath)
      ?.cols.filter(
        (f) => f.type == "file" || f.type == "link" || f.type == "context"
      )
      .reduce((p, c) => {
        return [
          ...p,
          ...(c.type == "file" || c.type == "link"
            ? filePropTypes.map((f) => ({
                name: c.name + "." + f.name,
                value: c.name + "." + f.value,
              }))
            : props.plugin.index.contextsIndex
                .get(c.value)
                ?.cols.filter((f) => f.hidden != "true")
                .map((f) => ({
                  name: c.name + "." + f.name,
                  value: c.name + "." + f.name,
                })) ?? []),
        ];
      }, []);
    showSelectMenu((e.target as HTMLElement).getBoundingClientRect(), {
      multi: false,
      editable: false,
      searchable: false,
      saveOptions: (_, v) => props.saveValue(v[0]),
      value: [],
      options: properties,
      showAll: true,
    });
  };
  const selectDateFormat = (e: React.MouseEvent) => {
    const formats = [
      {
        name: "2020-04-21",
        value: "yyyy-MM-dd",
      },
      {
        name: "Apr 21, 2020",
        value: "MMM d, yyyy",
      },
      {
        name: "Tue Apr 21, 2020",
        value: "EEE MMM d, yyyy",
      },
    ];
    showSelectMenu((e.target as HTMLElement).getBoundingClientRect(), {
      multi: false,
      editable: true,
      searchable: false,
      saveOptions: (_, v) => props.saveValue(v[0]),
      value: [],
      options: formats,
      showAll: true,
      placeholder: i18n.labels.selectDateFormat,
    });
  };
  return props.fieldType.startsWith("date") ? (
    <div className="menu-item" onClick={(e) => selectDateFormat(e)}>
      <span>{i18n.labels.dateFormat}</span>
      <span>{props.value}</span>
    </div>
  ) : props.fieldType.startsWith("context") ? (
    <div className="menu-item" onClick={(e) => selectContext(e)}>
      <span>{i18n.labels.propertyContext}</span>
      <span>{props.value}</span>
    </div>
  ) : props.fieldType == "fileprop" ? (
    <div className="menu-item" onClick={(e) => selectFileProp(e)}>
      <span>{i18n.labels.propertyFileProp}</span>
      <span>{props.value}</span>
    </div>
  ) : (
    <></>
  );
};

export const PropertyMenuComponent = (props: {
  plugin: MakeMDPlugin;
  field: MDBColumn;
  fields: MDBColumn[];
  contextPath: string;
  options: string[];
  saveField: (field: MDBColumn) => void;
  saveContext: (field: MDBColumn, value: string[]) => void;
}) => {
  const [field, setField] = useState(props.field);
  const selectedType = (_: string[], value: string[]) => {
    const newField = {
      ...field,
      type: value[0],
      value: getNewValueForType(field, value),
    };
    setField(newField);
    props.saveField(newField);
  };
  const selectedValue = (value: string) => {
    const newField = { ...field, value: value };
    setField(newField);
    props.saveField(newField);
  };
  const selectedContext = (context: string) => {
    const newField = { ...field, value: context };
    setField(newField);
    props.saveContext(newField, [context]);
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
  const fieldType = fieldTypeForType(field.type) ?? fieldTypes[0];
  const getNewValueForType = (f: MDBColumn, value: string[]) => {
    if (value[0].startsWith("option")) {
      return serializeMultiString(props.options);
    }
    return value[0] == fieldType.type || value[0] == fieldType.multiType
      ? f.value
      : null;
  };

  const selectType = (e: React.MouseEvent) => {
    showSelectMenu((e.target as HTMLElement).getBoundingClientRect(), {
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
          icon: "",
        })),
    });
  };

  return (
    <>
      <div className="menu-item" onClick={(e) => selectType(e)}>
        <span>{i18n.labels.propertyType}</span>
        <span>{fieldType.label}</span>
      </div>
      {fieldType.multi ? (
        <div className="menu-item">
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
      <div className="menu-separator"></div>
      <PropertyValueComponent
        plugin={props.plugin}
        table={field.table}
        fields={props.fields}
        fieldType={fieldType.type}
        value={field.value}
        contextPath={props.contextPath}
        saveValue={selectedValue}
        saveContext={selectedContext}
      ></PropertyValueComponent>
    </>
  );
};

export const showPropertyMenu = (
  plugin: MakeMDPlugin,
  position: Point,
  editable: boolean,
  options: string[],
  field: MDBColumn,
  fields: MDBColumn[],
  contextPath: string,
  saveField: (field: MDBColumn) => void,
  saveContext: (field: MDBColumn, value: string[]) => void,
  hide: (column: MDBColumn, hidden: boolean) => void,
  deleteColumn: (property: MDBColumn) => void,
  sortColumn: (sort: Sort) => void,
  hidden: boolean
) => {
  const menu = new Menu();
  menu.setUseNativeMenu(false);
  if (editable) {
    menu.addItem((menuItem) => {
      inputMenuItem(menuItem, field?.name ?? "", (value) =>
        saveField({ ...field, name: value })
      );
      menuItem.setIcon("type");
    });

    menu.addSeparator();
    const frag = document.createDocumentFragment();

    const div = frag.createDiv();
    div.addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      // e.target.focus();
    });
    //   div.addEventListener("mousedown", (e) => {
    //     e.stopImmediatePropagation();
    //   });
    //   div.addEventListener("mouseup", (e) => {
    //     e.stopImmediatePropagation();
    //   });
    div.addEventListener("keydown", (e) => {});
    const root = createRoot(div);
    root.render(
      <>
        <PropertyMenuComponent
          plugin={plugin}
          field={field}
          fields={fields}
          contextPath={contextPath}
          options={options}
          saveField={saveField}
          saveContext={saveContext}
        ></PropertyMenuComponent>
      </>
    );
    menu.addItem((menuItem) => {
      menuItem.setTitle(frag);
      menuItem.dom.toggleClass("mk-properties", true);
    });

    menu.addSeparator();
    if (!hidden) {
      menu.addItem((menuItem) => {
        menuItem.setTitle(i18n.menu.hideProperty);
        menuItem.onClick(() => {
          hide(field, true);
        });
        menuItem.setIcon("eye-off");
      });
    } else {
      menu.addItem((menuItem) => {
        menuItem.setTitle(i18n.menu.unhideProperty);
        menuItem.onClick(() => {
          hide(field, false);
        });
        menuItem.setIcon("eye");
      });
    }
    menu.addItem((menuItem) => {
      menuItem.setTitle(i18n.menu.deleteProperty);
      menuItem.onClick(() => {
        deleteColumn(field);
      });
      menuItem.setIcon("trash-2");
    });
    menu.addSeparator();
  }
  const sortableString = normalizedSortForType(field.type, false);
  if (sortableString) {
    menu.addItem((menuItem) => {
      menuItem.setTitle(i18n.menu.sortAscending);
      menuItem.setIcon("sort-asc");
      menuItem.onClick(() => {
        sortColumn({
          field: field.name + field.table,
          fn: normalizedSortForType(field.type, false),
        });
      });
    });
    menu.addItem((menuItem) => {
      menuItem.setTitle(i18n.menu.sortDescending);
      menuItem.setIcon("sort-desc");
      menuItem.onClick(() => {
        sortColumn({
          field: field.name + field.table,
          fn: normalizedSortForType(field.type, true),
        });
      });
    });
  }
  menu.showAtPosition(position);
  return menu;
};
