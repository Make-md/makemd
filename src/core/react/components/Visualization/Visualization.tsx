import { useSpaceManager } from "core/react/context/SpaceManagerContext";
import {
  AggregationType,
  createVisualizationRows,
  parseVisualizationData,
  processDataAggregation,
  updateVisualizationSchema,
} from "core/utils/visualization/visualizationUtils";
import { SelectOption, SelectOptionType, Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SpaceProperty, SpaceTableSchema } from "shared/types/mdb";
import { MDBFrame } from "shared/types/mframe";
import {
  ChartType,
  MarkType,
  VisualizationConfig,
} from "shared/types/visualization";
import { mdbSchemaToFrameSchema } from "shared/utils/makemd/schema";
import { parseMultiString } from "utils/parsers";
import { parseMDBStringValue } from "utils/properties";
import { defaultMenu, menuInput } from "../UI/Menus/menu/SelectionMenu";
import { showColorPickerMenu } from "../UI/Menus/properties/colorPickerMenu";
import { D3VisualizationEngine } from "./D3VisualizationEngine";

import { VisualizationSetup } from "./VisualizationSetup";
import { VisualizationToolbar } from "./VisualizationToolbar";

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
  minMode?: boolean;
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
  minMode = false,
}: VisualizationProps) => {
  const spaceManager = useSpaceManager() || superstate.spaceManager;

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
  const [filterBarHeight, setFilterBarHeight] = useState(0);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [configData, setConfigData] = useState<{
    visualizationConfig: VisualizationConfig;
    listId: string;
    availableFields: string[];
    dataSourcePath?: string;
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
  const [availableTables, setAvailableTables] = useState<SpaceTableSchema[]>(
    []
  );
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
  const [isSaving, setIsSaving] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const loadingDataRef = useRef(false);

  // Helper function to determine field type for visualization encoding
  const getFieldEncodingType = (
    fieldName: string
  ): "temporal" | "quantitative" | "nominal" => {
    // Check if we have table properties to determine the field type
    const fieldProperty = tableProperties?.find(
      (col) => col.name === fieldName
    );
    if (fieldProperty) {
      const fieldType = fieldProperty.type?.toLowerCase();
      // Check for date/time types
      if (
        fieldType === "date" ||
        fieldType === "datetime" ||
        fieldType === "date-end"
      ) {
        return "temporal";
      }
      // Check for numeric types
      if (fieldType === "number" || fieldType === "currency") {
        return "quantitative";
      }
    }

    // If no property info, try to detect from data
    if (listData && listData.length > 0) {
      const sampleValue = listData[0][fieldName];
      if (sampleValue !== null && sampleValue !== undefined) {
        // Check if it's a date string or Date object
        const dateTest = new Date(sampleValue as string | number);
        if (
          !isNaN(dateTest.getTime()) &&
          typeof sampleValue === "string" &&
          (sampleValue.includes("-") || sampleValue.includes("/"))
        ) {
          return "temporal";
        }
        // Check if it's numeric
        if (typeof sampleValue === "number" || !isNaN(Number(sampleValue))) {
          return "quantitative";
        }
      }
    }

    // Default to nominal for categorical data
    return "nominal";
  };

  // Load MDBFrame configuration
  const loadConfiguration = useCallback(async () => {
    if (!mdbFrameId || !spaceManager) {
      setConfigData(null);
      setLoading(false);
      return;
    }

    if (!sourcePath) {
      setConfigData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Read MDBFrame via space manager
      const configMDBFrame: MDBFrame = await spaceManager.readFrame(
        sourcePath,
        mdbFrameId
      );

      if (!configMDBFrame) {
        throw new Error("No frame returned from readFrame");
      }

      if (!configMDBFrame.rows || configMDBFrame.rows.length === 0) {
        throw new Error(i18n.labels.frameHasNoRows);
      }

      // Convert schema to FrameSchema to access def.db
      const frameSchema = mdbSchemaToFrameSchema(configMDBFrame.schema);
      const dataSource = frameSchema?.def?.db || "";
      const dataSourcePath = frameSchema?.def?.context || sourcePath;
      // Parse visualization data using utility function
      const config = parseVisualizationData(configMDBFrame);

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
        dataSourcePath: dataSourcePath || sourcePath,
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
      setColorPaletteId(config.colorPalette || "");
    } catch (error) {
      // Don't use fallback - let the error surface
      setConfigData(null);
    } finally {
      setLoading(false);
    }
  }, [mdbFrameId, sourcePath, spaceManager]);

  // Function to load list data
  const loadListData = useCallback(
    async (overrideConfig?: typeof configData) => {
      // Prevent multiple simultaneous loads
      if (loadingDataRef.current) {
        return;
      }

      // Use override config if provided, otherwise use state
      const config = overrideConfig || configData;

      // The listId should come from config
      const listId = config?.listId;

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

      loadingDataRef.current = true;
      setLoadingData(true);
      try {
        let tableData: VisualizationDataRow[] | null = null;
        let tableFields: string[] = [];

        // Use the dataSourcePath, then fallback to sourcePath
        const tableSourcePath = config?.dataSourcePath || sourcePath || "";
        const tableId = listId;

        // Use the SpaceManager to read the table
        const spaceData = await spaceManager.readTable(
          tableSourcePath,
          tableId
        );
        if (spaceData && spaceData.rows && Array.isArray(spaceData.rows)) {
          // Process rows and expand multi-value fields
          const processedRows: VisualizationDataRow[] = [];

          spaceData.rows.forEach((row, rowIndex) => {
            if (rowIndex === 0) {
            }

            // Check if this row has any multi-value fields
            let hasMultiField = false;
            const multiFields: { [key: string]: string[] } = {};

            // First pass: identify multi-value fields
            Object.entries(row).forEach(([key, value]) => {
              const column = spaceData.cols?.find((col) => col.name === key);
              if (
                column &&
                (column.type?.endsWith("-multi") || column.type === "tags")
              ) {
                // Parse the multi-value string
                const valueStr = String(value || "");
                if (valueStr && valueStr !== "" && valueStr !== "[]") {
                  const parsedValues = parseMultiString(valueStr);
                  // Only mark as multi-field if we have actual values
                  if (
                    parsedValues &&
                    parsedValues.length > 0 &&
                    parsedValues.some((v) => v && v.trim() !== "")
                  ) {
                    hasMultiField = true;
                    multiFields[key] = parsedValues.filter(
                      (v) => v && v.trim() !== ""
                    );
                    if (rowIndex === 0) {
                    }
                  }
                }
              }
            });

            if (hasMultiField && Object.keys(multiFields).length > 0) {
              // Process multi-value fields - create a row for each combination
              // For visualization, we typically want to expand on ONE multi-field at a time
              // Let's find the first multi-field that's being used in the visualization
              const xField = Array.isArray(
                config?.visualizationConfig?.encoding?.x
              )
                ? config?.visualizationConfig?.encoding?.x?.[0]?.field
                : config?.visualizationConfig?.encoding?.x?.field;
              const yField = Array.isArray(
                config?.visualizationConfig?.encoding?.y
              )
                ? config?.visualizationConfig?.encoding?.y?.[0]?.field
                : config?.visualizationConfig?.encoding?.y?.field;

              // Determine which multi-field to expand on (prefer x-axis field, then y-axis field)
              let expandField: string = null;
              if (xField && multiFields[xField]) {
                expandField = xField;
              } else if (yField && multiFields[yField]) {
                expandField = yField;
              } else {
                // If neither axis uses a multi-field, use the first multi-field
                expandField = Object.keys(multiFields)[0];
              }

              if (rowIndex === 0) {
              }

              // Expand rows based on the selected multi-field
              if (expandField && multiFields[expandField]) {
                multiFields[expandField].forEach((multiValue) => {
                  const expandedRow: VisualizationDataRow = {};

                  Object.entries(row).forEach(([key, value]) => {
                    const column = spaceData.cols?.find(
                      (col) => col.name === key
                    );

                    if (key === expandField) {
                      // Use the expanded value for this field
                      expandedRow[key] = multiValue;
                    } else if (column) {
                      // Parse other fields normally
                      expandedRow[key] = parseMDBStringValue(
                        column.type,
                        String(value || "")
                      );
                    } else {
                      expandedRow[key] = value;
                    }
                  });

                  processedRows.push(expandedRow);
                });
              }
            } else {
              // No multi-value fields, process normally
              const parsedRow: VisualizationDataRow = {};
              Object.entries(row).forEach(([key, value]) => {
                const column = spaceData.cols?.find((col) => col.name === key);
                if (column) {
                  parsedRow[key] = parseMDBStringValue(
                    column.type,
                    String(value || "")
                  );
                } else {
                  parsedRow[key] = value;
                }
              });

              if (rowIndex === 0) {
              }

              processedRows.push(parsedRow);
            }
          });

          // Aggregate data if needed based on chart type and field types
          if (config?.visualizationConfig?.encoding) {
            const xField = Array.isArray(
              config?.visualizationConfig?.encoding?.x
            )
              ? config?.visualizationConfig?.encoding?.x?.[0]?.field
              : config?.visualizationConfig?.encoding?.x?.field;
            const yField = Array.isArray(
              config?.visualizationConfig?.encoding?.y
            )
              ? config?.visualizationConfig?.encoding?.y?.[0]?.field
              : config?.visualizationConfig?.encoding?.y?.field;
            const xType = Array.isArray(
              config?.visualizationConfig?.encoding?.x
            )
              ? config?.visualizationConfig?.encoding?.x?.[0]?.type
              : config?.visualizationConfig?.encoding?.x?.type;
            const yType = Array.isArray(
              config?.visualizationConfig?.encoding?.y
            )
              ? config?.visualizationConfig?.encoding?.y?.[0]?.type
              : config?.visualizationConfig?.encoding?.y?.type;

            // Transformers handle their own aggregation based on encoding.aggregate
            tableData = processedRows;
          } else {
            tableData = processedRows;
          }

          // Sort data by x-axis if it's temporal (date)
          if (
            tableData &&
            tableData.length > 0 &&
            config?.visualizationConfig?.encoding?.x
          ) {
            const xField = Array.isArray(
              config?.visualizationConfig?.encoding?.x
            )
              ? config?.visualizationConfig?.encoding?.x?.[0]?.field
              : config?.visualizationConfig?.encoding?.x?.field;
            const xType = Array.isArray(
              config?.visualizationConfig?.encoding?.x
            )
              ? config?.visualizationConfig?.encoding?.x?.[0]?.type
              : config?.visualizationConfig?.encoding?.x?.type;

            // Check if we should sort by date or option order
            let shouldSortByDate = false;
            let shouldSortByOption = false;
            let optionOrder: string[] = [];

            if (xField && xType === "temporal") {
              shouldSortByDate = true;
            } else if (xField && !xType) {
              // Auto-detect field type
              const xFieldColumn = spaceData.cols?.find(
                (col) => col.name === xField
              );
              const xFieldType = xFieldColumn?.type?.toLowerCase();

              if (
                xFieldType &&
                (xFieldType === "date" ||
                  xFieldType === "datetime" ||
                  xFieldType === "date-end")
              ) {
                shouldSortByDate = true;
              } else if (
                xFieldType === "option" ||
                xFieldType === "option-multi"
              ) {
                // For option fields, get the order from the field configuration
                shouldSortByOption = true;
                // Parse the options from the value field which contains the options configuration
                if (xFieldColumn?.value) {
                  try {
                    const optionsConfig = JSON.parse(xFieldColumn.value);
                    if (
                      optionsConfig &&
                      optionsConfig.options &&
                      Array.isArray(optionsConfig.options)
                    ) {
                      // Extract the order of option values
                      optionOrder = optionsConfig.options.map(
                        (opt: any) => opt.value || opt.name || opt
                      );
                    }
                  } catch (e) {
                    // If parsing fails, we'll fall back to alphabetical sorting
                    console.debug("Could not parse options configuration:", e);
                  }
                }
              } else if (tableData.length > 0) {
                // Check if the first value looks like a date
                const sampleValue = tableData[0][xField];
                if (sampleValue) {
                  const dateTest = new Date(sampleValue as string | number);
                  if (
                    !isNaN(dateTest.getTime()) &&
                    typeof sampleValue === "string" &&
                    (sampleValue.includes("-") || sampleValue.includes("/"))
                  ) {
                    shouldSortByDate = true;
                  }
                }
              }
            }

            if (shouldSortByDate) {
              // Enhanced date sorting with better date parsing
              tableData.sort((a, b) => {
                const valA = String(a[xField] || "");
                const valB = String(b[xField] || "");

                // Try multiple date parsing approaches
                let dateA = new Date(valA);
                let dateB = new Date(valB);

                // If direct parsing fails, try some common formats
                if (isNaN(dateA.getTime())) {
                  // Try parsing formats like "2023-12-01", "12/01/2023", etc.
                  const reformattedA = valA.replace(
                    /(\d{2})\/(\d{2})\/(\d{4})/,
                    "$3-$1-$2"
                  ); // MM/DD/YYYY -> YYYY-MM-DD
                  dateA = new Date(reformattedA);
                }

                if (isNaN(dateB.getTime())) {
                  const reformattedB = valB.replace(
                    /(\d{2})\/(\d{2})\/(\d{4})/,
                    "$3-$1-$2"
                  ); // MM/DD/YYYY -> YYYY-MM-DD
                  dateB = new Date(reformattedB);
                }

                // Handle invalid dates by putting them at the end
                if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
                if (isNaN(dateA.getTime())) return 1;
                if (isNaN(dateB.getTime())) return -1;

                return dateA.getTime() - dateB.getTime();
              });
            } else if (shouldSortByOption && optionOrder.length > 0) {
              // Sort by the defined option order
              tableData.sort((a, b) => {
                const valA = String(a[xField] || "");
                const valB = String(b[xField] || "");

                // Get the index of each value in the option order
                const indexA = optionOrder.indexOf(valA);
                const indexB = optionOrder.indexOf(valB);

                // If both values are in the option order, sort by their position
                if (indexA !== -1 && indexB !== -1) {
                  return indexA - indexB;
                }

                // If one value is not in the option order, put it at the end
                if (indexA === -1 && indexB !== -1) return 1;
                if (indexA !== -1 && indexB === -1) return -1;

                // If neither value is in the option order, sort alphabetically
                return valA.localeCompare(valB, undefined, {
                  numeric: true,
                  sensitivity: "base",
                });
              });
            } else if (
              xField &&
              config?.visualizationConfig?.chartType === "line"
            ) {
              // For line charts, always ensure some kind of logical ordering even for non-dates
              tableData.sort((a, b) => {
                const valA = String(a[xField] || "");
                const valB = String(b[xField] || "");

                // Try numeric sorting first
                const numA = parseFloat(valA);
                const numB = parseFloat(valB);

                if (!isNaN(numA) && !isNaN(numB)) {
                  return numA - numB;
                }

                // Fallback to string sorting with numeric comparison
                return valA.localeCompare(valB, undefined, {
                  numeric: true,
                  sensitivity: "base",
                });
              });
            }
          }

          tableFields = spaceData.cols?.map((c) => c.name) || [];
          // Store the table properties for axis label formatting
          if (spaceData.cols) {
            setTableProperties((prev) => {
              // Only update if actually different to prevent re-renders
              if (JSON.stringify(prev) !== JSON.stringify(spaceData.cols)) {
                return spaceData.cols;
              }
              return prev;
            });
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
        loadingDataRef.current = false;
        setLoadingData(false);
      }
    },
    [sourcePath, superstate, spaceManager]
  );

  // Load available tables
  const loadAvailableTables = useCallback(async () => {
    if (!superstate) return;

    try {
      // Use the dataSourcePath, then fallback to sourcePath
      const tablesSourcePath = configData?.dataSourcePath || sourcePath;

      // Get tables using the SpaceManager
      const schemas = await spaceManager.tablesForSpace(tablesSourcePath);

      if (schemas && Array.isArray(schemas)) {
        // Filter valid schemas and set directly (already SpaceTableSchema[])
        const validSchemas = schemas.filter(
          (schema) => schema?.id && schema?.name
        );
        setAvailableTables(validSchemas);
      } else {
        setAvailableTables([]);
      }
    } catch (error) {
      setAvailableTables([]);
    }
  }, [
    superstate,
    sourcePath,
    configData?.dataSourcePath,
    configData,
    spaceManager,
  ]);

  // Save schema (listId and dataSourcePath)
  const saveVisualizationSchema = async (
    listId?: string,
    dataSourcePath?: string
  ) => {
    // Update local state
    setConfigData((prev) => {
      if (!prev) return null;

      const updated = { ...prev };

      // Update listId if provided
      if (listId !== undefined) {
        updated.listId = listId;
      }

      // Update dataSourcePath if provided
      if (dataSourcePath !== undefined) {
        updated.dataSourcePath = dataSourcePath;
      }

      return updated;
    });

    // Update schema if we have the necessary context
    if (mdbFrameId && sourcePath && superstate?.spaceManager) {
      if (listId !== undefined || dataSourcePath !== undefined) {
        await updateVisualizationSchema(
          superstate,
          sourcePath,
          mdbFrameId,
          listId !== undefined ? listId : configData?.listId || "",
          dataSourcePath !== undefined
            ? dataSourcePath
            : configData?.dataSourcePath || sourcePath
        );
      }
    }
  };

  // Handle configuration changes from formatter
  const handleConfigChange = async (newConfig: VisualizationConfig) => {
    // Stage 1: Update local state immediately to trigger re-render
    setConfigData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        visualizationConfig: newConfig,
      };
    });

    // Stage 2: Save to persistent storage
    if (mdbFrameId && sourcePath && spaceManager) {
      try {
        setIsSaving(true);
        const frame = await spaceManager.readFrame(sourcePath, mdbFrameId);
        if (frame) {
          const updatedRows = createVisualizationRows(
            newConfig,
            mdbFrameId,
            frame.rows
          );
          frame.rows = updatedRows;
          await spaceManager.saveFrame(sourcePath, frame);
          superstate.eventsDispatcher.dispatchEvent("frameStateUpdated", {
            path: sourcePath,
            schemaId: mdbFrameId,
          });
        }
      } catch (error) {
        console.error("Error saving visualization config:", error);
      } finally {
        setIsSaving(false);
      }
    }

    // Stage 3: Reload data if needed for aggregations/transformations
    if (configData) {
      const updatedConfigData = {
        ...configData,
        visualizationConfig: newConfig,
      };
      await loadListData(updatedConfigData);
    }

    // Stage 4: Force color palette update
    if (
      newConfig.colorPalette !== configData?.visualizationConfig?.colorPalette
    ) {
      setColorPaletteId(newConfig.colorPalette || "");
    }

    // Call parent handler if provided
    if (onConfigUpdate) {
      onConfigUpdate(newConfig);
    }
  };

  // Handle table change from formatter
  const handleTableChange = async (tableId: string) => {
    // Load the table columns for the selected data source
    if (tableId && superstate) {
      try {
        const spaceData = await spaceManager.readTable(
          sourcePath || "",
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

    // Save the schema update
    await saveVisualizationSchema(tableId, undefined);
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
    ) => {},
    [isSelected]
  );

  // Clear editable elements when node is deselected
  useEffect(() => {
    if (!isSelected) {
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
          name: i18n.labels.alignment,
          value: configData.visualizationConfig.layout.title?.align || "center",
          icon: "lucide//align-center",
          type: SelectOptionType.Disclosure,
          onSubmenu: (offset, onHide) => {
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
                name: i18n.labels.center,
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

            return superstate.ui.openMenu(
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
            menuInput(
              currentFontSize.toString(),
              (value: string) => {
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
              },
              "Font Size"
            )
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
            menuInput(
              currentAngle.toString(),
              (value: string) => {
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
              },
              "Angle"
            )
          );
        }

        // Tick color
        menuOptions.push({
          name: "Tick Color",
          value: "Set",
          icon: "lucide//palette",
          type: SelectOptionType.Disclosure,
          onSubmenu: (offset, onHide) => {
            return showColorPickerMenu(
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
          name: i18n.labels.position,
          value:
            configData.visualizationConfig.layout.legend?.position || "right",
          icon: "lucide//move",
          type: SelectOptionType.Disclosure,
          onSubmenu: (offset, onHide) => {
            const positionOptions: SelectOption[] = [
              {
                name: i18n.labels.top,
                value: "top",
                onClick: () => updateLegendPosition("top"),
              },
              {
                name: "Right",
                value: "right",
                onClick: () => updateLegendPosition("right"),
              },
              {
                name: i18n.labels.bottom,
                value: "bottom",
                onClick: () => updateLegendPosition("bottom"),
              },
              {
                name: "Left",
                value: "left",
                onClick: () => updateLegendPosition("left"),
              },
            ];

            return superstate.ui.openMenu(
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
          value: "Set",
          icon: "lucide//palette",
          type: SelectOptionType.Disclosure,
          onSubmenu: (offset, onHide) => {
            return showColorPickerMenu(
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
      menuInput(
        currentTitle,
        (value: string) => {
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
        },
        "Title"
      ),
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
      menuInput(
        currentLabel,
        (value: string) => {
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
        },
        "X-Axis Label"
      ),
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
      menuInput(
        currentLabel,
        (value: string) => {
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
        },
        "Y-Axis Label"
      ),
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
      if (evt.path === sourcePath && evt.schemaId === mdbFrameId) {
        // Don't reload if we're in the middle of saving (we triggered this update)
        if (!isSaving) {
          loadConfiguration();
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
    if (configData && configData.listId) {
      loadListData(configData);
    }
    // Only reload when listId or dataSourcePath changes, not the entire configData
  }, [configData?.listId, configData?.dataSourcePath, loadListData]);

  // Listen for context updates and reload data when the data source is updated
  useEffect(() => {
    if (!superstate || !configData?.dataSourcePath) return;

    const handleContextUpdate = (payload: { path: string }) => {
      // Reload data if the updated context matches our data source
      if (payload.path === configData.dataSourcePath && configData.listId) {
        loadListData(configData);
      }
    };

    superstate.eventsDispatcher.addListener(
      'contextStateUpdated',
      handleContextUpdate
    );

    return () => {
      superstate.eventsDispatcher.removeListener(
        'contextStateUpdated',
        handleContextUpdate
      );
    };
  }, [superstate, configData?.dataSourcePath, configData?.listId, loadListData]);

  // Load available tables when we have superstate and sourcePath
  useEffect(() => {
    if (superstate && sourcePath) {
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

  // Measure filter bar height
  useEffect(() => {
    if (!filterBarRef.current) {
      setFilterBarHeight(0);
      return;
    }

    const measureFilterBar = () => {
      if (filterBarRef.current) {
        const rect = filterBarRef.current.getBoundingClientRect();
        setFilterBarHeight(rect.height);
      }
    };

    // Measure immediately
    measureFilterBar();

    // Also measure on resize in case content changes
    const resizeObserver = new ResizeObserver(measureFilterBar);
    resizeObserver.observe(filterBarRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [!minMode && configData]); // Remeasure when filter bar visibility changes

  return (
    <div
      ref={ref}
      className={className}
      style={{
        width: initialWidth,
        height: initialHeight,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        ...style,
      }}
    >
      {/* Visualization Toolbar */}
      {!minMode && configData && superstate && (
        <div ref={filterBarRef}>
          <VisualizationToolbar
            superstate={superstate}
            configData={configData.visualizationConfig}
            listId={configData.listId}
            fields={tableProperties}
            sourcePath={configData.dataSourcePath || sourcePath}
            availableTables={availableTables}
            onConfigChange={handleConfigChange}
            onDataSourceChange={handleTableChange}
            onSpaceChange={async (spacePath: string) => {
              // When changing space, clear the listId since lists are space-specific
              await saveVisualizationSchema("", spacePath);
              // Reload with new space
              await loadConfiguration();
            }}
            getFieldEncodingType={getFieldEncodingType}
            window={window}
          />
        </div>
      )}

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
          {i18n.labels.visualization?.loadingVisualization ||
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
            {i18n.labels.visualization?.failedToLoad ||
              "Failed to load visualization"}
          </div>
          <div
            style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "var(--mk-ui-text-secondary)",
            }}
          >
            {i18n.labels.visualization?.frameId || "Frame ID"}:{" "}
            {mdbFrameId || i18n.labels.visualization?.none || "None"}
          </div>
          <div
            style={{ fontSize: "12px", color: "var(--mk-ui-text-secondary)" }}
          >
            {i18n.labels.visualization?.path || i18n.menu.path}:{" "}
            {sourcePath || i18n.labels.visualization?.none || "None"}
          </div>
        </div>
      ) : loadingData && (!listData || listData.length === 0) ? (
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
          {i18n.labels.visualization?.loadingData || "Loading data..."}
        </div>
      ) : null}

      {/* Chart content area */}
      {(() => {
        // If configData exists and has visualizationConfig, check if we have all required fields
        if (configData && configData.visualizationConfig) {
          const xField = configData.visualizationConfig?.encoding?.x
            ? Array.isArray(configData.visualizationConfig.encoding.x)
              ? configData.visualizationConfig.encoding.x[0]?.field
              : configData.visualizationConfig.encoding.x?.field
            : undefined;

          const yFields = configData.visualizationConfig?.encoding?.y
            ? Array.isArray(configData.visualizationConfig.encoding.y)
              ? configData.visualizationConfig.encoding.y
              : configData.visualizationConfig.encoding.y?.field
              ? [configData.visualizationConfig.encoding.y]
              : []
            : [];

          const hasDataSource = !!configData.listId;
          const hasXField = !!xField;
          const hasYField =
            yFields.length > 0 && yFields.some((y) => !!y?.field);

          return hasDataSource && hasXField && hasYField;
        }
        return false;
      })() ? (
        <div
          className="visualization-engine"
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            pointerEvents: "auto",
          }}
        >
          <D3VisualizationEngine
            key={`${configData.visualizationConfig.chartType}-${
              configData.visualizationConfig.colorPalette
            }-${configData.visualizationConfig.encoding?.color?.field}-${
              configData.visualizationConfig.encoding?.color?.aggregate
            }-${
              Array.isArray(configData.visualizationConfig.encoding?.y)
                ? configData.visualizationConfig.encoding.y[0]?.aggregate
                : configData.visualizationConfig.encoding?.y?.aggregate
            }`}
            config={configData.visualizationConfig}
            data={listData}
            tableProperties={tableProperties}
            width={bounds.width}
            height={Math.max(200, bounds.height - filterBarHeight)}
            className="visualization-engine-inner"
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
            onElementsRendered={onElementsRendered}
            colorPaletteId={colorPaletteId}
            showDebug={false}
          />
        </div>
      ) : !loading ? (
        <VisualizationSetup
          superstate={superstate}
          mdbFrameId={mdbFrameId}
          sourcePath={sourcePath}
          fields={tableProperties}
          availableSchemas={availableTables}
          currentSpace={configData?.dataSourcePath || sourcePath}
          currentList={configData?.listId}
          currentXField={
            Array.isArray(configData?.visualizationConfig?.encoding?.x)
              ? configData?.visualizationConfig?.encoding?.x[0]?.field
              : configData?.visualizationConfig?.encoding?.x?.field
          }
          currentYField={
            Array.isArray(configData?.visualizationConfig?.encoding?.y)
              ? configData?.visualizationConfig?.encoding?.y[0]?.field
              : configData?.visualizationConfig?.encoding?.y?.field
          }
          onSaveSpace={async (spacePath: string) => {
            // When changing space, clear the listId since lists are space-specific
            await saveVisualizationSchema("", spacePath);
            // Reload available tables for the new space
            await loadAvailableTables();
          }}
          onSaveList={async (newListId: string) => {
            // Save the schema update
            await saveVisualizationSchema(newListId, undefined);
            // Create updated config with new listId
            const updatedConfig = configData
              ? {
                  ...configData,
                  listId: newListId,
                }
              : null;
            // Reload data with new list
            await loadListData(updatedConfig);
          }}
          onSaveXField={async (field: string) => {
            const fieldType = getFieldEncodingType(field);
            const newConfig = configData?.visualizationConfig
              ? {
                  ...configData.visualizationConfig,
                  encoding: {
                    ...configData.visualizationConfig.encoding,
                    x: { field, type: fieldType },
                  },
                }
              : ({
                  id: configData?.visualizationConfig?.id || "",
                  name:
                    configData?.visualizationConfig?.name || i18n.labels.visualization,
                  chartType: "bar" as ChartType,
                  mark: { type: "rect" as MarkType },
                  layout: {
                    width: 400,
                    height: 300,
                    padding: { top: 20, right: 20, bottom: 40, left: 40 },
                  },
                  encoding: {
                    x: { field, type: fieldType },
                    y: configData?.visualizationConfig?.encoding?.y || {
                      field: "",
                      type: "quantitative",
                    },
                  },
                } as VisualizationConfig);
            await handleConfigChange(newConfig);
          }}
          onSaveYField={async (field: string) => {
            const fieldType = getFieldEncodingType(field);
            const newConfig = configData?.visualizationConfig
              ? {
                  ...configData.visualizationConfig,
                  encoding: {
                    ...configData.visualizationConfig.encoding,
                    y: { field, type: fieldType },
                  },
                }
              : ({
                  id: configData?.visualizationConfig?.id || "",
                  name:
                    configData?.visualizationConfig?.name || i18n.labels.visualization,
                  chartType: "bar" as ChartType,
                  mark: { type: "rect" as MarkType },
                  layout: {
                    width: 400,
                    height: 300,
                    padding: { top: 20, right: 20, bottom: 40, left: 40 },
                  },
                  encoding: {
                    x: configData?.visualizationConfig?.encoding?.x || {
                      field: "",
                      type: "nominal",
                    },
                    y: { field, type: fieldType },
                  },
                } as VisualizationConfig);
            await handleConfigChange(newConfig);
          }}
        />
      ) : (
        <></>
      )}
    </div>
  );
};
