import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  disclosureMenuItem,
  inputMenuItem,
  showSelectMenu
} from "components/ui/menus/menuItems";
import { initiateContextIfNotExists, insertContextItems } from "dispatch/mdb";
import { useCombinedRefs } from "hooks/useCombinedRef";
import i18n from "i18n";
import MakeMDPlugin from "main";
import { Menu, TFile, ToggleComponent } from "obsidian";
import React, { useContext, useEffect, useRef, useState } from "react";
import { fieldTypes } from "schemas/mdb";
import { MDBColumn } from "types/mdb";
import { loadTags, tagFromString } from "utils/contexts/contexts";
import {
  frontMatterForFile,
  frontMatterKeys,
  guestimateTypes,
  yamlTypeToMDBType
} from "utils/contexts/fm";
import { optionValuesForColumn } from "utils/contexts/mdb";
import { Filter } from "utils/contexts/predicate/filter";
import { normalizedSortForType, Sort } from "utils/contexts/predicate/sort";
import { getAbstractFileAtPath } from "utils/file";
import { uniq, uniqCaseInsensitive, uniqueNameFromString } from "utils/tree";
import { MDBContext } from "../MDBContext";

export const filePropTypes = [
  {
    name: i18n.properties.fileProperty.createdTime,
    value: "ctime",
  },
  {
    name: i18n.properties.fileProperty.modifiedTime,
    value: "mtime",
  },
  {
    name: i18n.properties.fileProperty.extension,
    value: "extension",
  },
  {
    name: i18n.properties.fileProperty.size,
    value: "size",
  },
  {
    name: i18n.properties.fileProperty.preview,
    value: "preview",
  },
  {
    name: i18n.properties.fileProperty.parentFolder,
    value: "folder",
  },
];
export const ColumnHeader = (props: {
  plugin: MakeMDPlugin;
  editable: boolean;
  column: MDBColumn;
  saveColumn: (column: MDBColumn, oldColumn?: MDBColumn) => boolean;
  deleteColumn: (column: MDBColumn) => void;
  hide?: (col: string) => void;
  isNew?: boolean;
  filter?: (filter: Filter) => void;
  sort?: (sort: Sort) => void;
}) => {
  const [field, setField] = useState(props.column);
  const [saveHook, setSaveHook] = useState(false);
  const menuRef = useRef(null);

  const { loadContextFields, tableData, contextTable, cols, newColumn } =
    useContext(MDBContext);

  useEffect(() => {
    setField(props.column);
  }, [props.column]);

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
  } = useDraggable({
    id: field.name + field.table,
    data: { name: field.name },
  });

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: field.name + field.table,
    data: { name: field.name },
  });
  useEffect(() => {
    if (saveHook) {
      if (field.name.length > 0) {
        if (
          field.name != props.column.name ||
          field.type != props.column.type ||
          field.value != props.column.value ||
          field.attrs != props.column.attrs
        ) {
          const saveResult = props.saveColumn(field, props.column);
          if (saveResult) {
            if (props.isNew) {
              setField(props.column);
              menuRef.current.hide();
            }
          }
        }
      }

      setSaveHook(false);
    }
  }, [saveHook]);

  useEffect(() => {
    if (menuRef.current) showMenu(props.editable);
  }, [field]);

  const saveMenu = (menu: Menu) => {
    setTimeout(() => {
      if (menuRef.current == menu) {
        menuRef.current.hide();
        menuRef.current = null;
      }
    }, 100);
    setSaveHook(true);
  };

  const saveContext = (options: string[], value: string[]) => {
    const newContext = tagFromString(value[0]);
    initiateContextIfNotExists(props.plugin, newContext)
      .then((f) => {
        if (f) {
          return insertContextItems(
            props.plugin,
            optionValuesForColumn(
              field.name,
              field.table == "" ? tableData : contextTable[field.table]
            ),
            newContext
          );
        }
      })
      .then((f) => loadContextFields(newContext));
    const newField = {
      ...field,
      value: newContext ?? "",
    };
    setField(newField);
    props.saveColumn(newField, props.column);
  };

  const saveField = (options: string[], value: string[]) => {
    const newField = {
      ...field,
      value: value[0] ?? "",
    };
    setField(newField);
    props.saveColumn(newField, props.column);
  };
  const showNewMenu = (e: React.MouseEvent) => {
    const offset = ref.current.getBoundingClientRect();

    const files = tableData.rows
      .map((f) => getAbstractFileAtPath(app, f.File))
      .filter((f) => f instanceof TFile);
    const types = guestimateTypes(
      files.map((f) => f.path),
      false
    );

    const fmFields = files
      .reduce((p, c) => {
        const fm = frontMatterForFile(c);
        const fmKeys = uniqCaseInsensitive(frontMatterKeys(fm));
        return uniq([...p, ...fmKeys]);
      }, [] as string[])
      .filter((f) => !cols.some((g) => g.name == f));
    const allTypes = [
      ...fmFields.map((f) => ({
        name: f,
        description: i18n.labels.syncFrontmatterProperty,
        value: "fm." + f + "." + yamlTypeToMDBType(types[f]),
      })),
      ...fieldTypes
        .filter((f) => f.restricted != true)
        .map((f) => ({
          name: f.label,
          description: i18n.labels.newProperty,
          value: "type." + f.type + "." + f.label,
        })),
    ];

    const saveOptions = (_: string[], values: string[]) => {
      const newValue = values[0];
      const newType = newValue.split(".");
      if (newType[0] == "fm") {
        newColumn({
          name: uniqueNameFromString(
            newType[1],
            tableData.cols.map((f) => f.name)
          ),
          schemaId: tableData.schema.id,
          table: "",
          type: newType[2],
        });
      } else if (newType[0] == "type") {
        newColumn({
          name: uniqueNameFromString(
            newType[2],
            tableData.cols.map((f) => f.name)
          ),
          schemaId: tableData.schema.id,
          table: "",
          type: newType[1],
        });
      }
    };
    showSelectMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        multi: false,
        editable: false,
        value: [],
        saveOptions: saveOptions,
        placeholder: i18n.labels.propertyItemSelectPlaceholder,
        searchable: true,
        options: allTypes,
        showAll: true,
      }
    );
  };
  const showMenu = (editable: boolean) => {
    if (menuRef.current) {
      menuRef.current.hide();
    }
    setSaveHook(false);
    const fieldType =
      fieldTypes.find(
        (f) => f.type == field.type || f.multiType == field.type
      ) ?? fieldTypes[0];
    const menu = new Menu();
    menu.setUseNativeMenu(false);
    menuRef.current = menu;
    if (editable) {
      menu.addItem((menuItem) => {
        inputMenuItem(menuItem, field?.name ?? "", (value) =>
          setField((f) => ({ ...f, name: value }))
        );
        menuItem.setIcon("type");
      });
      const getNewValueForType = (f: MDBColumn, value: string[]) => {
        if (value[0].startsWith("option")) {
          return optionValuesForColumn(
            f.name,
            f.table == "" ? tableData : contextTable[f.table]
          ).join(",");
        }
        return value[0] == fieldType.type || value[0] == fieldType.multiType
          ? f.value
          : null;
      };
      const selectOption = (options: string[], value: string[]) => {
        setField((f) => ({
          ...f,
          type: value[0] ?? "",
          value: getNewValueForType(f, value),
        }));
      };
      menu.addSeparator();
      menu.addItem((menuItem) => {
        disclosureMenuItem(
          menuItem,
          false,
          false,
          i18n.labels.propertyType,
          fieldType.label,
          fieldTypes
            .filter((f) => !f.restricted)
            .map((f, i) => ({
              id: i + 1,
              name: f.label,
              value: f.type,
              icon: "",
            })),
          selectOption
        );
      });
      if (fieldType.type == "context") {
        menu.addItem((menuItem) => {
          const f = loadTags(props.plugin);
          disclosureMenuItem(
            menuItem,
            false,
            true,
            i18n.labels.propertyContext,
            field.value ?? "",
            f.map((m) => ({ name: m, value: m })),
            saveContext
          );
        });
      }
      if (fieldType.type == "fileprop") {
        menu.addItem((menuItem) => {
          disclosureMenuItem(
            menuItem,
            false,
            false,
            i18n.labels.propertyFileProp,
            filePropTypes.find((f) => f.value == field.value)?.name ?? "",
            filePropTypes,
            saveField
          );
        });
      }
      if (fieldType.multi) {
        const docFrag = document.createDocumentFragment();
        const titleDiv = docFrag.createDiv("title");
        titleDiv.textContent = "Multiple";
        const div = docFrag.createDiv("toggle");
        const toggle = new ToggleComponent(div);
        toggle.setValue(field.type == fieldType.multiType);
        menu.addItem((menuItem) => {
          menuItem.setTitle(docFrag);
          menuItem.onClick(() => {
            toggle.setValue(field.type != fieldType.multiType);
            setField((f) => ({
              ...f,
              type:
                field.type == fieldType.multiType
                  ? fieldType.type
                  : fieldType.multiType,
            }));
          });
        });
      }
      if (!props.isNew) {
        menu.addSeparator();
        menu.addItem((menuItem) => {
          menuItem.setTitle(i18n.menu.hideProperty);
          menuItem.onClick(() => {
            props.hide(props.column.name + props.column.table);
          });
          menuItem.setIcon("eye-off");
        });
        menu.addItem((menuItem) => {
          menuItem.setTitle(i18n.menu.deleteProperty);
          menuItem.onClick(() => {
            props.deleteColumn(props.column);
          });
          menuItem.setIcon("trash-2");
        });
        menu.addSeparator();
      }
    }
    const sortableString = normalizedSortForType(props.column.type, false);
    if (!props.isNew && sortableString) {
      menu.addItem((menuItem) => {
        menuItem.setTitle(i18n.menu.sortAscending);
        menuItem.setIcon("sort-asc");
        menuItem.onClick(() => {
          props.sort({
            field: props.column.name + props.column.table,
            type: normalizedSortForType(props.column.type, false),
          });
        });
      });
      menu.addItem((menuItem) => {
        menuItem.setTitle(i18n.menu.sortAscending);
        menuItem.setIcon("sort-desc");
        menuItem.onClick(() => {
          props.sort({
            field: props.column.name + props.column.table,
            type: normalizedSortForType(props.column.type, true),
          });
        });
      });
    } else {
      menu.addSeparator();
      menu.addItem((menuItem) => {
        menuItem.setTitle(i18n.menu.saveProperty);
        menuItem.setIcon("checkmark");
        menuItem.onClick(() => {});
      });
    }
    menu.onHide(() => {
      saveMenu(menu);
    });
    const offset = ref.current.getBoundingClientRect();
    menu.showAtPosition({ x: offset.left, y: offset.top + 30 });
  };

  const toggleMenu = (e: React.MouseEvent) => {
    if (menuRef.current) {
      menuRef.current.hide();
      return;
    }
    if (props.isNew) {
      showNewMenu(e);
    } else {
      showMenu(props.editable);
    }
  };
  const ref = useRef(null);
  const setNodeRef = useCombinedRefs(setDroppableNodeRef, setDraggableNodeRef);
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="mk-col-header"
      onClick={(e) => {
        toggleMenu(e);
      }}
    >
      <div ref={ref}>
        {props.column.name.length > 0 ? field.name : "+"}
        <span
          className="mk-col-header-context"
          aria-label={props.column.table.length > 0 ? props.column.table : ""}
        >
          {props.column.table.length > 0 ? "#" : ""}
        </span>
      </div>
    </div>
  );
};
