import { useDraggable, useDroppable } from "@dnd-kit/core";
import { showNewPropertyMenu } from "core/react/components/UI/Menus/contexts/newSpacePropertyMenu";
import { showPropertyMenu } from "core/react/components/UI/Menus/contexts/spacePropertyMenu";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { useCombinedRefs } from "core/react/hooks/useCombinedRef";
import { optionValuesForColumn } from "core/utils/contexts/optionValuesForColumn";
import { nameForField } from "core/utils/frames/frames";
import { tagSpacePathFromTag } from "core/utils/strings";
import { Superstate } from "makemd-core";
import React, { useContext, useEffect, useRef, useState } from "react";
import { stickerForField } from "schemas/mdb";
import i18n from "shared/i18n";
import { PathPropertyName } from "shared/types/context";
import { SpaceTableColumn } from "shared/types/mdb";
import { windowFromDocument } from "shared/utils/dom";

export const filePropTypes = [
  {
    name: i18n.properties.fileProperty.name,
    value: "name",
  },
  {
    name: i18n.properties.fileProperty.createdTime,
    value: "ctime",
  },
  {
    name: i18n.properties.fileProperty.modifiedTime,
    value: "mtime",
  },
  {
    name: i18n.properties.fileProperty.sticker,
    value: "sticker",
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
    name: i18n.properties.fileProperty.parentFolder,
    value: "folder",
  },
  {
    name: i18n.properties.fileProperty.links,
    value: "inlinks",
  },
  {
    name: i18n.properties.fileProperty.tags,
    value: "tags",
  },
  {
    name: i18n.properties.fileProperty.spaces,
    value: "spaces",
  },
];
export const ColumnHeader = (props: {
  superstate: Superstate;
  editable: boolean;
  column: SpaceTableColumn;
  isNew?: boolean;
}) => {
  const [field, setField] = useState(props.column);
  const menuRef = useRef(null);
  const { spaceInfo, spaceState: spaceCache } = useContext(SpaceContext);

  const {
    predicate,
    tableData,
    contextTable,
    cols,
    newColumn,
    saveColumn,
    hideColumn,
    sortColumn,
    delColumn,
  } = useContext(ContextEditorContext);
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
  const saveField = (field: SpaceTableColumn) => {
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

  const showNewMenu = (e: React.MouseEvent) => {
    const offset = ref.current.getBoundingClientRect();

    showNewPropertyMenu(
      props.superstate,
      offset,
      windowFromDocument(e.view.document),
      {
        spaces: spaceCache?.contexts ?? [],
        fields: cols,
        saveField: (source, field) => {
          return newColumn({ ...field, table: source });
        },
        schemaId: tableData.schema.id,
        contextPath: spaceInfo.path,
      }
    );
  };

  const toggleMenu = (e: React.MouseEvent) => {
    if (props.isNew) {
      showNewMenu(e);
    } else {
      const offset = (e.target as HTMLElement).getBoundingClientRect();
      const options = optionValuesForColumn(
        field.name,
        field.table == ""
          ? tableData
          : contextTable[tagSpacePathFromTag(field.table)]
      );

      showPropertyMenu({
        superstate: props.superstate,
        rect: offset,
        win: windowFromDocument(e.view.document),
        editable: field.name != PathPropertyName,
        options,
        field,
        fields: cols,
        contextPath: spaceInfo.path,
        saveField,
        hide: hideColumn,
        deleteColumn: delColumn,
        sortColumn,
        hidden: predicate?.colsHidden.includes(field.name + field.table),
      });
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
        {props.column.name.length > 0 ? (
          <>
            <div
              className="mk-path-context-field-icon"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker(
                  stickerForField(props.column)
                ),
              }}
            ></div>
            <div className="mk-path-context-field-key">
              {nameForField(field)}
            </div>
          </>
        ) : (
          "+"
        )}
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
