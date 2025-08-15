import { Superstate } from "makemd-core";
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
import { getPaletteColors, resolveColor } from "./utils/utils";
import * as d3Selection from "d3-selection";
import * as d3Scale from "d3-scale";
import * as d3Array from "d3-array";
import { SpaceProperty } from "shared/types/mdb";
import { displayTextForType } from "core/utils/displayTextForType";

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

    // X scale
    if (config.encoding.x) {
      const xEncodings = Array.isArray(config.encoding.x)
        ? config.encoding.x
        : [config.encoding.x];
      const primaryEncoding = xEncodings[0];

      if (!primaryEncoding || !primaryEncoding.field) {
        return scales;
      }

      const field = primaryEncoding.field;
      const values = data.map((d) => d[field]);
      

      switch (primaryEncoding.type) {
        case "quantitative": {
          const extentValues = d3Array.extent(values, (d) => Number(d)) as [
            number,
            number
          ];
          scales.set(
            "x",
            d3Scale.scaleLinear().domain(extentValues).range([0, 0])
          ); // Will be set in render
          break;
        }
        case "ordinal":
        case "nominal": {
          const uniqueValues = Array.from(new Set(values.map(String))).sort();
          scales.set(
            "x",
            d3Scale
              .scaleBand()
              .domain(uniqueValues)
              .range([0, 0])
              .paddingInner(0.1)
              .paddingOuter(0.2)
          ); // Increased outer padding for better spacing
          break;
        }
        case "temporal": {
          const timeExtent = d3Array.extent(
            values,
            (d) => new Date(String(d))
          ) as [Date, Date];
          scales.set("x", d3Scale.scaleTime().domain(timeExtent).range([0, 0])); // Will be set in render
          break;
        }
      }
    }

    // Y scale
    if (config.encoding.y) {
      const yEncodings = Array.isArray(config.encoding.y)
        ? config.encoding.y
        : [config.encoding.y];
      const primaryEncoding = yEncodings[0];

      if (!primaryEncoding || !primaryEncoding.field) {
        return scales;
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
          const extentValues = d3Array.extent(allValues) as [
            number,
            number
          ];
          let domain: [number, number];

          // Ensure y-axis starts at 0 for most chart types
          if (config.chartType === "scatter") {
            // For scatter plots, start at 0 but add padding on top to prevent clipping
            const maxValue = Math.max(0, extentValues[1]);
            const padding = maxValue * 0.1; // 10% padding on top
            domain = [0, maxValue + padding];
          } else {
            // For bar, line, area charts, start at 0 and add 10% padding on top
            const maxValue = Math.max(0, extentValues[1]);
            const padding = maxValue * 0.1; // 10% padding
            domain = [0, maxValue + padding];
          }

          const scale = d3Scale.scaleLinear().domain(domain).range([0, 0]); // Will be set in render
          scales.set("y", scale);
          break;
        }
        case "ordinal":
        case "nominal": {
          const uniqueValues = Array.from(new Set(allValues.map(v => String(v))));
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
          scales.set("y", d3Scale.scaleTime().domain(timeExtent).range([0, 0])); // Will be set in render
          break;
        }
      }
    }

    // Color scale
    if (config.encoding.color && config.encoding.color.field) {
      const field = config.encoding.color.field;
      const values = data.map((d) => String(d[field]));
      const uniqueValues = Array.from(new Set(values));

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
  }, [data, config, colorPaletteId]);

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
            label: config.chartType || 'Data',
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
        console.warn(`Chart type ${config.chartType} is not supported`);
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
        const titleText = config.layout?.title?.text || 'Title';
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
        width: "100%",
        height: "100%",
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
