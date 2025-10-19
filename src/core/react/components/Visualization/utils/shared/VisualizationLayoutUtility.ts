import { VisualizationConfig } from 'shared/types/visualization';

export interface VisualizationLayoutOptions {
  showTitle?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showLegend?: boolean;
  showXAxisLabel?: boolean;
  showYAxisLabel?: boolean;
}

export interface VisualizationLayoutDimensions {
  width: number;
  height: number;
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export interface GraphArea {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface InnerContainer {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  containerArea: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  innerContainer: InnerContainer;
  graphArea: GraphArea;
  legendHeight: number;
  legendWidth: number;
  containerHeight: number;
  titleHeight: number;
  xAxisLabelHeight: number;
  yAxisLabelWidth: number;
  xAxisHeight: number;
  yAxisWidth: number;
}

/**
 * Shared utility for calculating visualization layout dimensions
 * Used by both D3 and Canvas renderers to ensure consistent layout
 */
export class VisualizationLayoutUtility {
  /**
   * Calculate all layout dimensions for a visualization
   * This includes title area, axis areas, legend area, and the main graph area
   */
  static calculateLayout(
    config: VisualizationConfig,
    dimensions: VisualizationLayoutDimensions,
    options: VisualizationLayoutOptions = {}
  ): LayoutResult {
    // Default options
    const {
      showTitle = true,
      showXAxis = config.layout.xAxis.show,
      showYAxis = config.layout.yAxis.show,
      showLegend = config.layout.legend.show,
      showXAxisLabel = config.layout.xAxis.show,
      showYAxisLabel = config.layout.yAxis.show,
    } = options;

    // Base padding values - reduced for more chart space
    const defaultPadding = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    };

    // Merge with any custom padding
    const padding = {
      ...defaultPadding,
      ...dimensions.padding,
    };

    // Calculate title height - DISABLED
    let titleHeight = 0;
    // if (showTitle && config.layout?.title?.text) {
    //   const titleFontSize = config.layout.title.fontSize || 16;
    //   titleHeight = titleFontSize + 20; // Font size + spacing
    // }

    // Calculate legend dimensions
    let legendHeight = 0;
    let legendWidth = 0;
    // Check multiple conditions for when legend should be shown:
    // 1. showLegend is true
    // 2. Either color encoding exists OR it's a multi-series chart (multiple Y fields) OR pie chart OR single series chart
    const shouldShowLegend = showLegend && (
      config.encoding?.color || 
      (Array.isArray(config.encoding?.y) && config.encoding.y.length > 1) ||
      config.chartType === 'pie' ||
      // Also show legend for single series charts when showLegend is true
      (!Array.isArray(config.encoding?.y) && config.encoding?.y?.field) ||
      (Array.isArray(config.encoding?.y) && config.encoding.y.length === 1 && config.encoding.y[0]?.field)
    );
    
    
    if (shouldShowLegend) {
      const legendPosition = config.layout?.legend?.position || 'top';
      const legendFontSize = config.layout?.legend?.itemFontSize || 12;
      
      if (legendPosition === 'top' || legendPosition === 'bottom') {
        // Calculate dynamic height based on orientation
        const legendOrientation = config.layout?.legend?.orient || 'horizontal';
        const baseHeight = legendFontSize + 28; // Font size + item height + spacing
        
        if (legendOrientation === 'horizontal') {
          // Horizontal orientation - single row height
          legendHeight = baseHeight;
        } else {
          // Vertical orientation or multi-row - allow for multiple rows
          legendHeight = baseHeight * 2; // Allow space for up to 2 rows initially
        }
      } else {
        legendWidth = 120; // Fixed width for side legends
      }
    }

    // Calculate axis label dimensions - check both showLabel toggle and label text
    let xAxisLabelHeight = 0;
    if (showXAxisLabel && config.layout?.xAxis?.label && config.layout?.xAxis?.showLabel !== false) {
      const labelFontSize = config.layout.xAxis.labelFontSize || 12;
      xAxisLabelHeight = labelFontSize + 10; // Font size + spacing
    }

    let yAxisLabelWidth = 0;
    if (showYAxisLabel && config.layout?.yAxis?.label && config.layout?.yAxis?.showLabel !== false) {
      const labelFontSize = config.layout.yAxis.labelFontSize || 12;
      yAxisLabelWidth = labelFontSize + 10; // Font size + spacing (rotated text)
    }

    // Adjust padding based on what's shown
    if (!showTitle) {
      padding.top = 10;
      titleHeight = 0;
    }
    if (!showXAxis && !showXAxisLabel) {
      padding.bottom = 10;
      xAxisLabelHeight = 0;
    }
    if (!showYAxis && !showYAxisLabel) {
      padding.left = 10;
      yAxisLabelWidth = 0;
    }

    // Calculate axis dimensions
    let xAxisHeight = 0;
    let yAxisWidth = 0;
    
    if (config.chartType !== 'pie') {
      if (showXAxis && config.layout?.xAxis?.show !== false) {
        xAxisHeight = 25; // Height for axis line, ticks, and tick labels
      }
      if (showYAxis && config.layout?.yAxis?.show !== false) {
        yAxisWidth = 35; // Width for axis line, ticks, and tick labels
      }
    } else {
      // For pie charts, reduce padding and no axes
      padding.left = 10;
      padding.bottom = 10;
      xAxisLabelHeight = 0;
      yAxisLabelWidth = 0;
      xAxisHeight = 0;
      yAxisWidth = 0;
    }

    // Calculate the minimum required height for the visualization
    const legendPosition = config.layout?.legend?.position || 'top';
    
    // Use the full available height
    const containerHeight = dimensions.height;

    // Define container area
    const containerArea = {
      left: 0,
      right: dimensions.width,
      top: 0,
      bottom: containerHeight,
    };

    // Calculate inner container area (includes graph, axes, and axis labels)
    // Use the larger of titleHeight or padding.top to ensure consistent spacing
    const topSpace = Math.max(titleHeight, padding.top);
    
    const innerContainer: InnerContainer = {
      left: padding.left + (legendPosition === 'left' ? legendWidth : 0),
      right: dimensions.width - padding.right - (legendPosition === 'right' ? legendWidth : 0),
      top: topSpace + (legendPosition === 'top' ? legendHeight : 0),
      bottom: containerHeight - padding.bottom - (legendPosition === 'bottom' ? legendHeight : 0),
      width: 0,
      height: 0,
    };
    
    innerContainer.width = Math.max(0, innerContainer.right - innerContainer.left);
    innerContainer.height = Math.max(0, innerContainer.bottom - innerContainer.top);

    // Calculate graph area (the area where the actual chart is drawn)
    // The graph area is inside the inner container, accounting for axes and labels
    const graphArea: GraphArea = {
      left: innerContainer.left + yAxisLabelWidth + yAxisWidth,
      right: innerContainer.right,
      top: innerContainer.top,
      bottom: innerContainer.bottom - xAxisHeight - xAxisLabelHeight,
      width: 0,
      height: 0,
    };

    // Calculate graph dimensions
    graphArea.width = Math.max(0, graphArea.right - graphArea.left);
    graphArea.height = Math.max(0, graphArea.bottom - graphArea.top);

    const result = {
      padding,
      containerArea,
      innerContainer,
      graphArea,
      legendHeight,
      legendWidth,
      containerHeight,
      titleHeight,
      xAxisLabelHeight,
      yAxisLabelWidth,
      xAxisHeight,
      yAxisWidth,
    };
    
    
    return result;
  }

  /**
   * Get the position for the title element
   */
  static getTitlePosition(layout: LayoutResult, config: VisualizationConfig): { x: number; y: number } {
    const { containerArea, padding } = layout;
    
    // Title should be left-aligned with some padding from the container edge
    const x = containerArea.left + padding.left;

    // Position title vertically centered in the title area
    const y = containerArea.top + (layout.titleHeight / 2);
    return { x, y };
  }

  /**
   * Get the position for the legend
   */
  static getLegendPosition(layout: LayoutResult, config: VisualizationConfig, options?: { showTitle?: boolean }): { x: number; y: number; width: number; height: number } {
    const legendPosition = config.layout?.legend?.position || 'top';
    const { containerArea, legendHeight, legendWidth, titleHeight } = layout;
    const showTitle = options?.showTitle !== false && config.layout?.title?.text && layout.titleHeight > 0;
    

    switch (legendPosition) {
      case 'top':
        return {
          x: containerArea.left,
          y: showTitle ? containerArea.top + titleHeight : containerArea.top,
          width: containerArea.right - containerArea.left,
          height: legendHeight,
        };
      case 'bottom':
        return {
          x: containerArea.left,
          y: containerArea.bottom - legendHeight,
          width: containerArea.right - containerArea.left,
          height: legendHeight,
        };
      case 'left':
        return {
          x: containerArea.left,
          y: showTitle ? containerArea.top + titleHeight : containerArea.top,
          width: legendWidth,
          height: (containerArea.bottom - (showTitle ? containerArea.top + titleHeight : containerArea.top)),
        };
      case 'right':
        return {
          x: containerArea.right - legendWidth,
          y: showTitle ? containerArea.top + titleHeight : containerArea.top,
          width: legendWidth,
          height: (containerArea.bottom - (showTitle ? containerArea.top + titleHeight : containerArea.top)),
        };
      default:
        return { x: 0, y: 0, width: 0, height: 0 };
    }
  }

  /**
   * Get the position for the X-axis label
   */
  static getXAxisLabelPosition(layout: LayoutResult, config: VisualizationConfig): { x: number; y: number } {
    const { graphArea, xAxisHeight } = layout;
    return {
      x: graphArea.left + graphArea.width / 2,
      y: graphArea.bottom + xAxisHeight + 10, // Positioned below the axis with gap
    };
  }

  /**
   * Get the position for the Y-axis label
   */
  static getYAxisLabelPosition(layout: LayoutResult, config: VisualizationConfig): { x: number; y: number; rotation: number } {
    const { graphArea, yAxisWidth, yAxisLabelWidth } = layout;
    return {
      x: graphArea.left - yAxisWidth - yAxisLabelWidth / 2, // Center of Y-label area
      y: graphArea.top + graphArea.height / 2,
      rotation: -90, // Rotated for vertical text
    };
  }
}