import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { wrapQuotes } from "core/utils/strings";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { FrameEditorMode } from "shared/types/frameExec";
import { Visualization } from "../../../Visualization";
import { FrameNodeViewProps } from "../ViewNodes/FrameView";
import { createVisualizationRows } from "core/utils/visualization/visualizationUtils";

export const VisualizationNodeView = (
  props: FrameNodeViewProps & { source?: string }
) => {
  const rawMdbFrameId = props.state?.props?.value; // References MDBFrame ID
  const mdbFrameId = rawMdbFrameId
    ? rawMdbFrameId.replace(/^["']|["']$/g, "")
    : null; // Remove quotes if present
  const sourcePath = props.source || "";
  const { nodes, updateNode } = useContext(FramesEditorRootContext);
  const [isCreating, setIsCreating] = useState(false);

  const {
    selectionMode,
    select,
    selected: frameSelected,
    selection,
  } = useContext(FrameSelectionContext);
  const selected = selection?.includes(props.treeNode.node.id);

  const editable = useMemo(() => {
    if (selectionMode == FrameEditorMode.Read) return false;
    if (selectionMode == FrameEditorMode.Page) return true;
    if (selectionMode == FrameEditorMode.Group && selected) return true;
    if (props.treeNode.isRef) {
      if (props.treeNode.editorProps.linkedNode && frameSelected) return true;
      return false;
    }
    return true;
  }, [props.treeNode, selectionMode, frameSelected, selected]);

  // Log when selection mode changes
  useEffect(() => {}, [selectionMode, selected, editable]);

  // Create a new visualization MDBFrame
  const createNewVisualization = async () => {
    if (!props.superstate?.spaceManager || isCreating) return;

    setIsCreating(true);
    try {
      // Generate a unique ID for the new visualization
      const newVisId = `vis_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create the default visualization configuration
      const defaultConfig = {
        chartType: "bar",
        dataSource: "",
        xField: "category",
        yField: "value",
        title: "New Visualization",
        showTitle: true,
        showGrid: true,
        showXAxis: true,
        showYAxis: true,
        showLegend: false,
        showTooltip: true,
      };

      // Create the MDBFrame structure for the visualization
      const newVisualizationFrame = {
        schema: {
          id: newVisId,
          name: "vis",
          type: "vis",
        },
        cols: [
          { name: "name", schemaId: newVisId, type: "text" },
          { name: "props", schemaId: newVisId, type: "text" },
        ],
        rows: [
          {
            id: "main",
            name: defaultConfig.chartType,
            schemaId: newVisId,
            type: "vis",
            rank: "0",
            props: JSON.stringify(defaultConfig),
          },
        ],
      };

      // Save the new visualization frame
      await props.superstate.spaceManager.saveFrame(
        sourcePath,
        newVisualizationFrame
      );

      // Update the node's value to reference the new visualization
      if (updateNode && props.treeNode.node.id) {
        updateNode(props.treeNode.node, {
          props: {
            ...props.treeNode.node.props,
            value: wrapQuotes(newVisId),
          },
        });
      }
    } catch (error) {
    } finally {
      setIsCreating(false);
    }
  };

  const styles = { ...props.state?.styles?.theme, ...props.state?.styles };

  return (
    <div
      onClick={(e) => {
        if (selectionMode !== FrameEditorMode.Read && select) {
          select(props.treeNode.node.id, e.shiftKey || e.metaKey);
        }
      }}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        cursor: selectionMode !== FrameEditorMode.Read ? "pointer" : "default",
      }}
    >
      {/* Show visualization if mdbFrameId exists, otherwise show create button */}
      {mdbFrameId ? (
        <>
          <Visualization
            mdbFrameId={mdbFrameId}
            sourcePath={sourcePath}
            superstate={props.superstate}
            width={styles?.width || 400}
            height={styles?.height || 300}
            style={{
              width: "100%",
              height: "100%",
            }}
            showFormatter={selected}
            isSelected={selected}
            onConfigUpdate={async (newConfig) => {
              // Save updated configuration back to MDBFrame
              if (props.superstate?.spaceManager) {
                try {
                  const frame = await props.superstate.spaceManager.readFrame(
                    sourcePath,
                    mdbFrameId
                  );

                  if (frame) {
                    // Use the createVisualizationRows utility to properly format the rows
                    const updatedRows = createVisualizationRows(
                      newConfig,
                      mdbFrameId,
                      frame.rows
                    );
                    
                    frame.rows = updatedRows;

                    // Update schema.def.db if data source changed
                    if (frame.schema?.def) {
                      const currentDef = JSON.parse(frame.schema.def || "{}");
                      if (currentDef.db !== newConfig.data?.listId) {
                        frame.schema.def = JSON.stringify({
                          ...currentDef,
                          db: newConfig.data?.listId || "",
                        });
                      }
                    } else if (frame.schema) {
                      frame.schema.def = JSON.stringify({
                        db: newConfig.data?.listId || "",
                      });
                    }

                    // Ensure schema type is preserved as 'vis'
                    if (frame.schema && frame.schema.type !== "vis") {
                      frame.schema.type = "vis";
                    }

                    await props.superstate.spaceManager.saveFrame(
                      sourcePath,
                      frame
                    );
                  }
                } catch (error) {
                  console.error("Error saving visualization config:", error);
                }
              }
            }}
          />
        </>
      ) : editable ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "20px",
            height: "100%",
            backgroundColor: "var(--mk-ui-background-secondary)",
            border: "1px dashed var(--mk-ui-border)",
            borderRadius: "4px",
          }}
        >
          <div
            style={{
              color: "var(--mk-ui-text-secondary)",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            No visualization configured
          </div>
          <button
            onClick={createNewVisualization}
            disabled={isCreating}
            style={{
              background: isCreating
                ? "var(--mk-ui-background-variant)"
                : "var(--mk-color-blue)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "14px",
              cursor: isCreating ? "not-allowed" : "pointer",
              opacity: isCreating ? 0.6 : 1,
            }}
          >
            {isCreating ? "Creating..." : "Create Visualization"}
          </button>
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--mk-ui-background-secondary)",
            color: "var(--mk-ui-text-secondary)",
            fontSize: "14px",
          }}
        >
          No visualization configured
        </div>
      )}
    </div>
  );
};
