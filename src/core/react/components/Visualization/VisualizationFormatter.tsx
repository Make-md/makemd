import { Superstate, i18n } from "makemd-core";
import React, { useState, useEffect } from "react";
import { SelectOption } from "shared/types/menu";
import { VisualizationConfig } from "shared/types/visualization";
import { windowFromDocument } from "shared/utils/dom";
import { defaultMenu } from "../UI/Menus/menu/SelectionMenu";

export interface VisualizationFormatterProps {
  config: VisualizationConfig;
  data: Record<string, unknown>[];
  superstate?: Superstate;
  listId?: string;
  availableTables?: Array<{ id: string; name: string }>;
  onTableChange?: (tableId: string) => void;
  selectedTableColumns?: string[];
  showTitle: boolean;
  showXAxis: boolean;
  showYAxis: boolean;
  showLegend: boolean;
  showXAxisLabel: boolean;
  showYAxisLabel: boolean;
  showDataLabels: boolean;
  showXGridlines?: boolean;
  showYGridlines?: boolean;
  showXAxisLine?: boolean;
  showYAxisLine?: boolean;
  selectedElement?: {
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
  } | null;
  onConfigChange?: (config: VisualizationConfig) => void;
  onShowTitleChange?: (show: boolean) => void;
  onShowXAxisChange?: (show: boolean) => void;
  onShowYAxisChange?: (show: boolean) => void;
  onShowLegendChange?: (show: boolean) => void;
  onShowXAxisLabelChange?: (show: boolean) => void;
  onShowYAxisLabelChange?: (show: boolean) => void;
  onShowDataLabelsChange?: (show: boolean) => void;
  onShowXGridlinesChange?: (show: boolean) => void;
  onShowYGridlinesChange?: (show: boolean) => void;
  onShowXAxisLineChange?: (show: boolean) => void;
  onShowYAxisLineChange?: (show: boolean) => void;
  onElementSelect?: (element: { type: string; id?: string } | null) => void;
  onEditTitle?: () => void;
  onEditXLabel?: () => void;
  onEditYLabel?: () => void;
  resolveColor: (color: string) => string;
  colorPaletteId?: string;
  onColorPaletteChange?: (paletteId: string) => void;
  onViewChange?: (inSubmenu: boolean) => void;
}

type PanelView = "main" | "xAxis" | "yAxis" | "legend" | "color";

