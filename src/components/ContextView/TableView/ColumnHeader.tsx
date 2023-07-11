import { useDraggable, useDroppable } from "@dnd-kit/core";
import { showNewPropertyMenu } from "components/ui/menus/newPropertyMenu";
import { showPropertyMenu } from "components/ui/menus/propertyMenu";
import { initiateContextIfNotExists, insertContextItems } from "dispatch/mdb";
import { useCombinedRefs } from "hooks/useCombinedRef";
import i18n from "i18n";
import MakeMDPlugin from "main";
import React, { useContext, useEffect, useRef, useState } from "react";
import { MDBColumn } from "types/mdb";
import { connectContext, optionValuesForColumn } from "utils/contexts/mdb";
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
  // {
  //   name: i18n.properties.fileProperty.preview,
  //   value: "preview",
  // },
  {
    name: i18n.properties.fileProperty.parentFolder,
    value: "folder",
  },
  {
    name: "Links",
    value: "links",
  },
  {
    name: "Tags",
    value: "tags",
  },
  {
    name: "Spaces",
    value: "spaces",
  },
];
export const ColumnHeader = (props: {
  plugin: MakeMDPlugin;
  editable: boolean;
  column: MDBColumn;
  isNew?: boolean;
}) => {
  const [field, setField] = useState(props.column);
  const menuRef = useRef(null);
  const {
    loadContextFields,
    contextInfo,
    predicate,
    tableData,
    tagContexts,
    contextTable,
    cols,
    newColumn,
    saveColumn,
    hideColumn,
    sortColumn,
    delColumn,
  } = useContext(MDBContext);

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
  const saveField = (field: MDBColumn) => {
    if (field.name.length > 0) {
      if (
        field.name != props.column.name ||
        field.type != props.column.type ||
        field.value != props.column.value ||
        field.attrs != props.column.attrs
      ) {
        const saveResult = saveColumn(field, props.column);
        if (saveResult) {
          if (props.isNew) {
            setField(props.column);
          }
        }
      }
    }
  };

  const saveContext = (field: MDBColumn, value: string[]) => {
    const newContext = value[0];
    connectContext(props.plugin, value[0], contextInfo.dbPath);
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
    saveColumn(newField, props.column);
  };

  const showNewMenu = (e: React.MouseEvent) => {
    const offset = ref.current.getBoundingClientRect();
    showNewPropertyMenu(
      props.plugin,
      { x: offset.left, y: offset.top + 30 },
      tagContexts,
      cols,
      (source, field) => newColumn({ ...field, table: source }),
      tableData.schema.id,
      contextInfo.contextPath,
      false
    );
  };

  const toggleMenu = (e: React.MouseEvent) => {
    if (props.isNew) {
      showNewMenu(e);
    } else {
      const offset = (e.target as HTMLElement).getBoundingClientRect();
      const options = optionValuesForColumn(
        field.name,
        field.table == "" ? tableData : contextTable[field.table]
      );
      showPropertyMenu(
        props.plugin,
        { x: offset.left, y: offset.top + 30 },
        props.editable,
        options,
        field,
        cols,
        contextInfo.contextPath,
        saveField,
        saveContext,
        hideColumn,
        delColumn,
        sortColumn,
        predicate.colsHidden.includes(field.name + field.table)
      );
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
