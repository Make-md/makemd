import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React, { useEffect, useMemo, useRef } from "react";
import { VisualizationConfig } from "shared/types/visualization";
import { SVGRenderContext } from "./utils/RenderContext";
import {
  AreaChartUtility,
  AxisLabelUtility,
  AxisUtility,
  BarChartUtility,
  GridlineUtility,
  HeatmapUtility,
  LegendUtility,
  LineChartUtility,
  PieChartUtility,
  RadarChartUtility,
  ScatterPlotUtility,
  TitleUtility,
  VisualizationLayoutUtility,
} from "./utils/shared";
import type { LegendItem } from "./utils/shared/LegendUtility";
import { sortUniqueValues } from "./utils/sortingUtils";
import { getPaletteColors, resolveColor } from "./utils/utils";
import * as d3Selection from "d3-selection";
import * as d3Scale from "d3-scale";
import * as d3Array from "d3-array";
import { scaleUtc } from "core/utils/d3-imports";
import { SpaceProperty } from "shared/types/mdb";
import { displayTextForType } from "core/utils/displayTextForType";
import { DataTransformationPipeline, TransformedData } from "./DataTransformationPipeline";
import { ensureCorrectEncodingType } from "./utils/inferEncodingType";
import { 
  BarChartData, 
  PieChartData, 
  LineChartData, 
  AreaChartData, 
  ScatterPlotData,
  RadarChartData
} from "./transformers";

// Type definitions for D3 scales
type D3LinearScale = d3Scale.ScaleLinear<number, number>;
type D3BandScale = d3Scale.ScaleBand<string>;
type D3TimeScale = d3Scale.ScaleTime<number, number>;
type D3OrdinalScale = d3Scale.ScaleOrdinal<string, string>;
type D3ScaleType = D3LinearScale | D3BandScale | D3TimeScale | D3OrdinalScale;

export interface D3VisualizationEngineProps {
  config: VisualizationConfig;
  data: Record<string, unknown>[];
  tableProperties?: SpaceProperty[];
  width: number;
  height: number;
  className?: string;
  superstate?: Superstate;
  showTitle?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showLegend?: boolean;
  showXAxisLabel?: boolean;
  showYAxisLabel?: boolean;
  editMode?: boolean;
  selectedElement?: {
    type: string;
    id?: string;
  } | null;
  onElementSelect?: (element: { type: string; id?: string } | null) => void;
  onElementDoubleClick?: (element: { type: string; id?: string }, rect: DOMRect, currentValue: string) => void;
  onElementsRendered?: (elements: Array<{ type: string; value: string; position: DOMRect; rotation?: number }>) => void;
  colorPaletteId?: string;
  showDebug?: boolean;
}