export const VisualizationFormatter: React.FC<VisualizationFormatterProps> = ({
  config,
  data,
  superstate,
  listId,
  availableTables,
  onTableChange,
  selectedTableColumns = [],
  showTitle,
  showXAxis,
  showYAxis,
  showLegend,
  showXAxisLabel,
  showYAxisLabel,
  showDataLabels,
  showXGridlines = false,
  showYGridlines = false,
  showXAxisLine = true,
  showYAxisLine = true,
  selectedElement,
  onConfigChange,
  onShowTitleChange,
  onShowXAxisChange,
  onShowYAxisChange,
  onShowLegendChange,
  onShowXAxisLabelChange,
  onShowYAxisLabelChange,
  onShowDataLabelsChange,
  onShowXGridlinesChange,
  onShowYGridlinesChange,
  onShowXAxisLineChange,
  onShowYAxisLineChange,
  onElementSelect,
  onEditTitle,
  onEditXLabel,
  onEditYLabel,
  resolveColor,
  colorPaletteId,
  onColorPaletteChange,
  onViewChange,
}) => {
  const [currentView, setCurrentView] = useState<PanelView>("main");

  // Notify parent when view changes
  useEffect(() => {
    onViewChange?.(currentView !== "main");
  }, [currentView, onViewChange]);

  // Chart type options
  const chartTypes = [
    { type: "bar" as const, name: (i18n.labels as any).visualization?.barChart || "Bar Chart", icon: "lucide//bar-chart" },
    { type: "line" as const, name: (i18n.labels as any).visualization?.lineChart || "Line Chart", icon: "lucide//activity" },
    {
      type: "scatter" as const,
      name: (i18n.labels as any).visualization?.scatterPlot || "Scatter Plot",
      icon: "lucide//scatter-chart",
    },
    { type: "pie" as const, name: (i18n.labels as any).visualization?.pieChart || "Pie Chart", icon: "lucide//pie-chart" },
    { type: "area" as const, name: (i18n.labels as any).visualization?.areaChart || "Area Chart", icon: "lucide//area-chart" },
    { type: "radar" as const, name: (i18n.labels as any).visualization?.radarChart || "Radar Chart", icon: "lucide//radar" },
  ];

  const handleChartTypeChange = (
    chartType: VisualizationConfig["chartType"]
  ) => {
    if (onConfigChange) {
      onConfigChange({
        ...config,
        chartType,
        mark: {
          ...config.mark,
          type:
            chartType === "line"
              ? "line"
              : chartType === "scatter"
              ? "circle"
              : chartType === "pie"
              ? "arc"
              : chartType === "area"
              ? "area"
              : chartType === "radar"
              ? "line"
              : "rect",
        },
      });
    }
  };

  const xField = Array.isArray(config.encoding.x)
    ? config.encoding.x[0]?.field
    : config.encoding.x?.field;
  const yFields = Array.isArray(config.encoding.y)
    ? config.encoding.y.map((y) => y.field).filter(Boolean)
    : config.encoding.y?.field
    ? [config.encoding.y.field]
    : [];
  const colorField = config.encoding.color?.field;
  const selectedTable = availableTables?.find((t) => t.id === listId);

  return (
    <>
      {currentView === "main" ? (
        <>
          {/* Data Source Selector */}
          <div
            className="mk-editor-frame-node-button"
            onClick={(e) => {
              if (!superstate || !availableTables) return;

              const menuOptions: SelectOption[] = [
                {
                  name: "None",
                  value: "",
                  onClick: () => onTableChange?.(""),
                },
                ...availableTables.map((table) => ({
                  name: table.name,
                  value: table.id,
                  onClick: () => onTableChange?.(table.id),
                })),
              ];

              const offset = (
                e.currentTarget as HTMLElement
              ).getBoundingClientRect();
              superstate.ui.openMenu(
                offset,
                defaultMenu(superstate.ui, menuOptions),
                windowFromDocument(e.view.document)
              );
            }}
            aria-label={i18n.settings.ariaLabels.dataSource}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: superstate?.ui?.getSticker("lucide//database") || "",
              }}
            />
            <span>{selectedTable?.name || (i18n.labels as any).visualization?.selectData || "Select Data"}</span>
          </div>

          {/* Chart Type Dropdown - only show if data source selected */}
          {selectedTable && (
            <div
            className="mk-editor-frame-node-button"
            onClick={(e) => {
              if (!superstate) return;

              const menuOptions: SelectOption[] = chartTypes.map((type) => ({
                name: type.name,
                icon: type.icon,
                value: type.type,
                onClick: () => handleChartTypeChange(type.type),
              }));

              const offset = (
                e.currentTarget as HTMLElement
              ).getBoundingClientRect();
              superstate.ui.openMenu(
                offset,
                defaultMenu(superstate.ui, menuOptions),
                windowFromDocument(e.view.document)
              );
            }}
            aria-label={i18n.settings.ariaLabels.chartType}
          >
            <div
              dangerouslySetInnerHTML={{
                __html:
                  superstate?.ui?.getSticker(
                    chartTypes.find((t) => t.type === config.chartType)?.icon ||
                      "lucide//bar-chart"
                  ) || "",
              }}
            />
            <span>
              {chartTypes.find((t) => t.type === config.chartType)?.name ||
                (i18n.labels as any).visualization?.selectChart || "Select Chart"}
            </span>
          </div>
          )}

          {/* Only show other controls if a data source is selected */}
          {selectedTable && (
            <>
              <div className="mk-divider" />

              {/* X Axis Button - Different meaning for pie/radar charts */}
              <div
            className="mk-editor-frame-node-button"
            onClick={() => setCurrentView("xAxis")}
            aria-label={
              config.chartType === "pie"
                ? "Category Configuration"
                : config.chartType === "radar"
                ? "Metrics Configuration"
                : "X Axis Configuration"
            }
          >
            <div
              dangerouslySetInnerHTML={{
                __html:
                  superstate?.ui?.getSticker(
                    config.chartType === "pie"
                      ? "lucide//tag" // Categories/slices
                      : config.chartType === "radar"
                      ? "lucide//radar" // Metrics/dimensions
                      : "lucide//move-horizontal"
                  ) || "",
              }}
            />
            {!xField && <span>Select</span>}
          </div>

          {/* Y Axis Button - Different icon for pie/radar charts */}
          <div
            className="mk-editor-frame-node-button"
            onClick={() => setCurrentView("yAxis")}
            aria-label={
              config.chartType === "pie" || config.chartType === "radar"
                ? "Value Configuration"
                : "Y Axis Configuration"
            }
          >
            <div
              dangerouslySetInnerHTML={{
                __html:
                  superstate?.ui?.getSticker(
                    config.chartType === "pie" || config.chartType === "radar"
                      ? "lucide//hash" // or "lucide//calculator" or "lucide//binary"
                      : "lucide//move-vertical"
                  ) || "",
              }}
            />
            {yFields.length === 0 && <span>Select</span>}
          </div>

          {/* Legend Button */}
          <div
            className="mk-editor-frame-node-button"
            onClick={() => setCurrentView("legend")}
            aria-label={i18n.settings.ariaLabels.legendConfiguration}
            dangerouslySetInnerHTML={{
              __html: superstate?.ui?.getSticker("lucide//list") || "",
            }}
          />

          <div className="mk-divider" />

          {/* Color Button - not for radar charts */}
          {config.chartType !== "radar" && (
            <div
              className="mk-editor-frame-node-button"
              onClick={() => setCurrentView("color")}
              aria-label={i18n.settings.ariaLabels.colorConfiguration}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: superstate?.ui?.getSticker("lucide//palette") || "",
                }}
              />
            </div>
          )}
            </>
          )}
        </>
      ) : (
        <>
          {/* Back Button */}
          <div
            className="mk-editor-frame-node-button"
            onClick={() => setCurrentView("main")}
            aria-label={i18n.settings.ariaLabels.close}
            dangerouslySetInnerHTML={{
              __html: superstate?.ui?.getSticker("ui//close") || "",
            }}
          />

          <div className="mk-divider" />

          {/* X-Axis Panel */}
          {currentView === "xAxis" && (
            <>
              {/* X Field Selector - First */}
              <div
                className="mk-editor-frame-node-button"
                onClick={(e) => {
                    if (!superstate) return;
                    
                    // If no table selected, show a message
                    if (!selectedTable || selectedTableColumns.length === 0) {
                      const menuOptions: SelectOption[] = [{
                        name: "Select a data source first",
                        value: "",
                        disabled: true,
                      }];
                      
                      const offset = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      superstate.ui.openMenu(
                        offset,
                        defaultMenu(superstate.ui, menuOptions),
                        windowFromDocument(e.view.document)
                      );
                      return;
                    }

                    const menuOptions: SelectOption[] = [
                      {
                        name: "None",
                        value: "",
                        onClick: () => {
                          if (onConfigChange) {
                            onConfigChange({
                              ...config,
                              encoding: {
                                ...config.encoding,
                                x: { field: "", type: "nominal" as const },
                              },
                            });
                          }
                        },
                      },
                      ...selectedTableColumns.map((col) => ({
                        name: col,
                        value: col,
                        onClick: () => {
                          if (onConfigChange) {
                            onConfigChange({
                              ...config,
                              encoding: {
                                ...config.encoding,
                                x: { field: col, type: "nominal" as const },
                              },
                            });
                          }
                        },
                      })),
                    ];

                    const offset = (
                      e.currentTarget as HTMLElement
                    ).getBoundingClientRect();
                    superstate.ui.openMenu(
                      offset,
                      defaultMenu(superstate.ui, menuOptions),
                      windowFromDocument(e.view.document)
                    );
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: superstate?.ui?.getSticker("lucide//type") || "",
                    }}
                  />
                  <span>
                    {xField ||
                      (config.chartType === "pie"
                        ? "Select Category"
                        : config.chartType === "radar"
                        ? "Select Metrics"
                        : "Select X Field")}
                  </span>
                </div>

              <div className="mk-divider" />

              {/* Show X Axis Toggle - not for radar charts */}
              {config.chartType !== "radar" && (
                <div
                  className={`mk-editor-frame-node-button ${
                    showXAxis ? "mk-active" : ""
                  }`}
                  onClick={() => onShowXAxisChange?.(!showXAxis)}
                  aria-label={i18n.settings.ariaLabels.toggleXAxis}
                  dangerouslySetInnerHTML={{
                    __html:
                      superstate?.ui?.getSticker("lucide//move-horizontal") ||
                      "",
                  }}
                />
              )}

              {/* Only show other options when axis is visible */}
              {showXAxis && config.chartType !== "radar" && (
                <>
                  <div className="mk-divider" />

                  {/* Show X Axis Label Toggle */}
                  <div
                    className={`mk-editor-frame-node-button ${
                      showXAxisLabel ? "mk-active" : ""
                    }`}
                    onClick={() => onShowXAxisLabelChange?.(!showXAxisLabel)}
                    aria-label={i18n.settings.ariaLabels.toggleXAxisLabel}
                    dangerouslySetInnerHTML={{
                      __html: superstate?.ui?.getSticker("lucide//tag") || "",
                    }}
                  />

                  {/* X Gridlines Toggle */}
                  <div
                    className={`mk-editor-frame-node-button ${
                      config.layout.grid?.x ? "mk-active" : ""
                    }`}
                    onClick={() => {
                      if (onConfigChange) {
                        const currentShowXGrid = config.layout.grid?.x || false;
                        onConfigChange({
                          ...config,
                          layout: {
                            ...config.layout,
                            grid: {
                              ...config.layout.grid,
                              x: !currentShowXGrid,
                              y: config.layout.grid?.y || false,
                              color: config.layout.grid?.color || 'var(--mk-ui-border)',
                              strokeDasharray: config.layout.grid?.strokeDasharray || '3,3',
                            },
                          },
                        });
                      }
                    }}
                    aria-label={i18n.settings.ariaLabels.toggleXGridlines}
                    dangerouslySetInnerHTML={{
                      __html: superstate?.ui?.getSticker("lucide//hash") || "",
                    }}
                  />

                  {/* X Axis Line Toggle */}
                  <div
                    className={`mk-editor-frame-node-button ${
                      config.layout.xAxis?.showLine === true ? "mk-active" : ""
                    }`}
                    onClick={() => {
                      if (onConfigChange) {
                        const currentShowLine = config.layout.xAxis?.showLine === true;
                        onConfigChange({
                          ...config,
                          layout: {
                            ...config.layout,
                            xAxis: {
                              ...config.layout.xAxis,
                              showLine: !currentShowLine,
                            },
                          },
                        });
                      }
                    }}
                    aria-label={i18n.settings.ariaLabels.toggleXAxisLine}
                    dangerouslySetInnerHTML={{
                      __html: superstate?.ui?.getSticker("lucide//move-horizontal") || "",
                    }}
                  />
                </>
              )}
            </>
          )}

          {/* Y-Axis Panel */}
          {currentView === "yAxis" && (
            <>
              {/* Y Field Selector - First */}
              <div
                className="mk-editor-frame-node-button"
                onClick={(e) => {
                    if (!superstate) return;
                    
                    // If no table selected, show a message
                    if (!selectedTable || selectedTableColumns.length === 0) {
                      const menuOptions: SelectOption[] = [{
                        name: "Select a data source first",
                        value: "",
                        disabled: true,
                      }];
                      
                      const offset = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      superstate.ui.openMenu(
                        offset,
                        defaultMenu(superstate.ui, menuOptions),
                        windowFromDocument(e.view.document)
                      );
                      return;
                    }

                    const currentYFields = Array.isArray(config.encoding.y)
                      ? config.encoding.y
                      : config.encoding.y?.field
                      ? [config.encoding.y]
                      : [];

                    const menuOptions: SelectOption[] =
                      selectedTableColumns.map((col) => ({
                        name: col,
                        value: col,
                      }));

                    // Get currently selected values
                    const selectedValues = currentYFields
                      .map((y) => y.field)
                      .filter(Boolean);

                    const offset = (
                      e.currentTarget as HTMLElement
                    ).getBoundingClientRect();

                    // Create a multi-select menu
                    const menuProps = {
                      ...defaultMenu(superstate.ui, menuOptions),
                      multi: true,
                      editable: true,
                      value: selectedValues,
                      saveOptions: (options: string[], values: string[], isNew?: boolean, section?: string) => {
                        if (onConfigChange) {
                          const newYFields = values.map((field) => ({
                            field,
                            type: "quantitative" as const,
                          }));

                          const newConfig = {
                            ...config,
                            encoding: {
                              ...config.encoding,
                              y: newYFields,
                            },
                          };
                          
                          onConfigChange(newConfig);
                        }
                      },
                    };

                    superstate.ui.openMenu(
                      offset,
                      menuProps,
                      windowFromDocument(e.view.document)
                    );
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: superstate?.ui?.getSticker("lucide//type") || "",
                    }}
                  />
                  <span>
                    {yFields.length > 0
                      ? yFields.length === 1
                        ? yFields[0]
                        : `${yFields.length} fields`
                      : config.chartType === "pie" ||
                        config.chartType === "radar"
                      ? "Select Values"
                      : "Select Y Fields"}
                  </span>
                </div>

              {/* Stacked Toggle - Only show for bar and area charts with multiple Y fields */}
              {(config.chartType === "bar" || config.chartType === "area") && 
               Array.isArray(config.encoding?.y) && config.encoding.y.length > 1 && (
                <>
                  <div className="mk-divider" />
                  <div
                    className={`mk-editor-frame-node-button ${
                      config.stacked ? "mk-active" : ""
                    }`}
                    onClick={() => {
                      if (onConfigChange) {
                        onConfigChange({
                          ...config,
                          stacked: !config.stacked,
                        });
                      }
                    }}
                    aria-label={i18n.settings.ariaLabels.toggleStackedMode}
                    dangerouslySetInnerHTML={{
                      __html: superstate?.ui?.getSticker("lucide//layers") || "",
                    }}
                  />
                </>
              )}

              <div className="mk-divider" />

              {/* Show Y Axis Toggle - not for radar charts */}
              {config.chartType !== "radar" && (
                <div
                  className={`mk-editor-frame-node-button ${
                    showYAxis ? "mk-active" : ""
                  }`}
                  onClick={() => onShowYAxisChange?.(!showYAxis)}
                  aria-label={i18n.settings.ariaLabels.toggleYAxis}
                  dangerouslySetInnerHTML={{
                    __html:
                      superstate?.ui?.getSticker("lucide//move-vertical") || "",
                  }}
                />
              )}

              {/* Only show other options when axis is visible */}
              {showYAxis && config.chartType !== "radar" && (
                <>
                  <div className="mk-divider" />

                  {/* Show Y Axis Label Toggle */}
                  <div
                    className={`mk-editor-frame-node-button ${
                      showYAxisLabel ? "mk-active" : ""
                    }`}
                    onClick={() => onShowYAxisLabelChange?.(!showYAxisLabel)}
                    aria-label={i18n.settings.ariaLabels.toggleYAxisLabel}
                    dangerouslySetInnerHTML={{
                      __html: superstate?.ui?.getSticker("lucide//tag") || "",
                    }}
                  />

                  {/* Show Data Labels Toggle */}
                  <div
                    className={`mk-editor-frame-node-button ${
                      showDataLabels ? "mk-active" : ""
                    }`}
                    onClick={() => onShowDataLabelsChange?.(!showDataLabels)}
                    aria-label={i18n.settings.ariaLabels.toggleDataLabels}
                    dangerouslySetInnerHTML={{
                      __html: superstate?.ui?.getSticker("lucide//binary") || "",
                    }}
                  />

                  {/* Y Gridlines Toggle */}
                <div
                  className={`mk-editor-frame-node-button ${
                    config.layout.grid?.y ? "mk-active" : ""
                  }`}
                  onClick={() => {
                    if (onConfigChange) {
                      const currentShowYGrid = config.layout.grid?.y || false;
                      onConfigChange({
                        ...config,
                        layout: {
                          ...config.layout,
                          grid: {
                            ...config.layout.grid,
                            y: !currentShowYGrid,
                            x: config.layout.grid?.x || false,
                            color: config.layout.grid?.color || 'var(--mk-ui-border)',
                            strokeDasharray: config.layout.grid?.strokeDasharray || '3,3',
                          },
                        },
                      });
                    }
                  }}
                  aria-label={i18n.settings.ariaLabels.toggleYGridlines}
                  dangerouslySetInnerHTML={{
                    __html: superstate?.ui?.getSticker("lucide//hash") || "",
                  }}
                />

                  {/* Y Axis Line Toggle */}
                <div
                  className={`mk-editor-frame-node-button ${
                    config.layout.yAxis?.showLine === true ? "mk-active" : ""
                  }`}
                  onClick={() => {
                    if (onConfigChange) {
                      const currentShowLine = config.layout.yAxis?.showLine === true;
                      onConfigChange({
                        ...config,
                        layout: {
                          ...config.layout,
                          yAxis: {
                            ...config.layout.yAxis,
                            showLine: !currentShowLine,
                          },
                        },
                      });
                    }
                  }}
                  aria-label={i18n.settings.ariaLabels.toggleYAxisLine}
                  dangerouslySetInnerHTML={{
                    __html: superstate?.ui?.getSticker("lucide//move-vertical") || "",
                  }}
                />

                </>
              )}

              {/* Data Labels Toggle - Always show for radar charts */}
              {config.chartType === "radar" && (
                <>
                  <div className="mk-divider" />
                  <div
                    className={`mk-editor-frame-node-button ${
                      showDataLabels ? "mk-active" : ""
                    }`}
                    onClick={() => onShowDataLabelsChange?.(!showDataLabels)}
                    aria-label={i18n.settings.ariaLabels.toggleDataLabels}
                    dangerouslySetInnerHTML={{
                      __html: superstate?.ui?.getSticker("lucide//binary") || "",
                    }}
                  />
                </>
              )}
            </>
          )}

          {/* Legend Panel */}
          {currentView === "legend" && (
            <>
              {/* Show Legend Toggle */}
              <div
                className={`mk-editor-frame-node-button ${
                  showLegend ? "mk-active" : ""
                }`}
                onClick={() => onShowLegendChange?.(!showLegend)}
                aria-label={i18n.settings.ariaLabels.toggleLegend}
                dangerouslySetInnerHTML={{
                  __html: superstate?.ui?.getSticker("lucide//list") || "",
                }}
              />

              {/* Legend Position Dropdown */}
              <div
                className="mk-editor-frame-node-button"
                onClick={(e) => {
                  if (!superstate) return;

                  const currentPosition = config.layout?.legend?.position || 'right';
                  const positions = ['top', 'right', 'bottom', 'left'] as const;
                  
                  const menuOptions: SelectOption[] = positions.map((position) => ({
                    name: position.charAt(0).toUpperCase() + position.slice(1),
                    value: position,
                    onClick: () => {
                      if (onConfigChange) {
                        onConfigChange({
                          ...config,
                          layout: {
                            ...config.layout,
                            legend: {
                              ...config.layout?.legend,
                              position,
                            },
                          },
                        });
                      }
                    },
                  }));

                  const offset = (
                    e.currentTarget as HTMLElement
                  ).getBoundingClientRect();
                  superstate.ui.openMenu(
                    offset,
                    defaultMenu(superstate.ui, menuOptions),
                    windowFromDocument(e.view.document)
                  );
                }}
                aria-label={i18n.settings.ariaLabels.legendPosition}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: superstate?.ui?.getSticker("lucide//move") || "",
                  }}
                />
                <span>
                  {config.layout?.legend?.position 
                    ? config.layout.legend.position.charAt(0).toUpperCase() + config.layout.legend.position.slice(1)
                    : "Right"}
                </span>
              </div>

              {/* Legend Alignment Dropdown */}
              <div
                className="mk-editor-frame-node-button"
                onClick={(e) => {
                  if (!superstate) return;

                  const currentAlignment = config.layout?.legend?.align || 'start';
                  const alignments = ['start', 'center', 'end'] as const;
                  
                  const menuOptions: SelectOption[] = alignments.map((align) => ({
                    name: align.charAt(0).toUpperCase() + align.slice(1),
                    value: align,
                    onClick: () => {
                      if (onConfigChange) {
                        onConfigChange({
                          ...config,
                          layout: {
                            ...config.layout,
                            legend: {
                              ...config.layout?.legend,
                              align,
                            },
                          },
                        });
                      }
                    },
                  }));

                  const offset = (
                    e.currentTarget as HTMLElement
                  ).getBoundingClientRect();
                  superstate.ui.openMenu(
                    offset,
                    defaultMenu(superstate.ui, menuOptions),
                    windowFromDocument(e.view.document)
                  );
                }}
                aria-label={i18n.settings.ariaLabels.legendAlignment}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: superstate?.ui?.getSticker("lucide//align-center") || "",
                  }}
                />
                <span>
                  {config.layout?.legend?.align 
                    ? config.layout.legend.align.charAt(0).toUpperCase() + config.layout.legend.align.slice(1)
                    : "Start"}
                </span>
              </div>
            </>
          )}

          {/* Color Panel */}
          {currentView === "color" && (
            <>
              {/* Color Palette Selector */}
              <div
                className="mk-editor-frame-node-button"
                onClick={(e) => {
                  if (!superstate) return;

                  // Get palettes from AssetManager with fallback
                  let palettes: any[] = [];
                  
                  if (superstate.assets && typeof superstate.assets.getColorPalettes === 'function') {
                    palettes = superstate.assets.getColorPalettes() || [];
                  }
                  
                  // If no palettes from AssetManager, try fallback to localStorage for backwards compatibility
                  if (palettes.length === 0) {
                    const storedPalettes = localStorage.getItem("mk-color-palettes");
                    if (storedPalettes) {
                      try {
                        palettes = JSON.parse(storedPalettes) || [];
                      } catch (e) {
                        console.warn('Failed to parse stored palettes:', e);
                      }
                    }
                  }
                  
                  const menuOptions: SelectOption[] = [
                    {
                      name: "Default",
                      value: "",
                      onClick: () => onColorPaletteChange?.(""),
                    },
                    ...palettes.map((palette: any) => ({
                      name: palette.name,
                      value: palette.id,
                      onClick: () => onColorPaletteChange?.(palette.id),
                    })),
                  ];

                  const offset = (
                    e.currentTarget as HTMLElement
                  ).getBoundingClientRect();
                  superstate.ui.openMenu(
                    offset,
                    defaultMenu(superstate.ui, menuOptions),
                    windowFromDocument(e.view.document)
                  );
                }}
              >
                <div className="mk-visualization-formatter-palette-preview">
                  {(() => {
                    // Get palettes from AssetManager
                    const palettes = superstate?.assets?.getColorPalettes() || [];
                    const currentPalette =
                      colorPaletteId &&
                      palettes.find((p: any) => p.id === colorPaletteId);
                    const colors = currentPalette
                      ? currentPalette.colors.map((c: any) => resolveColor(c.value))
                      : ["#FFB6C1", "#FFD700", "#98FB98", "#87CEEB", "#DDA0DD"];

                    return (
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {colors
                          .slice(0, 5)
                          .map((color: string, i: number) => (
                            <div
                              key={i}
                              className="mk-visualization-formatter-palette-circle"
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: color,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                                marginLeft: i > 0 ? '-6px' : '0',
                                zIndex: colors.length - i,
                                position: 'relative'
                              }}
                            />
                          ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="mk-divider" />

              {/* Line Smoothing Toggle - for line and area charts */}
              {(config.chartType === "line" || config.chartType === "area") && (
                <div
                  className={`mk-editor-frame-node-button ${
                    config.mark?.interpolate === "monotone" ? "mk-active" : ""
                  }`}
                  onClick={() => {
                    if (onConfigChange) {
                      // Initialize mark object if it doesn't exist, and set default if interpolate is undefined
                      const currentInterpolate = config.mark?.interpolate || "linear"; // Default to linear
                      const newInterpolate = currentInterpolate === "monotone" ? "linear" : "monotone";
                      
                      onConfigChange({
                        ...config,
                        mark: {
                          ...config.mark,
                          interpolate: newInterpolate
                        }
                      });
                    }
                  }}
                  aria-label={i18n.settings.ariaLabels.toggleLineSmoothing}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: superstate?.ui?.getSticker("lucide//activity") || "",
                    }}
                  />
                  <span>{(config.mark?.interpolate || "linear") === "linear" ? "Straight" : "Smooth"}</span>
                </div>
              )}

              {/* Stroke Visibility Toggle - for area and radar charts only (line charts always have stroke) */}
              {(config.chartType === "area" || config.chartType === "radar") && (
                <div
                  className={`mk-editor-frame-node-button ${
                    config.mark?.strokeWidth && config.mark.strokeWidth > 0 ? "mk-active" : ""
                  }`}
                  onClick={() => {
                    if (onConfigChange) {
                      const currentStrokeWidth = config.mark?.strokeWidth || 0;
                      onConfigChange({
                        ...config,
                        mark: {
                          ...config.mark,
                          strokeWidth: currentStrokeWidth > 0 ? 0 : 1,
                          stroke: currentStrokeWidth > 0 ? undefined : "var(--mk-ui-border)"
                        }
                      });
                    }
                  }}
                  aria-label={i18n.settings.ariaLabels.toggleStroke}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: superstate?.ui?.getSticker("lucide//square") || "",
                    }}
                  />
                  <span>Stroke</span>
                </div>
              )}

              {/* Data Points Visibility Toggle - for line and area charts */}
              {(config.chartType === "line" || config.chartType === "area") && (
                <div
                  className={`mk-editor-frame-node-button ${
                    config.mark?.point?.show ? "mk-active" : ""
                  }`}
                  onClick={() => {
                    if (onConfigChange) {
                      onConfigChange({
                        ...config,
                        mark: {
                          ...config.mark,
                          point: {
                            ...config.mark?.point,
                            show: !config.mark?.point?.show,
                            size: config.mark?.point?.size || 4
                          }
                        }
                      });
                    }
                  }}
                  aria-label={i18n.settings.ariaLabels.toggleDataPoints}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: superstate?.ui?.getSticker("lucide//circle") || "",
                    }}
                  />
                  <span>Points</span>
                </div>
              )}

              {/* Donut/Pie Toggle - for pie charts */}
              {config.chartType === "pie" && (
                <div
                  className={`mk-editor-frame-node-button ${
                    config.mark?.innerRadius && config.mark.innerRadius > 0 ? "mk-active" : ""
                  }`}
                  onClick={() => {
                    if (onConfigChange) {
                      const isDonut = config.mark?.innerRadius && config.mark.innerRadius > 0;
                      onConfigChange({
                        ...config,
                        mark: {
                          ...config.mark,
                          innerRadius: isDonut ? 0 : 0.5
                        }
                      });
                    }
                  }}
                  aria-label={i18n.settings.ariaLabels.toggleDonutChart}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: superstate?.ui?.getSticker("lucide//donut") || "",
                    }}
                  />
                  <span>{config.mark?.innerRadius && config.mark.innerRadius > 0 ? "Donut" : "Pie"}</span>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};
