import {
  parseVisualizationData,
  updateVisualizationSchema,
} from "core/utils/visualization/visualizationUtils";
import { SelectOption, Superstate, i18n } from "makemd-core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SpaceProperty } from "shared/types/mdb";
import { MDBFrame } from "shared/types/mframe";
import { VisualizationConfig } from "shared/types/visualization";
import { mdbSchemaToFrameSchema } from "shared/utils/makemd/schema";
import { parseMDBStringValue } from "utils/properties";
import { defaultMenu, menuInput } from "../UI/Menus/menu/SelectionMenu";
import { showColorPickerMenu } from "../UI/Menus/properties/colorPickerMenu";
import { D3VisualizationEngine } from "./D3VisualizationEngine";
import { EditableLabel } from "./EditableLabel";

// Type for visualization data - more flexible than DBRows which requires strings
type VisualizationDataRow = Record<string, unknown>;

export interface VisualizationProps {
  mdbFrameId?: string;
  sourcePath?: string;
  superstate?: Superstate;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  showFormatter?: boolean;
  onConfigUpdate?: (config: VisualizationConfig) => void;
  isSelected?: boolean;
}

export const Visualization = ({
  mdbFrameId,
  sourcePath = "",
  superstate,
  width: initialWidth = 400,
  height: initialHeight = 300,
  className,
  style,
  showFormatter = false,
  onConfigUpdate,
  isSelected = false,
}: VisualizationProps) => {
  // Use default width if initialWidth is a string percentage
  const defaultWidth =
    typeof initialWidth === "string" && (initialWidth as string).includes("%")
      ? 600
      : (initialWidth as number);
  const defaultHeight =
    typeof initialHeight === "string" && (initialHeight as string).includes("%")
      ? 400
      : (initialHeight as number);

  const [bounds, setBounds] = useState({
    width: defaultWidth,
    height: defaultHeight,
  });
  const [configData, setConfigData] = useState<{
    visualizationConfig: VisualizationConfig;
    listId: string;
    availableFields: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [listData, setListData] = useState<VisualizationDataRow[]>([]);
  const [tableProperties, setTableProperties] = useState<SpaceProperty[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Formatter state
  const [showTitle, setShowTitle] = useState(false);
  const [showXAxis, setShowXAxis] = useState(true);
  const [showYAxis, setShowYAxis] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showXAxisLabel, setShowXAxisLabel] = useState(true);
  const [showYAxisLabel, setShowYAxisLabel] = useState(true);
  const [showDataLabels, setShowDataLabels] = useState(false);
  const [colorPaletteId, setColorPaletteId] = useState<string>("");
  const [availableTables, setAvailableTables] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedElement, setSelectedElement] = useState<{
    type:
      | "title"
      | "xAxis"
      | "yAxis"
      | "legend"
      | "series"
      | "grid"
      | "xAxisLabel"
      | "yAxisLabel";
    id?: string;
  } | null>(null);
  const [isEditable, setIsEditable] = useState(false);
  const [editingElement, setEditingElement] = useState<{
    type: string;
    id?: string;
    value: string;
    position: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const [editableElements, setEditableElements] = useState<
    Array<{ type: string; value: string; position: DOMRect; rotation?: number }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  // Load MDBFrame configuration
  const loadConfiguration = useCallback(async () => {
    if (!mdbFrameId || !superstate?.spaceManager) {
      setConfigData(null);
      setLoading(false);
      return;
    }

    // If sourcePath is empty, try to get it from the active path
    const effectiveSourcePath = sourcePath || superstate.ui?.activePath || "";

    if (!effectiveSourcePath) {
      setConfigData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Read MDBFrame via space manager
      const configMDBFrame: MDBFrame = await superstate.spaceManager.readFrame(
        effectiveSourcePath,
        mdbFrameId
      );

      if (!configMDBFrame) {
        throw new Error("No frame returned from readFrame");
      }

      if (!configMDBFrame.rows || configMDBFrame.rows.length === 0) {
        throw new Error("Frame has no rows");
      }

      // Convert schema to FrameSchema to access def.db
      const frameSchema = mdbSchemaToFrameSchema(configMDBFrame.schema);
      const dataSourceFromSchema = frameSchema?.def?.db || "";

      // Parse visualization data using utility function
      const { config, dataSource } = parseVisualizationData(configMDBFrame);

      // Get available fields from the frame rows
      const fields: string[] = [];
      if (configMDBFrame.rows) {
        const fieldsSet = new Set<string>();
        configMDBFrame.rows.forEach((row) => {
          if (row && typeof row === "object") {
            Object.keys(row).forEach((key) => {
              if (
                key !== "id" &&
                key !== "name" &&
                key !== "props" &&
                key !== "rank" &&
                key !== "type" &&
                key !== "schemaId"
              ) {
                fieldsSet.add(key);
              }
            });
          }
        });
        fields.push(...Array.from(fieldsSet));
      }

      setConfigData({
        visualizationConfig: config,
        listId: dataSource,
        availableFields: fields,
      });

      // Update formatter states based on loaded config

      // Set initial show states based on config
      setShowTitle(!!config.layout?.title?.text || !!config.layout?.title);
      setShowXAxis(config.layout?.xAxis?.show !== false);
      setShowYAxis(config.layout?.yAxis?.show !== false);

      // Show legend based on configuration, defaulting to true for certain chart types if not explicitly set
      const hasLegendConfig = config.layout?.legend !== undefined;
      const legendShowValue = config.layout?.legend?.show;
      
      if (hasLegendConfig && legendShowValue !== undefined) {
        // If legend.show is explicitly set, use that value
        setShowLegend(legendShowValue);
      } else {
        // Default behavior: show legend for charts that typically need one
        const shouldShowLegendByDefault =
          !!config.encoding?.color ||
          (Array.isArray(config.encoding?.y) && config.encoding.y.length > 1) ||
          config.chartType === "pie";
        setShowLegend(shouldShowLegendByDefault);
      }

      setShowXAxisLabel(!!config.layout?.xAxis?.label);
      setShowYAxisLabel(!!config.layout?.yAxis?.label);
      setShowDataLabels(config.mark?.dataLabels?.show === true);
      // @ts-ignore - colorPaletteId might not be in type
      setColorPaletteId((config as any).colorPaletteId || "");
    } catch (error) {
      // Don't use fallback - let the error surface
      setConfigData(null);
    } finally {
      setLoading(false);
    }
  }, [mdbFrameId, sourcePath, superstate]);

  // Function to load list data
  const loadListData = useCallback(async () => {
    // The listId should come from the visualizationConfig data property
    const listId =
      configData?.visualizationConfig?.data?.listId || configData?.listId;

    if (!listId || !superstate) {
      // Set sample data if no list is specified
      setListData([
        { category: "A", value: 10, x: 1, y: 10 },
        { category: "B", value: 20, x: 2, y: 20 },
        { category: "C", value: 15, x: 3, y: 15 },
        { category: "D", value: 25, x: 4, y: 25 },
        { category: "E", value: 30, x: 5, y: 30 },
      ]);
      return;
    }

    setLoadingData(true);
    try {
      let tableData: VisualizationDataRow[] | null = null;
      let tableFields: string[] = [];

      // Use the space manager to read the table
      if (superstate.spaceManager) {
        const spaceData = await superstate.spaceManager.readTable(
          sourcePath,
          listId
        );
        if (spaceData && spaceData.rows && Array.isArray(spaceData.rows)) {
          // Parse the data values using parseMDBStringValue
          tableData = spaceData.rows.map((row) => {
            const parsedRow: VisualizationDataRow = {};
            Object.entries(row).forEach(([key, value]) => {
              const column = spaceData.cols?.find((col) => col.name === key);
              if (column) {
                // Parse the value based on the column type
                parsedRow[key] = parseMDBStringValue(
                  column.type,
                  String(value)
                );
              } else {
                // Keep original value if no column info
                parsedRow[key] = value;
              }
            });
            return parsedRow;
          });
          tableFields = spaceData.cols?.map((c) => c.name) || [];
          // Store the table properties for axis label formatting
          if (spaceData.cols) {
            setTableProperties(spaceData.cols);
          }
        }
      }

      // If still not found, try pathsIndex
      if (!tableData) {
        const pathsIndex = superstate.pathsIndex;
        if (pathsIndex) {
          const listPath = pathsIndex.get(listId);
          if (listPath && listPath.metadata?.table) {
            tableData = listPath.metadata.table;
            // Extract fields from first row if available
            if (tableData.length > 0) {
              tableFields = Object.keys(tableData[0]);
            }
          }
        }
      }

      if (tableData && Array.isArray(tableData)) {
        setListData(tableData);

        // Update available fields
        if (tableFields.length > 0) {
          setConfigData((prev) =>
            prev
              ? {
                  ...prev,
                  availableFields: tableFields,
                }
              : null
          );
        }
        return;
      }

      // Set sample data if data cannot be loaded
      setListData([
        { category: "A", value: 10, x: 1, y: 10 },
        { category: "B", value: 20, x: 2, y: 20 },
        { category: "C", value: 15, x: 3, y: 15 },
        { category: "D", value: 25, x: 4, y: 25 },
        { category: "E", value: 30, x: 5, y: 30 },
      ]);
    } catch (error) {
      console.error("[Visualization] DEBUG: Error loading list data:", error);
      // Set sample data on error
      setListData([
        { category: "A", value: 10, x: 1, y: 10 },
        { category: "B", value: 20, x: 2, y: 20 },
        { category: "C", value: 15, x: 3, y: 15 },
      ]);
    } finally {
      setLoadingData(false);
    }
  }, [configData, sourcePath, superstate]);

  // Load available tables
  const loadAvailableTables = useCallback(async () => {
    if (!superstate || !superstate.spaceManager) return;

    try {
      // Get tables for the current space using the proper API
      const schemas = await superstate.spaceManager.tablesForSpace(sourcePath);

      if (schemas && Array.isArray(schemas)) {
        const tables = schemas
          .filter((schema) => schema?.id && schema?.name)
          .map((schema) => ({
            id: schema.id,
            name: schema.name,
          }));

        setAvailableTables(tables);
      } else {
        setAvailableTables([]);
      }
    } catch (error) {
      setAvailableTables([]);
    }
  }, [superstate, sourcePath]);

  // Handle configuration changes from formatter
  const handleConfigChange = (newConfig: VisualizationConfig) => {
    setConfigData((prev) =>
      prev
        ? {
            ...prev,
            visualizationConfig: newConfig,
          }
        : null
    );

    // Call parent update handler if provided
    if (onConfigUpdate) {
      setIsSaving(true);
      onConfigUpdate(newConfig);
      // Reset the saving flag after save completes
      setTimeout(() => setIsSaving(false), 1000);
    } else {
    }
  };

  // Handle table change from formatter
  const handleTableChange = async (tableId: string) => {
    // Update local state immediately for responsive UI
    setConfigData((prev) =>
      prev
        ? {
            ...prev,
            listId: tableId,
            visualizationConfig: {
              ...prev.visualizationConfig,
              data: { listId: tableId },
            },
          }
        : null
    );

    // Load the table columns for the selected data source
    if (tableId && superstate?.spaceManager) {
      try {
        const spaceData = await superstate.spaceManager.readTable(
          sourcePath || superstate.ui?.activePath || "",
          tableId
        );
        if (spaceData && spaceData.cols) {
          const tableFields = spaceData.cols.map((c) => c.name) || [];
          setConfigData((prev) =>
            prev
              ? {
                  ...prev,
                  availableFields: tableFields,
                }
              : null
          );
        }
      } catch (error) {
        console.error("Error loading table columns:", error);
      }
    } else {
      // Clear available fields when no table is selected
      setConfigData((prev) =>
        prev
          ? {
              ...prev,
              availableFields: [],
            }
          : null
      );
    }

    // Update the frame schema to store data source in def.db
    if (mdbFrameId && superstate && (sourcePath || superstate.ui?.activePath)) {
      await updateVisualizationSchema(
        superstate,
        sourcePath || superstate.ui.activePath,
        mdbFrameId,
        tableId
      );
    }

    // Use handleConfigChange to ensure proper persistence
    if (configData) {
      const updatedConfig = {
        ...configData.visualizationConfig,
        data: { listId: tableId },
      };

      // If onConfigUpdate is not provided, save directly
      if (!onConfigUpdate && superstate?.spaceManager && mdbFrameId) {
        try {
          const { createVisualizationRows } = await import(
            "core/utils/visualization/visualizationUtils"
          );
          const frame = await superstate.spaceManager.readFrame(
            sourcePath,
            mdbFrameId
          );

          if (frame) {
            // Use the createVisualizationRows utility to properly format the rows
            const updatedRows = createVisualizationRows(
              updatedConfig,
              mdbFrameId,
              frame.rows
            );

            frame.rows = updatedRows;

            // Schema def.db is already updated by updateVisualizationSchema above

            await superstate.spaceManager.saveFrame(sourcePath, frame);

            // Update local state to reflect the saved configuration
            // This ensures the UI updates immediately without waiting for the reload
            setConfigData((prev) =>
              prev
                ? {
                    ...prev,
                    visualizationConfig: updatedConfig,
                    listId: tableId,
                  }
                : null
            );

            // Manually dispatch the event to trigger reload
            superstate.eventsDispatcher.dispatchEvent("frameStateUpdated", {
              path: sourcePath,
              schemaId: mdbFrameId,
            });
          }
        } catch (error) {
          console.error("Error saving visualization config:", error);
        }
      } else {
        // Use the normal flow when onConfigUpdate is available
        handleConfigChange(updatedConfig);
      }
    }
  };

  // Callback to receive element positions from D3VisualizationEngine
  const onElementsRendered = useCallback(
    (
      elements: Array<{
        type: string;
        value: string;
        position: DOMRect;
        rotation?: number;
      }>
    ) => {
      if (isSelected) {
        setEditableElements(elements);
      }
    },
    [isSelected]
  );

  // Clear editable elements when node is deselected
  useEffect(() => {
    if (!isSelected) {
      setEditableElements([]);
      // Update show states when deselected
      if (configData) {
        // Title is always hidden
        // setShowTitle(!!configData.visualizationConfig.layout?.title?.text || !!configData.visualizationConfig.layout?.title);
        setShowXAxisLabel(
          !!configData.visualizationConfig.layout?.xAxis?.label
        );
        setShowYAxisLabel(
          !!configData.visualizationConfig.layout?.yAxis?.label
        );
      }
    } else {
      // In edit mode, maintain the same visibility as non-edit mode
      // Only show editable labels for elements that are actually configured to be visible
      if (configData) {
        // Title is always hidden
        // setShowTitle(!!configData.visualizationConfig.layout?.title?.text || !!configData.visualizationConfig.layout?.title);
        setShowXAxisLabel(
          !!configData.visualizationConfig.layout?.xAxis?.label ||
            (configData.visualizationConfig.encoding?.x &&
              !Array.isArray(configData.visualizationConfig.encoding.x))
        );
        setShowYAxisLabel(
          !!configData.visualizationConfig.layout?.yAxis?.label ||
            (configData.visualizationConfig.encoding?.y &&
              !Array.isArray(configData.visualizationConfig.encoding.y))
        );
      }
    }
  }, [isSelected]);

  const onElementSelect = (
    element: {
      type:
        | "title"
        | "xAxis"
        | "yAxis"
        | "legend"
        | "series"
        | "grid"
        | "xAxisLabel"
        | "yAxisLabel";
      id?: string;
    } | null
  ) => {
    setSelectedElement(element);

    // Set editable state when a visualization node is selected and the node itself is selected
    if (
      isSelected &&
      element &&
      ["title", "xAxisLabel", "yAxisLabel"].includes(element.type)
    ) {
      setIsEditable(true);
    } else {
      setIsEditable(false);
      setEditingElement(null);
    }

    // Show element-specific property menu when an element is selected
    if (
      element &&
      configData &&
      superstate &&
      !["title", "xAxisLabel", "yAxisLabel"].includes(element.type)
    ) {
      setTimeout(() => {
        showElementPropertiesMenu(element);
      }, 100);
    }
  };

  // Handle double-click on editable elements to start editing
  const onElementDoubleClick = (
    element: { type: string; id?: string },
    rect: DOMRect,
    currentValue: string
  ) => {
    if (
      isSelected &&
      ["title", "xAxisLabel", "yAxisLabel"].includes(element.type)
    ) {
      setEditingElement({
        type: element.type,
        id: element.id,
        value: currentValue,
        position: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
      });
    }
  };

  // Handle saving edited text
  const onEditComplete = (type: string, newValue: string) => {
    if (configData) {
      const updatedConfig = { ...configData.visualizationConfig };

      switch (type) {
        case "title":
          updatedConfig.layout = {
            ...updatedConfig.layout,
            title: {
              ...updatedConfig.layout.title,
              text: newValue,
            },
          };
          break;
        case "xAxisLabel":
          updatedConfig.layout = {
            ...updatedConfig.layout,
            xAxis: {
              ...updatedConfig.layout.xAxis,
              label: newValue,
            },
          };
          break;
        case "yAxisLabel":
          updatedConfig.layout = {
            ...updatedConfig.layout,
            yAxis: {
              ...updatedConfig.layout.yAxis,
              label: newValue,
            },
          };
          break;
      }

      handleConfigChange(updatedConfig);
    } else {
    }

    setEditingElement(null);
  };

  // Cancel editing
  const onEditCancel = () => {
    setEditingElement(null);
  };

  // Show properties menu for selected element
  const showElementPropertiesMenu = (element: {
    type: string;
    id?: string;
  }) => {
    if (!configData || !superstate) return;

    const rect = { x: 200, y: 200, width: 300, height: 100 };
    const menuOptions: SelectOption[] = [];

    switch (element.type) {
      case "title":
        // Title text
        menuOptions.push({
          name: "Edit Text",
          icon: "lucide//text",
          onClick: () => handleEditTitle(),
        });

        // Title alignment
        menuOptions.push({
          name: "Alignment",
          icon: "lucide//align-center",
          onClick: (e) => {
            const alignOptions: SelectOption[] = [
              {
                name: "Left",
                value: "left",
                onClick: () => {
                  const updatedConfig = {
                    ...configData.visualizationConfig,
                    layout: {
                      ...configData.visualizationConfig.layout,
                      title: {
                        ...configData.visualizationConfig.layout.title!,
                        align: "left" as const,
                      },
                    },
                  };
                  handleConfigChange(updatedConfig);
                },
              },
              {
                name: "Center",
                value: "center",
                onClick: () => {
                  const updatedConfig = {
                    ...configData.visualizationConfig,
                    layout: {
                      ...configData.visualizationConfig.layout,
                      title: {
                        ...configData.visualizationConfig.layout.title!,
                        align: "center" as const,
                      },
                    },
                  };
                  handleConfigChange(updatedConfig);
                },
              },
              {
                name: "Right",
                value: "right",
                onClick: () => {
                  const updatedConfig = {
                    ...configData.visualizationConfig,
                    layout: {
                      ...configData.visualizationConfig.layout,
                      title: {
                        ...configData.visualizationConfig.layout.title!,
                        align: "right" as const,
                      },
                    },
                  };
                  handleConfigChange(updatedConfig);
                },
              },
            ];

            const offset = (e.target as HTMLElement).getBoundingClientRect();
            superstate.ui.openMenu(
              offset,
              defaultMenu(superstate.ui, alignOptions),
              window
            );
          },
        });

        // Title font size
        {
          const currentFontSize =
            configData.visualizationConfig.layout.title?.fontSize || 16;
          menuOptions.push(
            menuInput(currentFontSize.toString(), (value) => {
              const fontSize = parseInt(value) || 16;
              const updatedConfig = {
                ...configData.visualizationConfig,
                layout: {
                  ...configData.visualizationConfig.layout,
                  title: {
                    ...configData.visualizationConfig.layout.title!,
                    fontSize,
                  },
                },
              };
              handleConfigChange(updatedConfig);
            })
          );
        }
        break;

      case "xAxis":
      case "yAxis": {
        const axisKey = element.type as "xAxis" | "yAxis";

        // Tick angle (for x-axis)
        if (axisKey === "xAxis") {
          const currentAngle =
            configData.visualizationConfig.layout[axisKey]?.tickAngle || 0;
          menuOptions.push(
            menuInput(currentAngle.toString(), (value) => {
              const tickAngle = parseInt(value) || 0;
              const updatedConfig = {
                ...configData.visualizationConfig,
                layout: {
                  ...configData.visualizationConfig.layout,
                  [axisKey]: {
                    ...configData.visualizationConfig.layout[axisKey],
                    tickAngle,
                  },
                },
              };
              handleConfigChange(updatedConfig);
            })
          );
        }

        // Tick color
        menuOptions.push({
          name: "Tick Color",
          icon: "lucide//palette",
          onClick: (e) => {
            const offset = (e.target as HTMLElement).getBoundingClientRect();
            showColorPickerMenu(
              superstate,
              offset,
              window,
              configData.visualizationConfig.layout[axisKey]?.tickColor ||
                "var(--mk-ui-text-primary)",
              (color: string) => {
                const updatedConfig = {
                  ...configData.visualizationConfig,
                  layout: {
                    ...configData.visualizationConfig.layout,
                    [axisKey]: {
                      ...configData.visualizationConfig.layout[axisKey],
                      tickColor: color,
                    },
                  },
                };
                handleConfigChange(updatedConfig);
              }
            );
          },
        });
        break;
      }

      case "xAxisLabel":
        menuOptions.push({
          name: "Edit Label",
          icon: "lucide//text",
          onClick: () => handleEditXLabel(),
        });
        break;

      case "yAxisLabel":
        menuOptions.push({
          name: "Edit Label",
          icon: "lucide//text",
          onClick: () => handleEditYLabel(),
        });
        break;

      case "legend":
        // Legend position
        menuOptions.push({
          name: "Position",
          icon: "lucide//move",
          onClick: (e) => {
            const positionOptions: SelectOption[] = [
              {
                name: "Top",
                value: "top",
                onClick: () => updateLegendPosition("top"),
              },
              {
                name: "Right",
                value: "right",
                onClick: () => updateLegendPosition("right"),
              },
              {
                name: "Bottom",
                value: "bottom",
                onClick: () => updateLegendPosition("bottom"),
              },
              {
                name: "Left",
                value: "left",
                onClick: () => updateLegendPosition("left"),
              },
            ];

            const offset = (e.target as HTMLElement).getBoundingClientRect();
            superstate.ui.openMenu(
              offset,
              defaultMenu(superstate.ui, positionOptions),
              window
            );
          },
        });
        break;

      case "grid": {
        // Grid color
        menuOptions.push({
          name: "Grid Color",
          icon: "lucide//palette",
          onClick: (e) => {
            const offset = (e.target as HTMLElement).getBoundingClientRect();
            showColorPickerMenu(
              superstate,
              offset,
              window,
              configData.visualizationConfig.layout.grid?.color ||
                "var(--mk-ui-border)",
              (color: string) => {
                const updatedConfig = {
                  ...configData.visualizationConfig,
                  layout: {
                    ...configData.visualizationConfig.layout,
                    grid: {
                      ...configData.visualizationConfig.layout.grid,
                      color,
                    },
                  },
                };
                handleConfigChange(updatedConfig);
              }
            );
          },
        });
        break;
      }
    }

    if (menuOptions.length > 0) {
      superstate.ui.openMenu(
        rect,
        defaultMenu(superstate.ui, menuOptions),
        window
      );
    }
  };

  const updateLegendPosition = (
    position: "top" | "right" | "bottom" | "left"
  ) => {
    if (!configData) return;
    const updatedConfig = {
      ...configData.visualizationConfig,
      layout: {
        ...configData.visualizationConfig.layout,
        legend: {
          ...configData.visualizationConfig.layout.legend,
          position,
        },
      },
    };
    handleConfigChange(updatedConfig);
  };

  // Edit handlers for visualization elements
  const handleEditTitle = () => {
    if (!configData || !superstate) return;

    const currentTitle =
      configData.visualizationConfig.layout.title?.text || "";
    const rect = { x: 100, y: 100, width: 200, height: 100 };

    const menuOptions: SelectOption[] = [
      menuInput(currentTitle, (value) => {
        const updatedConfig = {
          ...configData.visualizationConfig,
          layout: {
            ...configData.visualizationConfig.layout,
            title: {
              ...configData.visualizationConfig.layout.title,
              text: value,
            },
          },
        };
        handleConfigChange(updatedConfig);
      }),
    ];

    superstate.ui.openMenu(
      rect,
      defaultMenu(superstate.ui, menuOptions),
      window
    );
  };

  const handleEditXLabel = () => {
    if (!configData || !superstate) return;

    const currentLabel =
      configData.visualizationConfig.layout.xAxis?.label || "";
    const rect = { x: 100, y: 100, width: 200, height: 100 };

    const menuOptions: SelectOption[] = [
      menuInput(currentLabel, (value) => {
        const updatedConfig = {
          ...configData.visualizationConfig,
          layout: {
            ...configData.visualizationConfig.layout,
            xAxis: {
              ...configData.visualizationConfig.layout.xAxis,
              label: value,
            },
          },
        };
        handleConfigChange(updatedConfig);
      }),
    ];

    superstate.ui.openMenu(
      rect,
      defaultMenu(superstate.ui, menuOptions),
      window
    );
  };

  const handleEditYLabel = () => {
    if (!configData || !superstate) return;

    const currentLabel =
      configData.visualizationConfig.layout.yAxis?.label || "";
    const rect = { x: 100, y: 100, width: 200, height: 100 };

    const menuOptions: SelectOption[] = [
      menuInput(currentLabel, (value) => {
        const updatedConfig = {
          ...configData.visualizationConfig,
          layout: {
            ...configData.visualizationConfig.layout,
            yAxis: {
              ...configData.visualizationConfig.layout.yAxis,
              label: value,
            },
          },
        };
        handleConfigChange(updatedConfig);
      }),
    ];

    superstate.ui.openMenu(
      rect,
      defaultMenu(superstate.ui, menuOptions),
      window
    );
  };

  // Load configuration on mount and when dependencies change
  useEffect(() => {
    if (mdbFrameId && superstate) {
      loadConfiguration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mdbFrameId, sourcePath, superstate]);

  // Listen for frame state updates
  useEffect(() => {
    if (!superstate || !mdbFrameId) return;

    const handleFrameStateUpdate = (evt: {
      path: string;
      schemaId: string;
    }) => {
      // Check if this update is for our visualization frame
      const effectiveSourcePath = sourcePath || superstate.ui?.activePath || "";
      if (evt.path === effectiveSourcePath && evt.schemaId === mdbFrameId) {
        // Don't reload if we're in the middle of saving (we triggered this update)
        if (!isSaving) {
          loadConfiguration();
        } else {
        }
      }
    };

    superstate.eventsDispatcher.addListener(
      "frameStateUpdated",
      handleFrameStateUpdate
    );

    return () => {
      superstate.eventsDispatcher.removeListener(
        "frameStateUpdated",
        handleFrameStateUpdate
      );
    };
  }, [mdbFrameId, sourcePath, superstate, isSaving]);

  // Load data from the list when config changes
  useEffect(() => {
    if (configData) {
      loadListData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configData?.listId, configData?.visualizationConfig?.data?.listId]);

  // Load available tables when we have superstate and sourcePath
  useEffect(() => {
    if (superstate && (sourcePath || superstate.ui?.activePath)) {
      loadAvailableTables();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [superstate, sourcePath]);

  // Update bounds on resize
  useEffect(() => {
    if (!ref.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setBounds({ width, height });
      }
    });

    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        width: initialWidth,
        height: initialHeight,
        position: "relative",
        ...style,
      }}
    >
      {loading ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--mk-ui-text-secondary)",
            fontSize: "14px",
          }}
        >
          {(i18n.labels as any).visualization?.loadingVisualization ||
            "Loading visualization..."}
        </div>
      ) : !configData ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--mk-ui-text-error)",
            fontSize: "14px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <div>
            {(i18n.labels as any).visualization?.failedToLoad ||
              "Failed to load visualization"}
          </div>
          <div
            style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "var(--mk-ui-text-secondary)",
            }}
          >
            {(i18n.labels as any).visualization?.frameId || "Frame ID"}:{" "}
            {mdbFrameId || (i18n.labels as any).visualization?.none || "None"}
          </div>
          <div
            style={{ fontSize: "12px", color: "var(--mk-ui-text-secondary)" }}
          >
            {(i18n.labels as any).visualization?.path || "Path"}:{" "}
            {sourcePath || (i18n.labels as any).visualization?.none || "None"}
          </div>
        </div>
      ) : loadingData ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--mk-ui-text-secondary)",
            fontSize: "14px",
          }}
        >
          {(i18n.labels as any).visualization?.loadingData || "Loading data..."}
        </div>
      ) : configData &&
        listData.length > 0 &&
        (() => {
          // Check if we have all required fields
          const xField = Array.isArray(
            configData.visualizationConfig.encoding.x
          )
            ? configData.visualizationConfig.encoding.x[0]?.field
            : configData.visualizationConfig.encoding.x?.field;

          const yFields = Array.isArray(
            configData.visualizationConfig.encoding.y
          )
            ? configData.visualizationConfig.encoding.y
            : configData.visualizationConfig.encoding.y?.field
            ? [configData.visualizationConfig.encoding.y]
            : [];

          const hasDataSource = !!configData.listId;
          const hasXField = !!xField;
          const hasYField =
            yFields.length > 0 && yFields.some((y) => !!y.field);

          return hasDataSource && hasXField && hasYField;
        })() ? (
        <>
          <D3VisualizationEngine
            config={configData.visualizationConfig}
            data={listData}
            tableProperties={tableProperties}
            width={bounds.width}
            height={bounds.height}
            className="visualization-engine"
            superstate={superstate}
            showTitle={showTitle}
            showXAxis={showXAxis}
            showYAxis={showYAxis}
            showLegend={showLegend}
            showXAxisLabel={showXAxisLabel}
            showYAxisLabel={showYAxisLabel}
            editMode={isSelected}
            selectedElement={selectedElement}
            onElementSelect={onElementSelect}
            onElementDoubleClick={onElementDoubleClick}
            onElementsRendered={onElementsRendered}
            colorPaletteId={colorPaletteId}
            showDebug={false}
          />
          {isSelected &&
            editableElements.map((element, index) => (
              <EditableLabel
                key={`${element.type}-${index}`}
                initialValue={element.value}
                position={{
                  x: element.position.x,
                  y: element.position.y,
                  width: element.position.width,
                  height: element.position.height,
                }}
                rotation={element.rotation}
                type={element.type}
                onSave={(newValue) => onEditComplete(element.type, newValue)}
                onCancel={() => {}}
              />
            ))}
        </>
      ) : (
        <>
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              color: "var(--mk-ui-text-secondary)",
              fontSize: "14px",
              padding: "32px",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              {!configData
                ? (i18n.labels as any).visualization?.configurationNotLoaded ||
                  "Configuration not loaded"
                : (i18n.labels as any).visualization
                    ?.configureYourVisualization ||
                  "Configure your visualization"}
            </div>
            {configData && (
              <>
                {/* Show formatter for data source, x-axis, and y-axis selection */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    background: "var(--mk-ui-background)",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid var(--mk-ui-border)",
                    minWidth: "280px",
                  }}
                >
                  {/* Data Source Selector */}
                  <div
                    className="mk-editor-frame-node-button"
                    onClick={(e) => {
                      if (!superstate || !availableTables) return;

                      const menuOptions: SelectOption[] = [
                        {
                          name:
                            (i18n.labels as any).visualization?.none || "None",
                          value: "",
                          onClick: () => handleTableChange(""),
                        },
                        ...availableTables.map((table) => ({
                          name: table.name,
                          value: table.id,
                          onClick: () => handleTableChange(table.id),
                        })),
                      ];

                      const offset = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      superstate.ui.openMenu(
                        offset,
                        defaultMenu(superstate.ui, menuOptions),
                        window
                      );
                    }}
                    aria-label={i18n.settings.ariaLabels.dataSource}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          superstate?.ui?.getSticker("lucide//database") || "",
                      }}
                    />
                    <span>
                      {availableTables?.find((t) => t.id === configData.listId)
                        ?.name ||
                        (i18n.labels as any).visualization?.selectData ||
                        "Select Data"}
                    </span>
                  </div>

                  {/* Only show field selectors when data source is selected */}
                  {configData.listId && (
                    <>
                      {/* X Axis Selector */}
                      {(() => {
                        const xField = Array.isArray(
                          configData.visualizationConfig.encoding.x
                        )
                          ? configData.visualizationConfig.encoding.x[0]?.field
                          : configData.visualizationConfig.encoding.x?.field;

                        return (
                          <div
                            className="mk-editor-frame-node-button"
                            onClick={(e) => {
                              if (!superstate) return;

                              const menuOptions: SelectOption[] = [
                                {
                                  name: "None",
                                  value: "",
                                  onClick: () => {
                                    handleConfigChange({
                                      ...configData.visualizationConfig,
                                      encoding: {
                                        ...configData.visualizationConfig
                                          .encoding,
                                        x: {
                                          field: "",
                                          type: "nominal" as const,
                                        },
                                      },
                                    });
                                  },
                                },
                                ...configData.availableFields.map((col) => ({
                                  name: col,
                                  value: col,
                                  onClick: () => {
                                    handleConfigChange({
                                      ...configData.visualizationConfig,
                                      encoding: {
                                        ...configData.visualizationConfig
                                          .encoding,
                                        x: {
                                          field: col,
                                          type: "nominal" as const,
                                        },
                                      },
                                    });
                                  },
                                })),
                              ];

                              const offset = (
                                e.currentTarget as HTMLElement
                              ).getBoundingClientRect();
                              superstate.ui.openMenu(
                                offset,
                                defaultMenu(superstate.ui, menuOptions),
                                window
                              );
                            }}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html:
                                  superstate?.ui?.getSticker(
                                    "lucide//move-horizontal"
                                  ) || "",
                              }}
                            />
                            {!xField && <span>Select X Field</span>}
                            {xField && <span>{xField}</span>}
                          </div>
                        );
                      })()}

                      {/* Y Axis Selector */}
                      {(() => {
                        const yFields = Array.isArray(
                          configData.visualizationConfig.encoding.y
                        )
                          ? configData.visualizationConfig.encoding.y
                          : configData.visualizationConfig.encoding.y?.field
                          ? [configData.visualizationConfig.encoding.y]
                          : [];
                        const selectedValues = yFields
                          .map((y) => y.field)
                          .filter(Boolean);

                        return (
                          <div
                            className="mk-editor-frame-node-button"
                            onClick={(e) => {
                              if (!superstate) return;

                              const menuOptions: SelectOption[] =
                                configData.availableFields.map((col) => ({
                                  name: col,
                                  value: col,
                                }));

                              const offset = (
                                e.currentTarget as HTMLElement
                              ).getBoundingClientRect();

                              const menuProps = {
                                ...defaultMenu(superstate.ui, menuOptions),
                                multi: true,
                                editable: true,
                                value: selectedValues,
                                saveOptions: (
                                  options: string[],
                                  values: string[]
                                ) => {
                                  const newYFields = values.map((field) => ({
                                    field,
                                    type: "quantitative" as const,
                                  }));

                                  handleConfigChange({
                                    ...configData.visualizationConfig,
                                    encoding: {
                                      ...configData.visualizationConfig
                                        .encoding,
                                      y: newYFields,
                                    },
                                  });
                                },
                              };

                              superstate.ui.openMenu(offset, menuProps, window);
                            }}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html:
                                  superstate?.ui?.getSticker(
                                    "lucide//move-vertical"
                                  ) || "",
                              }}
                            />
                            {selectedValues.length === 0 && (
                              <span>Select Y Fields</span>
                            )}
                            {selectedValues.length > 0 && (
                              <span>
                                {selectedValues.length === 1
                                  ? selectedValues[0]
                                  : `${selectedValues.length} fields`}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