export const D3VisualizationEngine: React.FC<D3VisualizationEngineProps> = ({
  config,
  data,
  tableProperties,
  width,
  height,
  className,
  superstate,
  showTitle = false,
  showXAxis = true,
  showYAxis = true,
  showLegend = true,
  showXAxisLabel = true,
  showYAxisLabel = true,
  editMode = false,
  selectedElement,
  onElementSelect,
  onElementDoubleClick,
  onElementsRendered,
  colorPaletteId,
  showDebug = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform data using the pipeline
  const transformedData = useMemo(() => {
    const transformed = DataTransformationPipeline.transform(data, config, tableProperties);
    // Apply rendering transformations
    return DataTransformationPipeline.applyRenderingTransformations(transformed);
  }, [data, config, tableProperties]);

  // Calculate layout dimensions using VisualizationLayoutUtility
  const layoutDimensions = useMemo(() => {
    return VisualizationLayoutUtility.calculateLayout(
      config,
      { width, height },
      {
        showTitle,
        showXAxis,
        showYAxis,
        showLegend,
        showXAxisLabel,
        showYAxisLabel,
      }
    );
  }, [
    width,
    height,
    config,
    showTitle,
    showXAxis,
    showYAxis,
    showLegend,
    showXAxisLabel,
    showYAxisLabel,
  ]);

  // Create scales from encoding
  const scales = useMemo(() => {
    const scales = new Map<string, D3ScaleType>();
    
    // Use transformed data extents if available for quantitative scales
    const getYExtentFromTransformedData = (): [number, number] | null => {
      if (!transformedData?.data) return null;
      
      switch (transformedData.type) {
        case 'bar':
          const barData = transformedData.data as BarChartData;
          // Use pre-calculated yExtent from transformer which includes aggregation
          return barData.yExtent || null;
          
        case 'line':
          const lineData = transformedData.data as LineChartData;
          return lineData.yExtent || null;
          
        case 'area':
          const areaData = transformedData.data as AreaChartData;
          return areaData.yExtent || null;
          
        case 'scatter':
          const scatterData = transformedData.data as ScatterPlotData;
          return scatterData.yExtent || null;
          
        default:
          return null;
      }
    };

    // X scale
    if (config.encoding.x) {
      const xEncodings = Array.isArray(config.encoding.x)
        ? config.encoding.x
        : [config.encoding.x];
      let primaryEncoding = xEncodings[0];

      if (!primaryEncoding || !primaryEncoding.field) {
        return scales;
      }

      const field = primaryEncoding.field;
      const values = data.map((d) => d[field]);
      
      // For scatter plots, line charts, bar charts, and area charts, ensure numeric/date fields use appropriate encoding
      if (config.chartType === 'scatter' || config.chartType === 'line' || config.chartType === 'bar' || config.chartType === 'area') {
        const fieldProperty = tableProperties?.find(p => p.name === field);
        primaryEncoding = ensureCorrectEncodingType(primaryEncoding, fieldProperty, values);
      }
      
      switch (primaryEncoding.type) {
        case "quantitative": {
          // For scatter plots with transformed data, use the x extent from transformed data
          let extentValues: [number, number];
          if (config.chartType === 'scatter' && transformedData?.type === 'scatter' && transformedData.data) {
            const scatterData = transformedData.data as ScatterPlotData;
            extentValues = scatterData.xExtent || d3Array.extent(values, (d) => Number(d)) as [number, number];
          } else {
            extentValues = d3Array.extent(values, (d) => Number(d)) as [number, number];
          }
          scales.set(
            "x",
            d3Scale.scaleLinear().domain(extentValues).range([0, 0])
          ); // Will be set in render
          break;
        }
        case "ordinal":
        case "nominal": {
          // Find the field definition for proper sorting
          const fieldDef = tableProperties?.find(p => p.name === field);
          
          // Always use sorted unique values for consistent ordering
          const uniqueValues = sortUniqueValues(
            Array.from(new Set(values.map(String))),
            fieldDef
          );
          
          // For bar charts, use tighter spacing; for other charts use default
          const innerPadding = config.chartType === 'bar' ? 0.05 : 0.1;
          const outerPadding = config.chartType === 'bar' ? 0.05 : 0.2;
          scales.set(
            "x",
            d3Scale
              .scaleBand()
              .domain(uniqueValues)
              .range([0, 0])
              .paddingInner(innerPadding)
              .paddingOuter(outerPadding)
          );
          break;
        }
        case "temporal": {
          let timeExtent: [Date, Date] | null = null;
          
          // For bar charts, use transformed data categories if available
          if (config.chartType === 'bar' && transformedData?.type === 'bar' && transformedData.data) {
            const barData = transformedData.data as BarChartData;
            if (barData.categories && barData.categories.length > 0) {
              const dates = barData.categories.filter(c => c instanceof Date) as Date[];
              if (dates.length > 0) {
                timeExtent = [
                  new Date(Math.min(...dates.map(d => d.getTime()))),
                  new Date(Math.max(...dates.map(d => d.getTime())))
                ];
              }
            }
          }
          
          // For line charts, use transformed data xDomain if available
          if (config.chartType === 'line' && transformedData?.type === 'line' && transformedData.data) {
            const lineData = transformedData.data as LineChartData;
            if (lineData.xDomain && lineData.xDomain.length > 0) {
              const dates = lineData.xDomain.filter(x => x instanceof Date) as Date[];
              if (dates.length > 0) {
                timeExtent = [
                  new Date(Math.min(...dates.map(d => d.getTime()))),
                  new Date(Math.max(...dates.map(d => d.getTime())))
                ];
              }
            }
          }
          
          // For area charts, use transformed data xDomain if available
          if (config.chartType === 'area' && transformedData?.type === 'area' && transformedData.data) {
            const areaData = transformedData.data as AreaChartData;
            if (areaData.xDomain && areaData.xDomain.length > 0) {
              const dates = areaData.xDomain.filter(x => x instanceof Date) as Date[];
              if (dates.length > 0) {
                timeExtent = [
                  new Date(Math.min(...dates.map(d => d.getTime()))),
                  new Date(Math.max(...dates.map(d => d.getTime())))
                ];
              }
            }
          }
          
          // Fallback to raw data if no transformed data available
          if (!timeExtent) {
            timeExtent = d3Array.extent(
              values,
              (d) => {
                // Handle values that are already Date objects or date strings
                if (d instanceof Date) return d;
                if (d === null || d === undefined || d === '') return null;
                const dateStr = String(d);
                // Parse as UTC to match transformer behavior
                if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
                  const parsed = new Date(dateStr);
                  // Convert to UTC midnight
                  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
                }
                const date = new Date(dateStr);
                return isNaN(date.getTime()) ? null : date;
              }
            ).filter(d => d !== null) as [Date, Date];
          }
          
          
          // Only create scale if we have valid dates
          if (timeExtent && timeExtent[0] && timeExtent[1]) {
            const timeRange = timeExtent[1].getTime() - timeExtent[0].getTime();
            const msPerDay = 24 * 60 * 60 * 1000;
            const padding = Math.max(msPerDay * 0.5, timeRange * 0.02);
            const domain: [Date, Date] = [
              new Date(timeExtent[0].getTime() - padding),
              new Date(timeExtent[1].getTime() + padding)
            ];
            scales.set("x", scaleUtc().domain(domain).range([0, 0])); // Will be set in render
          } else {
            // Fallback to linear scale if dates are invalid
            const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
            if (numericValues.length > 0) {
              const extent = d3Array.extent(numericValues) as [number, number];
              scales.set("x", d3Scale.scaleLinear().domain(extent).range([0, 0]));
            }
          }
          break;
        }
      }
    }

    // Y scale
    if (config.encoding.y) {
      const yEncodings = Array.isArray(config.encoding.y)
        ? config.encoding.y
        : [config.encoding.y];
      let primaryEncoding = yEncodings[0];

      if (!primaryEncoding || !primaryEncoding.field) {
        return scales;
      }

      // For scatter plots, ensure numeric/date fields use appropriate encoding
      if (config.chartType === 'scatter') {
        const fieldProperty = tableProperties?.find(p => p.name === primaryEncoding.field);
        const fieldValues = data.map((d) => d[primaryEncoding.field]);
        primaryEncoding = ensureCorrectEncodingType(primaryEncoding, fieldProperty, fieldValues);
      }

      // For multiple Y fields, we need to consider all their values for the domain
      const allValues: number[] = [];
      yEncodings.forEach(encoding => {
        if (encoding.field) {
          const fieldValues = data.map((d) => d[encoding.field]).filter(v => v !== null && v !== undefined);
          allValues.push(...fieldValues.map(v => Number(v)));
        }
      });
      

      switch (primaryEncoding.type) {
        case "quantitative": {
          // Try to get extent from transformed data first (which includes aggregation)
          const transformedExtent = getYExtentFromTransformedData();
          
          let extentValues: [number, number];
          if (transformedExtent) {
            // Use aggregated values from transformed data
            extentValues = transformedExtent;
          } else {
            // Fallback to raw data extent
            extentValues = d3Array.extent(allValues) as [number, number];
          }
          
          let domain: [number, number];

          // Handle both positive and negative values properly
          const [minValue, maxValue] = extentValues;
          const hasNegativeValues = minValue < 0;
          
          if (config.chartType === "scatter") {
            // For scatter plots, use full extent with padding
            const range = maxValue - minValue;
            const padding = range * 0.1; // 10% padding
            domain = [minValue - padding, maxValue + padding];
          } else if (hasNegativeValues) {
            // For charts with negative values, use full extent with padding
            const range = maxValue - minValue;
            const padding = range * 0.1; // 10% padding
            domain = [minValue - padding, maxValue + padding];
          } else {
            // For charts with only positive values, start at 0 and add padding on top
            const padding = maxValue * 0.1; // 10% padding
            domain = [0, maxValue + padding];
          }

          const scale = d3Scale.scaleLinear().domain(domain).range([0, 0]); // Will be set in render
          scales.set("y", scale);
          break;
        }
        case "ordinal":
        case "nominal": {
          // Find the field definition for proper sorting
          const yField = primaryEncoding.field;
          const fieldDef = tableProperties?.find(p => p.name === yField);
          
          const uniqueValues = sortUniqueValues(
            Array.from(new Set(allValues.map(v => String(v)))),
            fieldDef
          );
          scales.set(
            "y",
            d3Scale
              .scaleBand()
              .domain(uniqueValues)
              .range([0, 0])
              .paddingInner(0.1)
              .paddingOuter(0.1)
          ); // Will be set in render
          break;
        }
        case "temporal": {
          const timeExtent = d3Array.extent(
            allValues,
            (v) => new Date(String(v))
          ) as [Date, Date];
          scales.set("y", scaleUtc().domain(timeExtent).range([0, 0])); // Will be set in render
          break;
        }
      }
    }

    // Color scale
    if (config.encoding.color && config.encoding.color.field) {
      const field = config.encoding.color.field;
      
      // For bar charts with transformed data, use the series from transformed data
      let uniqueValues: string[];
      if (transformedData?.type === 'bar' && transformedData.data) {
        const barData = transformedData.data as BarChartData;
        if (barData.series) {
          uniqueValues = barData.series;
        } else {
          const values = data.map((d) => String(d[field]));
          uniqueValues = Array.from(new Set(values));
        }
      } else {
        const values = data.map((d) => String(d[field]));
        uniqueValues = Array.from(new Set(values));
      }

      scales.set(
        "color",
        d3Scale
          .scaleOrdinal<string, string>()
          .domain(uniqueValues)
          .range(config.colorScheme || getPaletteColors(colorPaletteId, superstate))
      );
    }

    // Size scale
    if (config.encoding.size && config.encoding.size.field) {
      const field = config.encoding.size.field;
      const values = data.map((d) => Number(d[field]));
      const extentValues = d3Array.extent(values) as [number, number];

      scales.set(
        "size",
        d3Scale.scaleLinear().domain(extentValues).range([4, 20])
      ); // Default size range
    }

    
    return scales;
  }, [data, config, colorPaletteId, transformedData, tableProperties]);

  // Get legend items
  const legendItems = useMemo((): LegendItem[] => {
    if (!showLegend) return [];

    const colorScale = scales.get("color") as D3OrdinalScale | undefined;

    if (config.encoding.color && colorScale) {
      // Color-based legend
      const colorField = config.encoding.color.field;
      const result = colorScale.domain().map((value: string) => ({
        label: (() => {
          const prop = tableProperties?.find(p => p.name === colorField);
          return prop ? displayTextForType(prop, value, superstate) : value;
        })(),
        color: colorScale(value),
      }));
      return result;
    } else if (
      Array.isArray(config.encoding.y) &&
      config.encoding.y.length > 1
    ) {
      // Multi-series legend
      const colors = getPaletteColors(colorPaletteId, superstate);
      const result = config.encoding.y.map((yField, index) => ({
        label: yField.field || `Series ${index + 1}`,
        color: colors[index % colors.length],
      }));
      return result;
    } else if (config.chartType === "pie") {
      // Pie chart legend based on categories - match PieChartUtility logic
      const xEncoding = Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x;
      const categoryField = config.encoding.color?.field || xEncoding?.field || 'category';

      if (categoryField && data.some(d => categoryField in d)) {
        const uniqueValues = Array.from(
          new Set(data.map((d) => String(d[categoryField])))
        );
        const colors = getPaletteColors(colorPaletteId, superstate);
        const result = uniqueValues.map((value, index) => ({
          label: (() => {
            const prop = tableProperties?.find(p => p.name === categoryField);
            return prop ? displayTextForType(prop, value, superstate) : value;
          })(),
          color: colors[index % colors.length],
        }));
        return result;
      }
    } else {
      // Default legend for single-series charts
      // Always show a legend for single series if showLegend is true
      const yField = Array.isArray(config.encoding.y)
        ? config.encoding.y[0]?.field
        : config.encoding.y?.field;

      if (yField) {
        const colors = getPaletteColors(colorPaletteId, superstate);
        const result = [
          {
            label: yField,
            color: colors[0] || "#1f77b4",
          },
        ];
        return result;
      } else {
        // Even without a Y field, create a basic legend if showLegend is true
        const colors = getPaletteColors(colorPaletteId, superstate);
        const result = [
          {
            label: config.chartType || i18n.labels.data,
            color: colors[0] || "#1f77b4",
          },
        ];
        return result;
      }
    }

    return [];
  }, [config, data, scales, showLegend, colorPaletteId, superstate, tableProperties]);

  // Render visualization
  useEffect(() => {
    
    if (!svgRef.current || !data || data.length === 0) {
      return;
    }

    const svg = d3Selection.select(svgRef.current);
    
    // Clean up any existing tooltips before re-rendering
    const tooltipClasses = [
      '.bar-tooltip',
      '.line-tooltip',
      '.scatter-tooltip',
      '.pie-tooltip',
      '.heatmap-tooltip',
      '.radar-tooltip',
      '.area-tooltip'
    ];
    tooltipClasses.forEach(className => {
      d3Selection.selectAll(className).remove();
    });
    
    // Also check if there are stored tooltip references and remove them
    const svgNode = svg.node() as any;
    if (svgNode) {
      ['__barTooltip', '__lineTooltip', '__scatterTooltip', '__pieTooltip', '__heatmapTooltip', '__radarTooltip'].forEach(tooltipRef => {
        if (svgNode[tooltipRef]) {
          svgNode[tooltipRef].remove();
          delete svgNode[tooltipRef];
        }
      });
    }
    
    svg.selectAll("*").remove();

    const { graphArea, innerContainer } = layoutDimensions;
    
    // Debug: Add visual bounds for layout areas if showDebug is true
    if (showDebug) {
      const debugGroup = svg.append("g").attr("class", "debug-layer");
      
      // Show graph area bounds (red)
      debugGroup.append("rect")
        .attr("x", graphArea.left)
        .attr("y", graphArea.top)
        .attr("width", graphArea.width)
        .attr("height", graphArea.height)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("opacity", 0.5);
      
      // Add label for graph area
      debugGroup.append("text")
        .attr("x", graphArea.left + 5)
        .attr("y", graphArea.top + 15)
        .attr("font-size", "12px")
        .attr("fill", "red")
        .text("Graph Area");
      
      // Show inner container bounds (blue)
      debugGroup.append("rect")
        .attr("x", innerContainer.left)
        .attr("y", innerContainer.top)
        .attr("width", innerContainer.width)
        .attr("height", innerContainer.height)
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3")
        .attr("opacity", 0.5);
      
      // Add label for inner container
      debugGroup.append("text")
        .attr("x", innerContainer.left + 5)
        .attr("y", innerContainer.top + 30)
        .attr("font-size", "12px")
        .attr("fill", "blue")
        .text("Inner Container");
      
      // Show legend area bounds if legend is shown (green)
      // Check showLegend and if chart type should have a legend
      const shouldHaveLegend = showLegend && (
        !!config.encoding?.color || 
        (Array.isArray(config.encoding?.y) && config.encoding.y.length > 1) ||
        config.chartType === 'pie'
      );
      
      if (shouldHaveLegend) {
        const legendPos = VisualizationLayoutUtility.getLegendPosition(
          layoutDimensions,
          config,
          { showTitle }
        );
        
        
        debugGroup.append("rect")
          .attr("x", legendPos.x)
          .attr("y", legendPos.y)
          .attr("width", legendPos.width)
          .attr("height", legendPos.height)
          .attr("fill", "none")
          .attr("stroke", "green")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")
          .attr("opacity", 0.5);
        
        // Add label for legend area
        debugGroup.append("text")
          .attr("x", legendPos.x + 5)
          .attr("y", legendPos.y + 15)
          .attr("font-size", "12px")
          .attr("fill", "green")
          .text("Legend Area");
      }
      
      // Show title area bounds if title is shown (purple)
      if (showTitle && config.layout?.title?.text) {
        const titlePos = VisualizationLayoutUtility.getTitlePosition(layoutDimensions, config);
        const titleHeight = layoutDimensions.titleHeight;
        
        debugGroup.append("rect")
          .attr("x", titlePos.x)
          .attr("y", titlePos.y - titleHeight / 2)
          .attr("width", width - layoutDimensions.padding.left - layoutDimensions.padding.right)
          .attr("height", titleHeight)
          .attr("fill", "none")
          .attr("stroke", "purple")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,3")
          .attr("opacity", 0.5);
      }
      
      // Show X-axis area (orange)
      if (showXAxis && layoutDimensions.xAxisHeight > 0) {
        debugGroup.append("rect")
          .attr("x", graphArea.left)
          .attr("y", graphArea.bottom)
          .attr("width", graphArea.width)
          .attr("height", layoutDimensions.xAxisHeight)
          .attr("fill", "none")
          .attr("stroke", "orange")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "2,2")
          .attr("opacity", 0.7);
        
        debugGroup.append("text")
          .attr("x", graphArea.left + 5)
          .attr("y", graphArea.bottom + 15)
          .attr("font-size", "10px")
          .attr("fill", "orange")
          .text("X-Axis");
      }
      
      // Show X-axis label area (yellow)
      if (showXAxisLabel && layoutDimensions.xAxisLabelHeight > 0) {
        debugGroup.append("rect")
          .attr("x", graphArea.left)
          .attr("y", graphArea.bottom + layoutDimensions.xAxisHeight)
          .attr("width", graphArea.width)
          .attr("height", layoutDimensions.xAxisLabelHeight)
          .attr("fill", "none")
          .attr("stroke", "gold")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "2,2")
          .attr("opacity", 0.7);
        
        debugGroup.append("text")
          .attr("x", graphArea.left + 5)
          .attr("y", graphArea.bottom + layoutDimensions.xAxisHeight + 12)
          .attr("font-size", "10px")
          .attr("fill", "gold")
          .text("X-Axis Label");
      }
      
      // Show Y-axis area (cyan)
      if (showYAxis && layoutDimensions.yAxisWidth > 0) {
        debugGroup.append("rect")
          .attr("x", graphArea.left - layoutDimensions.yAxisWidth)
          .attr("y", graphArea.top)
          .attr("width", layoutDimensions.yAxisWidth)
          .attr("height", graphArea.height)
          .attr("fill", "none")
          .attr("stroke", "cyan")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "2,2")
          .attr("opacity", 0.7);
        
        debugGroup.append("text")
          .attr("x", graphArea.left - layoutDimensions.yAxisWidth + 5)
          .attr("y", graphArea.top + 15)
          .attr("font-size", "10px")
          .attr("fill", "cyan")
          .text("Y-Axis");
      }
      
      // Show Y-axis label area (magenta)
      if (showYAxisLabel && layoutDimensions.yAxisLabelWidth > 0) {
        debugGroup.append("rect")
          .attr("x", graphArea.left - layoutDimensions.yAxisWidth - layoutDimensions.yAxisLabelWidth)
          .attr("y", graphArea.top)
          .attr("width", layoutDimensions.yAxisLabelWidth)
          .attr("height", graphArea.height)
          .attr("fill", "none")
          .attr("stroke", "magenta")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "2,2")
          .attr("opacity", 0.7);
        
        debugGroup.append("text")
          .attr("x", graphArea.left - layoutDimensions.yAxisWidth - layoutDimensions.yAxisLabelWidth + 5)
          .attr("y", graphArea.top + 15)
          .attr("font-size", "10px")
          .attr("fill", "magenta")
          .text("Y-Axis Label");
      }
    }


    // Update scales with actual dimensions
    scales.forEach((scale, key) => {
      if (key === "x") {
        if (scale.range) {
          scale.range([graphArea.left, graphArea.right]);
        }
      } else if (key === "y") {
        if (scale.range) {
          scale.range([graphArea.bottom, graphArea.top]);
        }
      }
    });


    // Create a clipPath for the graph area to prevent overflow
    const clipId = `graph-clip-${Math.random().toString(36).substring(2, 9)}`;
    svg.append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("x", graphArea.left)
      .attr("y", graphArea.top)
      .attr("width", graphArea.width)
      .attr("height", graphArea.height);

    // Create layer structure for proper rendering order
    // 1. Background layer for gridlines (clipped to graph area)
    const gridGroup = svg.append("g")
      .attr("class", "grid-layer")
      .attr("clip-path", `url(#${clipId})`);
    
    // 2. Axes layer (not clipped, so they can render outside graph area)
    const axesGroup = svg.append("g").attr("class", "axes-layer");
    
    // 3. Main chart content layer (clipped to graph area)
    const g = svg.append("g")
      .attr("class", "chart-layer")
      .attr("clip-path", `url(#${clipId})`);
    
    // 4. Labels and legend layer (not clipped)
    const labelsGroup = svg.append("g").attr("class", "labels-layer");

    // Get scales
    const xScale = scales.get("x");
    const yScale = scales.get("y");
    

    // Create shared render context
    const sharedContext: SVGRenderContext = {
      type: "svg",
      svg,
      g,
      gridGroup,
      processedData: data,
      transformedData,
      scales,
      config,
      graphArea,
      actualDimensions: { width, height },
      editMode,
      selectedElement,
      onElementSelect,
      onElementDoubleClick,
      showTitle,
      showXAxis,
      showYAxis,
      showLegend,
      showXAxisLabel,
      showYAxisLabel,
      showDataLabels: false, // Not implemented in make-md yet
      resolveColor,
      colorPaletteId,
      superstate,
      tableProperties,
    };
    
    // Create context for axes (renders in axesGroup)
    const axesContext: SVGRenderContext = { ...sharedContext, g: axesGroup };
    
    // Create context for labels (renders in labelsGroup)
    const labelsContext: SVGRenderContext = { ...sharedContext, g: labelsGroup };

    // Render gridlines - not for pie or radar charts
    if (config.chartType !== "pie" && config.chartType !== "radar" && (xScale || yScale)) {
      GridlineUtility.render(sharedContext, xScale, yScale);
    }

    // Render axes - not for pie or radar charts
    if (config.chartType !== "pie" && config.chartType !== "radar" && (showXAxis || showYAxis)) {
      AxisUtility.renderAxes(axesContext, xScale, yScale);
    }

    // Render based on chart type
    
    switch (config.chartType) {
      case "bar":
        BarChartUtility.render(sharedContext);
        break;
      case "line":
        LineChartUtility.render(sharedContext);
        break;
      case "scatter":
        ScatterPlotUtility.render(sharedContext);
        break;
      case "pie":
        PieChartUtility.render(sharedContext);
        break;
      case "area":
        AreaChartUtility.render(sharedContext);
        break;
      case "heatmap":
        HeatmapUtility.render(sharedContext);
        break;
      case "radar":
        RadarChartUtility.render(sharedContext);
        break;
      default:
        // Chart type not supported
        break;
    }

    // Add axis labels - not for pie or radar charts
    if (config.chartType !== "pie" && config.chartType !== "radar" && showXAxisLabel) {
      AxisLabelUtility.renderXLabel(labelsContext, () => {
        if (editMode && onElementSelect) {
          onElementSelect({ type: "xAxisLabel" });
        }
      });
    }

    if (config.chartType !== "pie" && config.chartType !== "radar" && showYAxisLabel) {
      AxisLabelUtility.renderYLabel(labelsContext, () => {
        if (editMode && onElementSelect) {
          onElementSelect({ type: "yAxisLabel" });
        }
      });
    }

    // Add title - DISABLED
    let titleHeight = 0;
    // if (showTitle) {
    //   const titleResult = TitleUtility.render(labelsContext, () => {
    //     if (editMode && onElementSelect) {
    //       onElementSelect({ type: "title" });
    //     }
    //   });
    //   titleHeight = titleResult.titleHeight;
    // }

    // Add legend based on position
    if (legendItems.length > 0 && showLegend) {
      const legendPos = VisualizationLayoutUtility.getLegendPosition(
        layoutDimensions,
        config,
        { showTitle }
      );
      
      // Use the labels context for legend rendering (not clipped)
      const legendContext: SVGRenderContext = { ...labelsContext };
      
      LegendUtility.render(legendContext, legendItems, {
        position: config.layout?.legend?.position || "top",
        align: config.layout?.legend?.align,
        titleHeight,
        layoutPosition: legendPos,
      });
    }

    // Cleanup function to remove tooltips when component unmounts or re-renders
    return () => {
      const tooltipClasses = [
        '.bar-tooltip',
        '.line-tooltip',
        '.scatter-tooltip',
        '.pie-tooltip',
        '.heatmap-tooltip',
        '.radar-tooltip',
        '.area-tooltip'
      ];
      tooltipClasses.forEach(className => {
        d3Selection.selectAll(className).remove();
      });
      
      // Also clean up stored tooltip references
      const svgNode = svg.node() as any;
      if (svgNode) {
        ['__barTooltip', '__lineTooltip', '__scatterTooltip', '__pieTooltip', '__heatmapTooltip', '__radarTooltip'].forEach(tooltipRef => {
          if (svgNode[tooltipRef]) {
            svgNode[tooltipRef].remove();
            delete svgNode[tooltipRef];
          }
        });
      }
    };
  }, [
    data,
    transformedData,
    scales,
    config,
    config.mark?.interpolate, // Add specific dependency for interpolate
    width,
    height,
    layoutDimensions,
    showTitle,
    showXAxis,
    showYAxis,
    showLegend,
    showXAxisLabel,
    showYAxisLabel,
    editMode,
    selectedElement,
    onElementSelect,
    onElementDoubleClick,
    legendItems,
    colorPaletteId,
    showDebug,
    superstate,
    tableProperties,
  ]);

  // Separate effect to collect editable element positions when edit mode changes
  useEffect(() => {
    if (!editMode || !onElementsRendered || !svgRef.current) return;
    
    // Delay to ensure the chart is fully rendered
    const timer = setTimeout(() => {
      const svg = d3Selection.select(svgRef.current);
      const editableElements: Array<{ type: string; value: string; position: DOMRect; rotation?: number }> = [];
      
      // Get title element
      if (showTitle) {
        const titleText = config.layout?.title?.text || i18n.labels.title;
        const titleElement = svg.select('.title-group text').node() as SVGTextElement;
        if (titleElement && svgRef.current) {
          const svgRect = svgRef.current.getBoundingClientRect();
          const elemRect = titleElement.getBoundingClientRect();
          // Calculate position relative to SVG container
          const relativeRect = new DOMRect(
            elemRect.x - svgRect.x,
            elemRect.y - svgRect.y,
            elemRect.width,
            elemRect.height
          );
          editableElements.push({
            type: 'title',
            value: titleText,
            position: relativeRect
          });
        }
      }
      
      // Get x-axis label element
      if (showXAxisLabel && config.chartType !== 'pie' && config.chartType !== 'radar') {
        let xLabel = config.layout?.xAxis?.label || 
          (config.encoding.x && !Array.isArray(config.encoding.x) 
            ? config.encoding.x.field 
            : '') || '';
        
        const xLabelElement = svg.select('.x-axis-label-group text').node() as SVGTextElement;
        if (xLabelElement && svgRef.current) {
          const svgRect = svgRef.current.getBoundingClientRect();
          const elemRect = xLabelElement.getBoundingClientRect();
          // Calculate position relative to SVG container
          const relativeRect = new DOMRect(
            elemRect.x - svgRect.x,
            elemRect.y - svgRect.y,
            elemRect.width,
            elemRect.height
          );
          editableElements.push({
            type: 'xAxisLabel',
            value: xLabel,
            position: relativeRect
          });
        }
      }
      
      // Get y-axis label element
      if (showYAxisLabel && config.chartType !== 'pie' && config.chartType !== 'radar') {
        let yLabel = config.layout?.yAxis?.label || 
          (config.encoding.y && !Array.isArray(config.encoding.y) 
            ? config.encoding.y.field 
            : '') || '';
        
        const yLabelElement = svg.select('.y-axis-label-group text').node() as SVGTextElement;
        if (yLabelElement && svgRef.current) {
          const svgRect = svgRef.current.getBoundingClientRect();
          const elemRect = yLabelElement.getBoundingClientRect();
          // Calculate position relative to SVG container
          const relativeRect = new DOMRect(
            elemRect.x - svgRect.x,
            elemRect.y - svgRect.y,
            elemRect.width,
            elemRect.height
          );
          editableElements.push({
            type: 'yAxisLabel',
            value: yLabel,
            position: relativeRect,
            rotation: -90 // Y-axis labels are rotated -90 degrees
          });
        }
      }
      
      onElementsRendered(editableElements);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [editMode, showTitle, showXAxisLabel, showYAxisLabel, config, onElementsRendered]); // Re-run when these change

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Clean up all tooltips on component unmount
      const tooltipClasses = [
        '.bar-tooltip',
        '.line-tooltip',
        '.scatter-tooltip',
        '.pie-tooltip',
        '.heatmap-tooltip',
        '.radar-tooltip',
        '.area-tooltip',
        '.d3-viz-tooltip' // Generic tooltip class
      ];
      tooltipClasses.forEach(className => {
        d3Selection.selectAll(className).remove();
      });
    };
  }, []); // Empty dependency array means this only runs on unmount

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        flex: 1,
        width: "100%",
        minHeight: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: "block" }}
      />
    </div>
  );
};
