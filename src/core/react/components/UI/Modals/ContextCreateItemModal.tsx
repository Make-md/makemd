import { DataPropertyView } from "core/react/components/SpaceView/Contexts/DataTypeView/DataPropertyView";
import { CellEditMode } from "core/react/components/SpaceView/Contexts/TableView/TableView";
import {
  ContextEditorContext,
  ContextEditorProvider,
} from "core/react/context/ContextEditorContext";
import { FramesMDBProvider } from "core/react/context/FramesMDBContext";
import { PathProvider } from "core/react/context/PathContext";
import { SpaceProvider } from "core/react/context/SpaceContext";
import { Superstate } from "makemd-core";
import React, { useContext, useEffect, useRef, useState } from "react";
import { defaultContextSchemaID } from "shared/schemas/context";
import { PathPropertyName } from "shared/types/context";
import { DBRow } from "shared/types/mdb";

export interface ContextCreateItemModalProps {
  superstate: Superstate;
  path: string;
  contextSchema?: string;
  frameSchema?: string;
  hide?: () => void;
  rowIndex?: number; // -1 for new, >= 0 for existing
  initialData?: DBRow;
  onSave?: (data: DBRow, index: number) => Promise<void> | void;
}

export const openContextCreateItemModal = (
  superstate: Superstate,
  path: string,
  contextSchema?: string,
  frameSchema?: string,
  win?: Window,
  rowIndex: number = -1,
  initialData?: DBRow,
  onSave?: (data: DBRow, index: number) => Promise<void> | void
) => {
  const isEdit = rowIndex >= 0;
  const modalTitle = isEdit ? "Edit Item" : "Create New Item";

  superstate.ui.openModal(
    modalTitle,
    <ContextCreateItemModal
      superstate={superstate}
      path={path}
      contextSchema={contextSchema}
      frameSchema={frameSchema}
      rowIndex={rowIndex}
      initialData={initialData}
      onSave={onSave}
    />,
    win ?? window
  );
};

export const ContextCreateItemModal = (props: ContextCreateItemModalProps) => {
  return (
    <div className="mk-context-create-item-modal">
      <PathProvider
        superstate={props.superstate}
        path={props.path}
        readMode={false}
      >
        <SpaceProvider superstate={props.superstate}>
          <FramesMDBProvider
            superstate={props.superstate}
            contextSchema={props.contextSchema}
            schema={props.frameSchema}
          >
            <ContextEditorProvider superstate={props.superstate}>
              <ContextCreateItemContent
                superstate={props.superstate}
                hide={props.hide}
                rowIndex={props.rowIndex ?? -1}
                initialData={props.initialData}
                onSave={props.onSave}
              />
            </ContextEditorProvider>
          </FramesMDBProvider>
        </SpaceProvider>
      </PathProvider>
    </div>
  );
};

