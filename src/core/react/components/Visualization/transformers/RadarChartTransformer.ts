import { VisualizationConfig } from "shared/types/visualization";
import { SpaceProperty } from "shared/types/mdb";
import { sortUniqueValues } from "../utils/sortingUtils";

/**
 * Radar Chart Data Schema
 */
export interface RadarChartDataPoint {
  axis: string;           // The axis/dimension name
  value: number;          // The value for this axis
  series: string;         // Series identifier
  metadata?: Record<string, any>; // Original data for tooltips
}

export interface RadarChartData {
  data: RadarChartDataPoint[];
  axes: string[];         // All unique axes in order
  series: string[];       // All unique series
  maxValue: number;       // Maximum value across all data points
}

/**
 * Transforms raw data into the format expected by radar chart renderer
 */
export class RadarChartTransformer {
  /**
   * Main transformation function
   */
  static transform(
    rawData: Record<string, unknown>[],
    config: VisualizationConfig,
    tableProperties?: SpaceProperty[]
  ): RadarChartData {
    if (!rawData || rawData.length === 0) {
      return { 
        data: [], 
        axes: [],
        series: [],
        maxValue: 0
      };
    }

    // Radar charts typically use:
    // - X encoding for the axes/dimensions
    // - Y encoding for the values
    // - Color encoding for different series/groups
    const xEncoding = Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x;
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : [config.encoding.y];
    const colorEncoding = config.encoding.color;
    
    if (!xEncoding?.field) {
      return { 
        data: [], 
        axes: [],
        series: [],
        maxValue: 0
      };
    }

    const transformedData: RadarChartDataPoint[] = [];
    const axesSet = new Set<string>();
    const seriesSet = new Set<string>();
    let maxValue = 0;

    // Handle multiple Y fields as different metrics
    if (yEncodings.length > 1) {
      // Each Y field becomes an axis, X field provides categories
      rawData.forEach(record => {
        const category = String(record[xEncoding.field] || 'unknown');
        seriesSet.add(category);

        yEncodings.forEach(yEncoding => {
          if (!yEncoding?.field) return;
          
          const axisName = yEncoding.field;
          axesSet.add(axisName);
          
          const value = Number(record[yEncoding.field]) || 0;
          maxValue = Math.max(maxValue, value);

          transformedData.push({
            axis: axisName,
            value,
            series: category,
            metadata: {
              [xEncoding.field]: record[xEncoding.field],
              [yEncoding.field]: record[yEncoding.field]
            }
          });
        });
      });
    } else if (colorEncoding?.field) {
      // X provides axes, Y provides values, color provides series
      const yEncoding = yEncodings[0];
      if (!yEncoding?.field) {
        return { 
          data: [], 
          axes: [],
          series: [],
          maxValue: 0
        };
      }

      // Group data by series and axis
      const grouped = new Map<string, Map<string, number[]>>();
      
      rawData.forEach(record => {
        const axis = String(record[xEncoding.field] || 'unknown');
        const series = String(record[colorEncoding.field] || 'default');
        const value = Number(record[yEncoding.field]) || 0;
        
        axesSet.add(axis);
        seriesSet.add(series);
        
        if (!grouped.has(series)) {
          grouped.set(series, new Map());
        }
        const seriesGroup = grouped.get(series)!;
        
        if (!seriesGroup.has(axis)) {
          seriesGroup.set(axis, []);
        }
        seriesGroup.get(axis)!.push(value);
      });

      // Aggregate values
      grouped.forEach((seriesData, series) => {
        seriesData.forEach((values, axis) => {
          const aggregatedValue = this.aggregate(values, yEncoding.aggregate || 'mean');
          maxValue = Math.max(maxValue, aggregatedValue);
          
          transformedData.push({
            axis,
            value: aggregatedValue,
            series,
            metadata: {
              [xEncoding.field]: axis,
              [yEncoding.field]: aggregatedValue,
              [colorEncoding.field]: series
            }
          });
        });
      });
    } else {
      // Single series: X provides axes, Y provides values
      const yEncoding = yEncodings[0];
      if (!yEncoding?.field) {
        return { 
          data: [], 
          axes: [],
          series: [],
          maxValue: 0
        };
      }

      const seriesName = yEncoding.field;
      seriesSet.add(seriesName);

      // Group by axis for aggregation
      const grouped = new Map<string, number[]>();
      
      rawData.forEach(record => {
        const axis = String(record[xEncoding.field] || 'unknown');
        const value = Number(record[yEncoding.field]) || 0;
        
        axesSet.add(axis);
        
        if (!grouped.has(axis)) {
          grouped.set(axis, []);
        }
        grouped.get(axis)!.push(value);
      });

      // Aggregate values
      grouped.forEach((values, axis) => {
        const aggregatedValue = this.aggregate(values, yEncoding.aggregate || 'mean');
        maxValue = Math.max(maxValue, aggregatedValue);
        
        transformedData.push({
          axis,
          value: aggregatedValue,
          series: seriesName,
          metadata: {
            [xEncoding.field]: axis,
            [yEncoding.field]: aggregatedValue
          }
        });
      });
    }

    // Sort axes based on field definition
    const xFieldDef = tableProperties?.find(p => p.name === xEncoding.field);
    const unsortedAxes = Array.from(axesSet);
    const sortedAxes = sortUniqueValues(
      unsortedAxes,
      xFieldDef
    );
    

    return {
      data: transformedData,
      axes: sortedAxes,
      series: Array.from(seriesSet).sort(),
      maxValue: maxValue || 1 // Ensure at least 1 for scale
    };
  }

  /**
   * Apply aggregation function to values
   */
  private static aggregate(values: number[], type?: string): number {
    if (values.length === 0) return 0;
    
    switch (type) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'mean':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'median':
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      case 'first':
        return values[0];
      case 'last':
        return values[values.length - 1];
      default:
        return values.reduce((a, b) => a + b, 0) / values.length; // Default to mean
    }
  }
}