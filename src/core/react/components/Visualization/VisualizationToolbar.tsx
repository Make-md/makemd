import { getColorPalettes } from "core/utils/colorPalette";
import { SelectOption, SelectOptionType, Superstate } from "makemd-core";
import i18n from "shared/i18n";
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
        name: i18n.menu.barChart,
        icon: "lucide//bar-chart",
      },
      {
        type: "line",
        name: i18n.menu.lineChart,
        icon: "lucide//activity",
      },
      {
        type: "scatter",
        name: i18n.menu.scatterPlot,
        icon: "lucide//scatter-chart",
      },
      {
        type: "pie",
        name: i18n.menu.pieChart,
        icon: "lucide//pie-chart",
      },
      {
        type: "area",
        name: i18n.menu.areaChart,
        icon: "lucide//area-chart",
      },
      {
        type: "radar",
        name: i18n.menu.radarChart,
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
          { name: i18n.labels.none, value: "" },
          ...availableTables.map((table) => ({
            name: table.name,
            value: table.id,
          })),
        ],
        saveOptions: (_: string[], value: string[]) => {
          onDataSourceChange(value[0]);
        },
        placeholder: i18n.menu.selectDataSource,
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
      name: i18n.menu.space,
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
      name: i18n.menu.list,
      value: !listId ? i18n.labels.none : listId,
      icon: "lucide//database",
      type: SelectOptionType.Disclosure,
      onSubmenu: createDataSourceSelector,
    });

    // X-Axis field submenu
    menuOptions.push({
      name:
        configData?.chartType === "pie"
          ? i18n.menu.category
          : i18n.menu.xAxisField,
      value: (() => {
        const xEncoding = configData?.encoding?.x;
        if (Array.isArray(xEncoding)) {
          return xEncoding[0]?.field || i18n.labels.none;
        } else if (
          xEncoding &&
          typeof xEncoding === "object" &&
          "field" in xEncoding
        ) {
          return xEncoding.field || i18n.labels.none;
        }
        return i18n.labels.none;
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
              { name: i18n.labels.none, value: "" },
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
                ? i18n.menu.selectCategoryField
                : i18n.menu.selectXAxisField,
            searchable: true,
            showAll: true,
          },
          window,
          null,
          onHide
        );
      },
    });

    // Time Unit submenu (for temporal x-axis in line, bar, and area charts)
    const xEncoding = Array.isArray(configData?.encoding?.x) 
      ? configData?.encoding?.x[0] 
      : configData?.encoding?.x;
    
    if (
      (configData?.chartType === "line" || configData?.chartType === "bar" || configData?.chartType === "area") &&
      xEncoding &&
      typeof xEncoding === "object" &&
      "type" in xEncoding &&
      xEncoding.type === "temporal"
    ) {
      menuOptions.push({
        name: "Group By",
        value: xEncoding.timeUnit || "day",
        icon: "lucide//calendar",
        type: SelectOptionType.Disclosure,
        onSubmenu: (offset, onHide) => {
          const timeUnitOptions: SelectOption[] = [
            { name: i18n.timeUnits.hour, value: "hour" },
            { name: i18n.timeUnits.day, value: "day" },
            { name: i18n.timeUnits.week, value: "week" },
            { name: i18n.timeUnits.month, value: "month" },
            { name: i18n.labels.quarter, value: "quarter" },
            { name: i18n.timeUnits.year, value: "year" },
          ];

          return superstate.ui.openMenu(
            offset,
            {
              ui: superstate.ui,
              multi: false,
              editable: false,
              value: [xEncoding.timeUnit || "day"],
              options: timeUnitOptions,
              saveOptions: (_: string[], value: string[]) => {
                const timeUnit = value[0] as 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
                const currentXEncoding = Array.isArray(configData?.encoding?.x)
                  ? configData?.encoding?.x[0]
                  : configData?.encoding?.x;
                
                const updatedXEncoding = {
                  ...currentXEncoding,
                  timeUnit,
                };

                onConfigChange({
                  ...configData,
                  encoding: {
                    ...(configData?.encoding || {}),
                    x: Array.isArray(configData?.encoding?.x)
                      ? [updatedXEncoding]
                      : updatedXEncoding,
                  },
                });
              },
              placeholder: "Select time grouping",
              searchable: false,
              showAll: true,
            },
            window,
            null,
            onHide
          );
        },
      });
    }

    // Y-Axis fields submenu
    menuOptions.push({
      name:
        configData?.chartType === "pie"
          ? i18n.menu.values
          : i18n.menu.yAxisFields,
      value: (() => {
        const yEncoding = configData?.encoding?.y;
        if (Array.isArray(yEncoding)) {
          const fields = yEncoding
            .map((y) =>
              y && typeof y === "object" && "field" in y ? y.field : null
            )
            .filter(Boolean);
          return fields.length > 0 ? fields.join(", ") : i18n.labels.none;
        } else if (
          yEncoding &&
          typeof yEncoding === "object" &&
          "field" in yEncoding
        ) {
          return yEncoding.field || i18n.labels.none;
        }
        return i18n.labels.none;
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
                ? i18n.menu.selectValueFields
                : i18n.menu.selectYAxisFields,
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

    // Smooth curve toggle (only for line and area charts)
    if (configData?.chartType === "line" || configData?.chartType === "area") {
      menuOptions.push({
        name: "Smooth Curve",
        value: configData.mark?.interpolate === "monotone" ? i18n.labels.on : i18n.labels.off,
        icon: "lucide//line-chart",
        type: SelectOptionType.Disclosure,
        onSubmenu: (offset, onHide) => {
          const smoothOptions: SelectOption[] = [
            { name: i18n.labels.on, value: "monotone" },
            { name: i18n.labels.off, value: "linear" },
          ];

          return superstate.ui.openMenu(
            offset,
            {
              ui: superstate.ui,
              multi: false,
              editable: false,
              value: [configData.mark?.interpolate || "linear"],
              options: smoothOptions,
              saveOptions: (_: string[], value: string[]) => {
                const interpolate = value[0] as 'linear' | 'monotone';
                onConfigChange({
                  ...configData,
                  mark: {
                    ...configData.mark,
                    interpolate,
                  },
                });
              },
              placeholder: "Select curve style",
              searchable: false,
              showAll: true,
            },
            window,
            null,
            onHide
          );
        },
      });
    }

    // Legend submenu - exact copy from Visualization.tsx
    menuOptions.push({
      name: i18n.menu.legend,
      value:
        configData.layout?.legend?.show !== false
          ? configData.layout?.legend?.position || i18n.menu.right
          : i18n.menu.hidden,
      icon: "lucide//list",
      type: SelectOptionType.Disclosure,
      onSubmenu: (offset, onHide) => {
        const legendOptions: SelectOption[] = [
          {
            name:
              configData.layout?.legend?.show !== false
                ? i18n.menu.hideLegend
                : i18n.menu.showLegend,
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
            name: i18n.menu.legendPosition,
            value: configData.layout?.legend?.position || "right",
            icon: "ui//move",
            type: SelectOptionType.Disclosure,
            onSubmenu: (offset, onHide) => {
              const positionOptions: SelectOption[] = [
                {
                  name: i18n.menu.legendTop,
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
                  name: i18n.menu.legendBottom,
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
                  name: i18n.menu.legendLeft,
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
                  name: i18n.menu.legendRight,
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
            name: i18n.menu.orientation,
            value: configData.layout?.legend?.orient || "horizontal",
            icon: "ui//layout",
            type: SelectOptionType.Disclosure,
            onSubmenu: (offset, onHide) => {
              const orientationOptions: SelectOption[] = [
                {
                  name: i18n.menu.horizontal,
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
                  name: i18n.menu.vertical,
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
      name: i18n.menu.colorPalette,
      value: (() => {
        const paletteId = configData.colorPalette;
        if (!paletteId) return i18n.menu.defaultPalette;
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
            name: i18n.menu.none,
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
      name: i18n.menu.axisLabels,
      icon: "lucide//tag",
      type: SelectOptionType.Disclosure,
      onSubmenu: (offset, onHide) => {
        const labelOptions: SelectOption[] = [
          // X-Axis section
          {
            name: i18n.menu.showXAxis,
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
          {
            name: i18n.menu.showXAxisTitle,
            icon:
              configData.layout?.xAxis?.showLabel !== false
                ? "lucide//check"
                : "lucide//square",
            onClick: () => {
              onConfigChange({
                ...configData,
                layout: {
                  ...configData.layout,
                  xAxis: {
                    ...configData.layout?.xAxis,
                    showLabel: configData.layout?.xAxis?.showLabel === false,
                  },
                },
              });
            },
          },
        ];

        // Only show X-Axis title input if showLabel is enabled
        if (configData.layout?.xAxis?.showLabel !== false) {
          labelOptions.push(
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
              "X-Axis Title"
            )
          );
        }

        labelOptions.push(menuSeparator);

        // Y-Axis section
        labelOptions.push(
          {
            name: i18n.menu.showYAxis,
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
          {
            name: i18n.menu.showYAxisTitle,
            icon:
              configData.layout?.yAxis?.showLabel !== false
                ? "lucide//check"
                : "lucide//square",
            onClick: () => {
              onConfigChange({
                ...configData,
                layout: {
                  ...configData.layout,
                  yAxis: {
                    ...configData.layout?.yAxis,
                    showLabel: configData.layout?.yAxis?.showLabel === false,
                  },
                },
              });
            },
          }
        );

        // Only show Y-Axis title input if showLabel is enabled
        if (configData.layout?.yAxis?.showLabel !== false) {
          labelOptions.push(
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
              "Y-Axis Title"
            )
          );
        }

        // Grid section - only for bar, line, scatter, and area charts
        if (['bar', 'line', 'scatter', 'area'].includes(configData.chartType)) {
          labelOptions.push(
            menuSeparator,
            {
              name: i18n.menu.showXGridlines,
              icon:
                configData.layout?.grid?.x === true
                  ? "lucide//check"
                  : "lucide//square",
              onClick: () => {
                onConfigChange({
                  ...configData,
                  layout: {
                    ...configData.layout,
                    grid: {
                      ...configData.layout?.grid,
                      x: configData.layout?.grid?.x !== true,
                    },
                  },
                });
              },
            },
            {
              name: i18n.menu.showYGridlines,
              icon:
                configData.layout?.grid?.y !== false
                  ? "lucide//check"
                  : "lucide//square",
              onClick: () => {
                onConfigChange({
                  ...configData,
                  layout: {
                    ...configData.layout,
                    grid: {
                      ...configData.layout?.grid,
                      y: configData.layout?.grid?.y === false,
                    },
                  },
                });
              },
            }
          );
        }

        labelOptions.push(
          menuSeparator,
          // Data labels toggle
          {
            name: i18n.menu.showDataLabels,
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
                  name: i18n.menu.showDataPoints,
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
            : [])
        );

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
        name: i18n.menu.stacked,
        value: configData?.stacked ? i18n.labels.on : i18n.labels.off,
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
      name: i18n.menu.groupBy,
      value: configData.encoding?.color?.field || i18n.labels.none,
      icon: "lucide//columns",
      type: SelectOptionType.Disclosure,
      onSubmenu: (offset, onHide) => {
        const groupOptions: SelectOption[] = [
          {
            name: i18n.menu.none,
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
      name: i18n.menu.aggregate,
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
            name: i18n.menu.count,
            icon: "lucide//hash",
            onClick: () => {
              updateAggregate("count");
              onHide?.();
            },
          },
          {
            name: i18n.menu.sum,
            icon: "lucide//plus",
            onClick: () => {
              updateAggregate("sum");
              onHide?.();
            },
          },
          {
            name: i18n.menu.average,
            icon: "lucide//divide",
            onClick: () => {
              updateAggregate("average");
              onHide?.();
            },
          },
          {
            name: i18n.menu.min,
            icon: "lucide//arrow-down",
            onClick: () => {
              updateAggregate("min");
              onHide?.();
            },
          },
          {
            name: i18n.menu.max,
            icon: "lucide//arrow-up",
            onClick: () => {
              updateAggregate("max");
              onHide?.();
            },
          },
          {
            name: i18n.menu.distinct,
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
