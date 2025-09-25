import { getColorPalettes } from "core/utils/colorPalette";
import { SelectOption, SelectOptionType, Superstate, i18n } from "makemd-core";
import React from "react";
import { SpaceProperty } from "shared/types/mdb";
import { VisualizationConfig } from "shared/types/visualization";
import {
  defaultMenu,
  menuInput,
  menuSeparator,
} from "../UI/Menus/menu/SelectionMenu";
import { showSpacesMenu } from "../UI/Menus/properties/selectSpaceMenu";
import { propertyIsObjectType } from "utils/properties";
import { spaceNameFromSpacePath } from "core/utils/strings";

export interface VisualizationToolbarProps {
  superstate: Superstate;
  configData: VisualizationConfig;
  listId: string;
  sourcePath: string;
  availableTables: Array<{ id: string; name: string }>;
  onConfigChange: (config: VisualizationConfig) => void;
  onDataSourceChange: (tableId: string) => void;
  onSpaceChange: (spacePath: string) => void;
  getFieldEncodingType: (
    fieldName: string
  ) => "temporal" | "quantitative" | "nominal";
  window: Window;
  fields: SpaceProperty[];
}

export const VisualizationToolbar: React.FC<VisualizationToolbarProps> = ({
  superstate,
  configData,
  sourcePath,
  listId,
  availableTables,
  onConfigChange,
  onDataSourceChange,
  onSpaceChange,
  getFieldEncodingType,
  window,
  fields,
}) => {
  // Update aggregate helper function

  // Chart type menu
  const showChartTypeMenu = (e: React.MouseEvent) => {
    const chartTypes = [
      {
        type: "bar",
        name: i18n.menu.barChart || "Bar Chart",
        icon: "lucide//bar-chart",
      },
      {
        type: "line",
        name: i18n.menu.lineChart || "Line Chart",
        icon: "lucide//activity",
      },
      {
        type: "scatter",
        name: i18n.menu.scatterPlot || "Scatter Plot",
        icon: "lucide//scatter-chart",
      },
      {
        type: "pie",
        name: i18n.menu.pieChart || "Pie Chart",
        icon: "lucide//pie-chart",
      },
      {
        type: "area",
        name: i18n.menu.areaChart || "Area Chart",
        icon: "lucide//area-chart",
      },
      {
        type: "radar",
        name: i18n.menu.radarChart || "Radar Chart",
        icon: "lucide//radar",
      },
    ];

    const menuOptions: SelectOption[] = chartTypes.map((chart) => ({
      name: chart.name,
      icon: chart.icon,
      onClick: () => {
        onConfigChange({
          ...configData,
          chartType: chart.type as VisualizationConfig["chartType"],
          mark: {
            ...configData.mark,
            type:
              chart.type === "line"
                ? "line"
                : chart.type === "scatter"
                ? "circle"
                : chart.type === "pie"
                ? "arc"
                : chart.type === "area"
                ? "area"
                : chart.type === "radar"
                ? "line"
                : "rect",
          },
        });
      },
    }));

    superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      defaultMenu(superstate.ui, menuOptions),
      window
    );
  };
  // Data source selector
  const createDataSourceSelector = (offset: any, onHide: () => void) => {
    return superstate.ui.openMenu(
      offset,
      {
        ui: superstate.ui,
        multi: false,
        editable: false,
        value: [listId],
        options: [
          { name: "None", value: "" },
          ...availableTables.map((table) => ({
            name: table.name,
            value: table.id,
          })),
        ],
        saveOptions: (_: string[], value: string[]) => {
          onDataSourceChange(value[0]);
        },
        placeholder: i18n.menu.selectDataSource || "Select a data source",
        searchable: true,
        showAll: true,
      },
      window,
      null,
      onHide
    );
  };

  // Main options menu
  const showOptionsMenu = (e: React.MouseEvent) => {
    const menuOptions: SelectOption[] = [];

    // Space selector submenu
    menuOptions.push({
      name: i18n.menu.space || "Space",
      value: spaceNameFromSpacePath(sourcePath, superstate),
      icon: "lucide//folder",
      type: SelectOptionType.Disclosure,
      onSubmenu: (offset, onHide) =>
        showSpacesMenu(offset, window, superstate, (path) =>
          onSpaceChange(path)
        ),
    });

    // Data source submenu
    menuOptions.push({
      name: i18n.menu.list || "List",
      value: !listId ? "None" : listId,
      icon: "lucide//database",
      type: SelectOptionType.Disclosure,
      onSubmenu: createDataSourceSelector,
    });

    // X-Axis field submenu
    menuOptions.push({
      name:
        configData?.chartType === "pie"
          ? i18n.menu.category || "Category"
          : i18n.menu.xAxisField || "X-Axis Field",
      value: (() => {
        const xEncoding = configData?.encoding?.x;
        if (Array.isArray(xEncoding)) {
          return xEncoding[0]?.field || "None";
        } else if (
          xEncoding &&
          typeof xEncoding === "object" &&
          "field" in xEncoding
        ) {
          return xEncoding.field || "None";
        }
        return "None";
      })(),
      icon:
        configData?.chartType === "pie"
          ? "lucide//tag"
          : "lucide//move-horizontal",
      type: SelectOptionType.Disclosure,
      onSubmenu: (offset, onHide) => {
        const currentXField = (() => {
          const xEncoding = configData?.encoding?.x;
          if (Array.isArray(xEncoding)) {
            return xEncoding[0]?.field || "";
          } else if (
            xEncoding &&
            typeof xEncoding === "object" &&
            "field" in xEncoding
          ) {
            return xEncoding.field || "";
          }
          return "";
        })();

        return superstate.ui.openMenu(
          offset,
          {
            ui: superstate.ui,
            multi: false,
            editable: false,
            value: [currentXField],
            options: [
              { name: "None", value: "" },
              ...fields.map((field) => ({
                name: field.name,
                value: field.name,
              })),
            ],
            saveOptions: (_: string[], value: string[]) => {
              const field = value[0];
              const fieldType = field
                ? getFieldEncodingType(field)
                : ("nominal" as const);
              onConfigChange({
                ...configData,
                encoding: {
                  ...(configData?.encoding || {}),
                  x: field ? { field, type: fieldType } : undefined,
                },
              });
            },
            placeholder:
              configData?.chartType === "pie"
                ? i18n.menu.selectCategoryField || "Select category field"
                : i18n.menu.selectXAxisField || "Select X-axis field",
            searchable: true,
            showAll: true,
          },
          window,
          null,
          onHide
        );
      },
    });

    // Y-Axis fields submenu
    menuOptions.push({
      name:
        configData?.chartType === "pie"
          ? i18n.menu.values || "Values"
          : i18n.menu.yAxisFields || "Y-Axis Fields",
      value: (() => {
        const yEncoding = configData?.encoding?.y;
        if (Array.isArray(yEncoding)) {
          const fields = yEncoding
            .map((y) =>
              y && typeof y === "object" && "field" in y ? y.field : null
            )
            .filter(Boolean);
          return fields.length > 0 ? fields.join(", ") : "None";
        } else if (
          yEncoding &&
          typeof yEncoding === "object" &&
          "field" in yEncoding
        ) {
          return yEncoding.field || "None";
        }
        return "None";
      })(),
      icon:
        configData?.chartType === "pie" || configData?.chartType === "radar"
          ? "lucide//hash"
          : "lucide//move-vertical",
      type: SelectOptionType.Disclosure,
      onSubmenu: (offset, onHide) => {
        const currentYFields = (() => {
          const yEncoding = configData?.encoding?.y;
          if (Array.isArray(yEncoding)) {
            return yEncoding
              .map((y) =>
                y && typeof y === "object" && "field" in y ? y.field : null
              )
              .filter((f): f is string => f !== null);
          } else if (
            yEncoding &&
            typeof yEncoding === "object" &&
            "field" in yEncoding &&
            yEncoding.field
          ) {
            return [yEncoding.field];
          }
          return [];
        })();

        return superstate.ui.openMenu(
          offset,
          {
            ui: superstate.ui,
            multi: true,
            editable: false,
            value: currentYFields,
            options: fields.map((field) => ({
              name: field.name,
              value: field.name,
            })),
            saveOptions: (_: string[], value: string[]) => {
              const newYEncoding = value.map((field) => ({
                field,
                type: getFieldEncodingType(field),
              }));
              onConfigChange({
                ...configData,
                encoding: {
                  ...(configData?.encoding || {}),
                  y: newYEncoding.length > 0 ? newYEncoding : undefined,
                },
              });
            },
            placeholder:
              configData?.chartType === "pie"
                ? i18n.menu.selectValueFields || "Select value fields"
                : i18n.menu.selectYAxisFields || "Select Y-axis fields",
            searchable: true,
            showAll: true,
          },
          window,
          null,
          onHide
        );
      },
    });

    // Add separator before display options
    menuOptions.push(menuSeparator);

    // Legend submenu - exact copy from Visualization.tsx
    menuOptions.push({
      name: i18n.menu.legend || "Legend",
      value:
        configData.layout?.legend?.show !== false
          ? configData.layout?.legend?.position || i18n.menu.right || "right"
          : i18n.menu.hidden || "Hidden",
      icon: "lucide//list",
      type: SelectOptionType.Disclosure,
      onSubmenu: (offset, onHide) => {
        const legendOptions: SelectOption[] = [
          {
            name:
              configData.layout?.legend?.show !== false
                ? i18n.menu.hideLegend || "Hide Legend"
                : i18n.menu.showLegend || "Show Legend",
            icon: "ui//eye",
            onClick: () => {
              onConfigChange({
                ...configData,
                layout: {
                  ...configData.layout,
                  legend: {
                    ...configData.layout?.legend,
                    show: configData.layout?.legend?.show === false,
                  },
                },
              });
            },
          },
          menuSeparator,
          {
            name: i18n.menu.legendPosition || "Position",
            value: configData.layout?.legend?.position || "right",
            icon: "ui//move",
            type: SelectOptionType.Disclosure,
            onSubmenu: (offset, onHide) => {
              const positionOptions: SelectOption[] = [
                {
                  name: i18n.menu.legendTop || "Top",
                  value: "top",
                  onClick: () => {
                    onConfigChange({
                      ...configData,
                      layout: {
                        ...configData.layout,
                        legend: {
                          ...configData.layout?.legend,
                          position: "top",
                        },
                      },
                    });
                  },
                },
                {
                  name: i18n.menu.legendBottom || "Bottom",
                  value: "bottom",
                  onClick: () => {
                    onConfigChange({
                      ...configData,
                      layout: {
                        ...configData.layout,
                        legend: {
                          ...configData.layout?.legend,
                          position: "bottom",
                        },
                      },
                    });
                  },
                },
                {
                  name: i18n.menu.legendLeft || "Left",
                  value: "left",
                  onClick: () => {
                    onConfigChange({
                      ...configData,
                      layout: {
                        ...configData.layout,
                        legend: {
                          ...configData.layout?.legend,
                          position: "left",
                        },
                      },
                    });
                  },
                },
                {
                  name: i18n.menu.legendRight || "Right",
                  value: "right",
                  onClick: () => {
                    onConfigChange({
                      ...configData,
                      layout: {
                        ...configData.layout,
                        legend: {
                          ...configData.layout?.legend,
                          position: "right",
                        },
                      },
                    });
                  },
                },
              ];
              return superstate.ui.openMenu(
                offset,
                defaultMenu(superstate.ui, positionOptions),
                window,
                null,
                onHide
              );
            },
          },
          {
            name: i18n.menu.orientation || "Orientation",
            value: configData.layout?.legend?.orient || "horizontal",
            icon: "ui//layout",
            type: SelectOptionType.Disclosure,
            onSubmenu: (offset, onHide) => {
              const orientationOptions: SelectOption[] = [
                {
                  name: i18n.menu.horizontal || "Horizontal",
                  value: "horizontal",
                  onClick: () => {
                    onConfigChange({
                      ...configData,
                      layout: {
                        ...configData.layout,
                        legend: {
                          ...configData.layout?.legend,
                          orient: "horizontal",
                        },
                      },
                    });
                  },
                },
                {
                  name: i18n.menu.vertical || "Vertical",
                  value: "vertical",
                  onClick: () => {
                    onConfigChange({
                      ...configData,
                      layout: {
                        ...configData.layout,
                        legend: {
                          ...configData.layout?.legend,
                          orient: "vertical",
                        },
                      },
                    });
                  },
                },
              ];
              return superstate.ui.openMenu(
                offset,
                defaultMenu(superstate.ui, orientationOptions),
                window,
                null,
                onHide
              );
            },
          },
        ];

        return superstate.ui.openMenu(
          offset,
          defaultMenu(superstate.ui, legendOptions),
          window,
          null,
          onHide
        );
      },
    });

    // Color palette submenu - exact copy from Visualization.tsx
    menuOptions.push({
      name: i18n.menu.colorPalette || "Color Palette",
      value: (() => {
        const paletteId = configData.colorPalette;
        if (!paletteId) return i18n.menu.defaultPalette || "Default";
        // Try to get the palette name
        return (
          paletteId.charAt(0).toUpperCase() +
          paletteId.slice(1).replace("-", " ")
        );
      })(),
      icon: "lucide//palette",
      type: SelectOptionType.Disclosure,
      onSubmenu: (offset, onHide) => {
        // Import the color palette utilities

        // Get all available color palettes from the system
        const palettes = getColorPalettes(superstate);

        const colorOptions: SelectOption[] = [
          // None option to clear the palette
          {
            name: i18n.menu.none || "None",
            value: "",
            onClick: () => {
              onConfigChange({
                ...configData,
                colorPalette: "",
              });
            },
          },
          menuSeparator,
          // Add all available palettes from the system
          ...palettes.map((palette) => ({
            name: palette.name,
            value: palette.id,
            onClick: () => {
              onConfigChange({
                ...configData,
                colorPalette: palette.id,
              });
            },
          })),
        ];

        return superstate.ui.openMenu(
          offset,
          defaultMenu(superstate.ui, colorOptions),
          window,
          null,
          onHide
        );
      },
    });

    // Labels submenu - with toggles and inputs
    menuOptions.push({
      name: i18n.menu.axisLabels || "Labels",
      icon: "lucide//tag",
      type: SelectOptionType.Disclosure,
      onSubmenu: (offset, onHide) => {
        const labelOptions: SelectOption[] = [
          // X-Axis label section - toggle and text input grouped together
          {
            name: i18n.menu.showXAxisLabel || "Show X-Axis Label",
            icon:
              configData.layout?.xAxis?.show !== false
                ? "lucide//check"
                : "lucide//square",
            onClick: () => {
              onConfigChange({
                ...configData,
                layout: {
                  ...configData.layout,
                  xAxis: {
                    ...configData.layout?.xAxis,
                    show: configData.layout?.xAxis?.show === false,
                  },
                },
              });
            },
          },
          menuInput(
            configData.layout?.xAxis?.label || "",
            (value) => {
              onConfigChange({
                ...configData,
                layout: {
                  ...configData.layout,
                  xAxis: {
                    ...configData.layout?.xAxis,
                    label: value,
                  },
                },
              });
            },
            "X-Axis Label"
          ),
          menuSeparator,
          // Y-Axis label section - toggle and text input grouped together
          {
            name: i18n.menu.showYAxisLabel || "Show Y-Axis Label",
            icon:
              configData.layout?.yAxis?.show !== false
                ? "lucide//check"
                : "lucide//square",
            onClick: () => {
              onConfigChange({
                ...configData,
                layout: {
                  ...configData.layout,
                  yAxis: {
                    ...configData.layout?.yAxis,
                    show: configData.layout?.yAxis?.show === false,
                  },
                },
              });
            },
          },
          menuInput(
            configData.layout?.yAxis?.label || "",
            (value) => {
              onConfigChange({
                ...configData,
                layout: {
                  ...configData.layout,
                  yAxis: {
                    ...configData.layout?.yAxis,
                    label: value,
                  },
                },
              });
            },
            "Y-Axis Label"
          ),
          menuSeparator,
          // Data labels toggle
          {
            name: i18n.menu.showDataLabels || "Show Data Labels",
            icon: configData.mark?.dataLabels?.show
              ? "lucide//check"
              : "lucide//square",
            onClick: () => {
              onConfigChange({
                ...configData,
                mark: {
                  ...configData.mark,
                  dataLabels: {
                    ...configData.mark?.dataLabels,
                    show: !configData.mark?.dataLabels?.show,
                  },
                },
              });
            },
          },
          // Data points toggle (for line and area charts)
          ...(configData?.chartType === "line" ||
          configData?.chartType === "area"
            ? [
                {
                  name: i18n.menu.showDataPoints || "Show Data Points",
                  icon: configData?.mark?.point?.show
                    ? "lucide//check"
                    : "lucide//square",
                  onClick: () => {
                    onConfigChange({
                      ...configData,
                      mark: {
                        ...configData.mark,
                        point: {
                          ...configData.mark?.point,
                          show: !configData.mark?.point?.show,
                        },
                      },
                    });
                  },
                },
              ]
            : []),
        ];

        return superstate.ui.openMenu(
          offset,
          defaultMenu(superstate.ui, labelOptions),
          window,
          null,
          onHide
        );
      },
    });

    // Stacked option - only for bar and area charts
    if (configData?.chartType === "bar" || configData?.chartType === "area") {
      menuOptions.push({
        name: i18n.menu.stacked || "Stacked",
        value: configData?.stacked ? "On" : "Off",
        icon: "lucide//layers",
        onClick: () => {
          onConfigChange({
            ...configData,
            stacked: !configData.stacked,
          });
        },
      });
    }

    // Add separator before Group By and Aggregate
    menuOptions.push(menuSeparator);

    // Group By menu - direct field selection
    menuOptions.push({
      name: i18n.menu.groupBy || "Group By",
      value: configData.encoding?.color?.field || "None",
      icon: "lucide//columns",
      type: SelectOptionType.Disclosure,
      onSubmenu: (offset, onHide) => {
        const groupOptions: SelectOption[] = [
          {
            name: i18n.menu.none || "None",
            icon: "lucide//x",
            onClick: () => {
              onConfigChange({
                ...configData,
                encoding: {
                  ...(configData?.encoding || {}),
                  color: undefined,
                },
              });
              onHide?.();
            },
          },
          ...fields.map((field) => ({
            name: field.name,
            icon: "lucide//tag",
            onClick: () => {
              const fieldType = getFieldEncodingType(field.name);
              onConfigChange({
                ...configData,
                encoding: {
                  ...(configData?.encoding || {}),
                  color: {
                    field: field.name,
                    type: fieldType,
                    aggregate: configData?.encoding?.color?.aggregate || "sum",
                  },
                },
              });
              onHide?.();
            },
          })),
        ];

        return superstate.ui.openMenu(
          offset,
          defaultMenu(superstate.ui, groupOptions),
          window,
          "right",
          onHide
        );
      },
    });

    // Aggregate menu
    menuOptions.push({
      name: i18n.menu.aggregate || "Aggregate",
      value: (() => {
        // Get current aggregate setting
        if (configData?.encoding?.color?.field) {
          return configData?.encoding?.color?.aggregate || "sum";
        }
        const yEncoding = Array.isArray(configData.encoding?.y)
          ? configData.encoding.y[0]
          : configData.encoding?.y;
        return yEncoding?.aggregate || "sum";
      })(),
      icon: "lucide//calculator",
      type: SelectOptionType.Disclosure,
      onSubmenu: (offset, onHide) => {
        const aggregateOptions: SelectOption[] = [
          {
            name: i18n.menu.count || "Count",
            icon: "lucide//hash",
            onClick: () => {
              updateAggregate("count");
              onHide?.();
            },
          },
          {
            name: i18n.menu.sum || "Sum",
            icon: "lucide//plus",
            onClick: () => {
              updateAggregate("sum");
              onHide?.();
            },
          },
          {
            name: i18n.menu.average || "Average",
            icon: "lucide//divide",
            onClick: () => {
              updateAggregate("average");
              onHide?.();
            },
          },
          {
            name: i18n.menu.min || "Min",
            icon: "lucide//arrow-down",
            onClick: () => {
              updateAggregate("min");
              onHide?.();
            },
          },
          {
            name: i18n.menu.max || "Max",
            icon: "lucide//arrow-up",
            onClick: () => {
              updateAggregate("max");
              onHide?.();
            },
          },
          {
            name: i18n.menu.distinct || "Distinct",
            icon: "lucide//filter",
            onClick: () => {
              updateAggregate("distinct");
              onHide?.();
            },
          },
        ];

        const updateAggregate = (aggregateType: string) => {
          // Deep clone the config to ensure React detects changes
          const newConfig = JSON.parse(JSON.stringify(configData));

          // Ensure encoding exists
          if (!newConfig.encoding) {
            newConfig.encoding = {};
          }

          // Update aggregate for color (group by) encoding if it has a field
          if (newConfig.encoding?.color?.field) {
            newConfig.encoding.color = {
              ...newConfig.encoding.color,
              aggregate: aggregateType as any,
            };
          }

          // Also update Y encoding aggregate
          if (Array.isArray(newConfig.encoding?.y)) {
            newConfig.encoding.y = newConfig.encoding.y.map((y: any) => ({
              ...y,
              aggregate: aggregateType as any,
            }));
          } else if (newConfig.encoding?.y?.field) {
            newConfig.encoding.y = {
              ...newConfig.encoding.y,
              aggregate: aggregateType as any,
            };
          }

          onConfigChange(newConfig);
        };

        return superstate.ui.openMenu(
          offset,
          defaultMenu(superstate.ui, aggregateOptions),
          window,
          "right",
          onHide
        );
      },
    });

    superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      defaultMenu(superstate.ui, menuOptions),
      window
    );
  };

  return (
    <div className="mk-view-config" style={{ marginBottom: "8px" }}>
      {/* Graph title on the left */}
      <div
        style={{
          fontWeight: "var(--font-medium)",
          color: "var(--mk-ui-text-primary)",
          marginRight: "8px",
          display: "flex",
          alignItems: "center",
          flex: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minWidth: 0,
        }}
      >
        {configData.layout?.title?.text || "Visualization"}
      </div>

      {/* Chart type selector button */}
      <button
        className="mk-toolbar-button"
        onClick={showChartTypeMenu}
        title="Chart Type"
        dangerouslySetInnerHTML={{
          __html: superstate?.ui?.getSticker("lucide//bar-chart") || "",
        }}
      />

      {/* Options button with submenus */}
      <button
        className="mk-toolbar-button"
        onClick={showOptionsMenu}
        title="Options"
        dangerouslySetInnerHTML={{
          __html: superstate?.ui?.getSticker("lucide//settings") || "",
        }}
      />
    </div>
  );
};
