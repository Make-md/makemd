import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { nameForField, stringIsConst } from "core/utils/frames/frames";
import { wrapQuotes } from "core/utils/strings";
import React, { useContext, useMemo } from "react";
import { stickerForField } from "schemas/mdb";
import { FrameEditorMode } from "shared/types/frameExec";
import { SpaceTableColumn } from "shared/types/mdb";
import { DataTypeView } from "../../Contexts/DataTypeView/DataTypeView";
import { CellEditMode } from "../../Contexts/TableView/TableView";
import { FrameNodeViewProps } from "../ViewNodes/FrameView";

export const DataNodeView = (props: FrameNodeViewProps) => {
  const {
    selectionMode,
    selection,
    selected: frameSelected,
  } = useContext(FrameSelectionContext);
  const { updateNode, nodes } = useContext(FramesEditorRootContext);
  const { linkedProps } = useContext(FrameInstanceContext);

  const updateValue = (newValue: string) => {
    if (newValue !== props.state.props?.value) {
      if (props.treeNode.editorProps?.linkedNode) {
        const node = nodes.find(
          (f) => f.id == props.treeNode.editorProps.linkedNode.node
        );
        updateNode(node, {
          props: {
            ...node.props,
            [props.treeNode.editorProps.linkedNode.prop]: wrapQuotes(newValue),
          },
        });
      } else {
        updateNode(props.treeNode.node, {
          props: { ...props.treeNode.node.props, value: wrapQuotes(newValue) },
        });
      }
    }
  };

  const selected = selection.includes(props.treeNode.id);

  const editable = useMemo(() => {
    if (selectionMode == FrameEditorMode.Read) return false;

    if (props.treeNode.isRef) {
      if (props.treeNode.editorProps.linkedNode && frameSelected) return true;
      return false;
    }
    if (
      linkedProps.some(
        (f) =>
          props.treeNode.editorProps.linkedNode?.node ==
            props.treeNode.node.schemaId &&
          props.treeNode.editorProps.linkedNode?.prop == f
      )
    )
      return true;
    if (!stringIsConst(props.treeNode.node.props.value)) return false;
    if (selectionMode == FrameEditorMode.Page) return true;
    if (selectionMode == FrameEditorMode.Group && selected) return true;
    return false;
  }, [props.treeNode, selectionMode, frameSelected, selected, linkedProps]);

  // Parse field configuration from props
  const fieldConfig = useMemo(() => {
    const field = props.state.props?.field;
    const value = props.state.props?.value || "";

    // Field can be either a column object or a string
    let column: SpaceTableColumn;

    if (typeof field === "object" && field !== null) {
      // If field is already an object, use it directly
      column = {
        name: field.name || "field",
        type: field.type || "text",
        value: field.value || "",
        ...field,
      };
    } else if (typeof field === "string") {
      try {
        // Try to parse as JSON if it's a string
        const parsedField = JSON.parse(field);
        column = {
          name: parsedField.name || "field",
          type: parsedField.type || "text",
          value: parsedField.value || "",
          ...parsedField,
        };
      } catch {
        // If not valid JSON, treat as a type string
        column = {
          name: "field",
          type: field || "text",
          value: "",
        };
      }
    } else {
      // Default to text type
      column = {
        name: "field",
        type: "text",
        value: "",
      };
    }

    return { column, value };
  }, [props.state.props]);

  const editMode = editable
    ? CellEditMode.EditModeView
    : CellEditMode.EditModeReadOnly;

  if (!props.state) return null;

  // Get style variables
  const showLabel =
    props.state.styles?.["--mk-label"] === "true" ||
    props.state.styles?.["--mk-label"] === true;
  const showSticker =
    props.state.styles?.["--mk-sticker"] === "true" ||
    props.state.styles?.["--mk-sticker"] === true;

  return (
    <div className="mk-frame-data">
      {showLabel && (
        <div className="mk-frame-data-label">
          {showSticker && (
            <span
              className="mk-icon-xsmall"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker(
                  stickerForField(fieldConfig.column)
                ),
              }}
            />
          )}
          <span>{nameForField(fieldConfig.column)}</span>
        </div>
      )}
      <div className="mk-frame-data-value">
        {showSticker && !showLabel && (
          <span
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker(
                stickerForField(fieldConfig.column)
              ),
            }}
          />
        )}
        <DataTypeView
          initialValue={fieldConfig.value}
          superstate={props.superstate}
          column={fieldConfig.column}
          editMode={editMode}
          updateValue={updateValue}
          compactMode={true}
          contextPath={
            props.superstate.spacesIndex.get(props.treeNode.node.parentId)?.path
          }
        />
      </div>
    </div>
  );
};