const ContextCreateItemContent = (props: {
  superstate: Superstate;
  hide?: () => void;
  rowIndex?: number;
  initialData?: DBRow;
  onSave?: (data: DBRow, index: number) => Promise<void> | void;
}) => {
  const { dbSchema, sortedColumns, cols, tableData, updateRow, data, source } =
    useContext(ContextEditorContext);

  const rowIndex = props.rowIndex ?? -1;
  const isEdit = rowIndex >= 0;

  const [newItem, setNewItem] = useState<DBRow>(() => {
    if (props.initialData) {
      return { ...props.initialData };
    }
    if (isEdit && data && data[rowIndex]) {
      return { ...data[rowIndex] };
    }
    return {};
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemTitle, setItemTitle] = useState<string>(() => {
    if (isEdit && props.initialData?.[PathPropertyName]) {
      return props.initialData[PathPropertyName] as string;
    }
    if (isEdit && data && data[rowIndex]?.[PathPropertyName]) {
      return data[rowIndex][PathPropertyName] as string;
    }
    return "";
  });
  const titleRef = useRef<HTMLDivElement>(null);

  // Keep contentEditable in sync with state
  useEffect(() => {
    if (titleRef.current && titleRef.current.textContent !== itemTitle) {
      titleRef.current.textContent = itemTitle;
    }
  }, [itemTitle]);

  const allColumns = (sortedColumns ?? []).filter(
    (f) =>
      f &&
      !(
        dbSchema?.id == defaultContextSchemaID &&
        !isEdit &&
        f.primary == "true"
      )
  );

  const handleFieldChange = (columnName: string, value: any) => {
    const updatedItem = {
      ...newItem,
      [columnName]: value,
    };

    setNewItem(updatedItem);

    // Clear error for this field
    if (errors[columnName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[columnName];
        return newErrors;
      });
    }

    // Auto-save in edit mode using existing context
    if (isEdit) {
      try {
        if (props.onSave) {
          props.onSave(updatedItem, rowIndex);
        } else {
          updateRow(updatedItem, rowIndex);
        }
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }
  };

  const validateItem = () => {
    const newErrors: Record<string, string> = {};

    // For default schema, validate title instead of File field
    if (
      dbSchema?.id === defaultContextSchemaID &&
      !isEdit &&
      !itemTitle.trim()
    ) {
      newErrors[PathPropertyName] = "Title is required";
    }

    allColumns.forEach((column) => {
      // Skip primary field validation for default schema when creating (handled by title)
      if (
        dbSchema?.id === defaultContextSchemaID &&
        !isEdit &&
        column.primary
      ) {
        return;
      }

      // Check required fields
      if (column.primary && !newItem[column.name]) {
        newErrors[column.name] = "This field is required";
      }

      // Check unique constraints
      if (column.unique && newItem[column.name]) {
        const isDuplicate = data?.some((row, index) => {
          // Skip the current row when editing
          if (isEdit && index === rowIndex) {
            return false;
          }
          return row[column.name] === newItem[column.name];
        });
        if (isDuplicate) {
          newErrors[column.name] = "This value must be unique";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateItem()) {
      return;
    }

    try {
      // Special handling for default schema (file creation)
      if (dbSchema?.id === defaultContextSchemaID) {
        if (!isEdit) {
          // Creating new file
          const itemName = itemTitle.trim();

          // Create the file
          await props.superstate.api.path.create(
            itemName, // name/path
            source, // space/context path
            "md", // type (markdown file)
            "" // content (empty initially)
          );

          // Add other properties to the created file
          const otherFields = { ...newItem };
          if (Object.keys(otherFields).length > 0) {
            for (const [key, value] of Object.entries(otherFields)) {
              if (value !== undefined && value !== "") {
                await props.superstate.api.path.setProperty(
                  itemName,
                  key,
                  value
                );
              }
            }
          }

          props.hide && props.hide();
          return;
        } else {
          // Editing existing file - handle title change
          const currentPath = props.initialData?.[PathPropertyName] as string;
          const newTitle = itemTitle.trim();

          if (currentPath && newTitle && currentPath !== newTitle) {
            // Rename the file if title changed
            await props.superstate.spaceManager.renamePath(
              currentPath,
              newTitle
            );
          }

          // Update other properties
          const updatedItem = { ...newItem, [PathPropertyName]: newTitle };

          if (props.onSave) {
            await props.onSave(updatedItem, rowIndex);
          } else {
            await updateRow(updatedItem, rowIndex);
          }

          props.hide && props.hide();
          return;
        }
      }

      // Default behavior for non-default schemas
      if (props.onSave) {
        await props.onSave(newItem, rowIndex);
      } else {
        await updateRow(newItem, rowIndex);
      }
      props.hide && props.hide();
    } catch (error) {
      console.error(`Failed to ${isEdit ? "update" : "create"} item:`, error);
    }
  };

  return (
    <div className="mk-layout-column mk-gap-8">
      <div className="mk-form-container">
        {/* Title input for default schema */}
        {dbSchema?.id === defaultContextSchemaID && (
          <div className="mk-form-field">
            <div className="mk-modal-title-container">
              <div
                ref={titleRef}
                className="mk-modal-title-input"
                contentEditable={true}
                onBlur={(e) => {
                  const newTitle = e.currentTarget.textContent || "";
                  if (newTitle !== itemTitle) {
                    setItemTitle(newTitle);
                    // Auto-save in edit mode
                    if (isEdit) {
                      handleFieldChange(PathPropertyName, newTitle);
                    }
                  }
                }}
                onInput={(e) => {
                  const newTitle = e.currentTarget.textContent || "";
                  setItemTitle(newTitle);
                  // Clear title error when user types
                  if (errors[PathPropertyName]) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors[PathPropertyName];
                      return newErrors;
                    });
                  }
                }}
                onPaste={(e) => {
                  // Prevent formatting on paste
                  e.preventDefault();
                  const text = e.clipboardData.getData("text/plain");
                  document.execCommand("insertText", false, text);
                }}
                onDrop={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!isEdit) {
                      handleSave();
                    }
                  }
                }}
                suppressContentEditableWarning={true}
                data-ph={isEdit ? "Edit title" : "Enter title for new item"}
              />
            </div>
            {errors[PathPropertyName] && (
              <span className="mk-field-error">{errors[PathPropertyName]}</span>
            )}
          </div>
        )}

        {allColumns.map((column, index) => {
          // Skip hidden columns unless they're required
          if (column.hidden && !column.primary) {
            return null;
          }

          // Special handling for File type in defaultContextSchemaID - show as text input
          const columnToRender =
            !isEdit &&
            dbSchema?.id === defaultContextSchemaID &&
            (column.type === "file" || column.type === "File")
              ? { ...column, type: "text", name: column.name } // Override to text type
              : column;

          return (
            <div key={column.name} className="mk-form-field">
              <DataPropertyView
                superstate={props.superstate}
                column={columnToRender}
                path={source || ""}
                contexts={[source || ""]}
                initialValue={newItem[column.name] ?? ""}
                updateValue={(value) => handleFieldChange(column.name, value)}
                updateFieldValue={(fieldValue, value) =>
                  handleFieldChange(column.name, value)
                }
                editMode={CellEditMode.EditModeAlways}
                compactMode={false}
              />

              {errors[column.name] && (
                <span className="mk-field-error">{errors[column.name]}</span>
              )}
            </div>
          );
        })}
      </div>

      {!isEdit && (
        <div className="mk-modal-actions">
          <button className="mk-button mk-button-primary" onClick={handleSave}>
            Create Item
          </button>
        </div>
      )}
    </div>
  );
};
