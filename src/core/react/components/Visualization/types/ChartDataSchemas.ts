/**
 * Type definitions for transformed data schemas used by each chart type
 * Each chart type expects data in a specific format after transformation
 */

/**
 * Bar Chart Data Schema
 * Data is grouped by category with aggregated values
 */
export interface BarChartDataPoint {
  category: string | number | Date;  // X-axis value
  value: number;              // Y-axis value (aggregated)
  series?: string;            // Series name for grouped bars
  stack?: string;             // Stack group identifier
  color?: string;             // Optional color override
  metadata?: Record<string, any>; // Original data for tooltips
}

export interface BarChartData {
  data: BarChartDataPoint[];
  categories: (string | number | Date)[];  // All unique categories
  series?: string[];                 // All unique series
  stacks?: string[];                 // Stack groups if stacked
  yExtent?: [number, number];        // Min and max y values after aggregation
}

/**
 * Pie Chart Data Schema
 * Simple key-value pairs with percentages
 */
export interface PieChartDataPoint {
  label: string;              // Slice label
  value: number;              // Absolute value
  percentage: number;         // Calculated percentage
  color?: string;             // Optional color override
  metadata?: Record<string, any>; // Original data for tooltips
}

export interface PieChartData {
  data: PieChartDataPoint[];
  total: number;              // Sum of all values
}

/**
 * Line Chart Data Schema
 * Time series or continuous data with multiple series support
 */
export interface LineChartDataPoint {
  x: string | number | Date;  // X-axis value
  y: number;                  // Y-axis value
  series: string;             // Series identifier
  color?: string;             // Optional color override
  metadata?: Record<string, any>; // Original data for tooltips
}

export interface LineChartData {
  data: LineChartDataPoint[];
  series: string[];           // All unique series
  xDomain: (string | number | Date)[]; // All x values in order
  yExtent: [number, number];  // Min and max y values
}

/**
 * Area Chart Data Schema
 * Similar to line chart but with stacking support
 */
export interface AreaChartDataPoint {
  x: string | number | Date;  // X-axis value
  y: number;                  // Y-axis value (base)
  y0?: number;                // Stack base (for stacked areas)
  series: string;             // Series identifier
  color?: string;             // Optional color override
  metadata?: Record<string, any>; // Original data for tooltips
}

export interface AreaChartData {
  data: AreaChartDataPoint[];
  series: string[];           // All unique series
  xDomain: (string | number | Date)[]; // All x values in order
  yExtent: [number, number];  // Min and max y values
  stacked: boolean;           // Whether data is stacked
}

/**
 * Scatter Plot Data Schema
 * Individual points with x, y coordinates and optional size/color dimensions
 */
export interface ScatterPlotDataPoint {
  x: number;                  // X-axis value
  y: number;                  // Y-axis value
  size?: number;              // Point size (optional)
  color?: string | number;    // Color value or category
  label?: string;             // Point label
  series?: string;            // Series/group identifier
  metadata?: Record<string, any>; // Original data for tooltips
}

export interface ScatterPlotData {
  data: ScatterPlotDataPoint[];
  xExtent: [number, number];  // Min and max x values
  yExtent: [number, number];  // Min and max y values
  sizeExtent?: [number, number]; // Min and max size values
  series?: string[];          // All unique series/groups
  xCategoricalMap?: Map<string, number>; // Mapping for categorical X values
  yCategoricalMap?: Map<string, number>; // Mapping for categorical Y values
}

/**
 * Aggregation types for data transformation
 */
export type AggregationType = 'sum' | 'mean' | 'average' | 'median' | 'min' | 'max' | 'count' | 'distinct' | 'first' | 'last';

/**
 * Transformation configuration
 */
export interface TransformConfig {
  groupBy?: string | string[];     // Fields to group by
  aggregation?: AggregationType;   // How to aggregate values
  stack?: boolean;                  // Whether to stack values
  normalize?: boolean;              // Normalize to percentages
  sortBy?: 'category' | 'value';   // Sort order
  sortOrder?: 'asc' | 'desc';      // Sort direction
  limit?: number;                   // Limit number of items
}