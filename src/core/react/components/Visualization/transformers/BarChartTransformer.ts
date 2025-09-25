import { SpaceProperty } from "shared/types/mdb";
import { VisualizationConfig } from "shared/types/visualization";
import { AggregationType, BarChartData, BarChartDataPoint } from "../types/ChartDataSchemas";
import { sortUniqueValues } from "../utils/sortingUtils";

/**
 * Transforms raw data into the format expected by bar chart renderer
 */
export class BarChartTransformer {
  /**
   * Main transformation function
   */
  static transform(
    rawData: Record<string, unknown>[],
    config: VisualizationConfig,
    tableProperties?: SpaceProperty[]
  ): BarChartData {
    if (!rawData || rawData.length === 0) {
      return { data: [], categories: [] };
    }

    const xEncoding = Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x;
    const yEncoding = Array.isArray(config.encoding.y) ? config.encoding.y[0] : config.encoding.y;
    const colorEncoding = config.encoding.color;
    
    if (!xEncoding?.field || !yEncoding?.field) {
      return { data: [], categories: [] };
    }

    // Determine if we have grouped or stacked bars
    // If color field is same as x field, don't treat it as a series
    const seriesField = (colorEncoding?.field && colorEncoding.field !== xEncoding.field) 
      ? colorEncoding.field 
      : undefined;
    const isStacked = config.mark?.stack === true;
    
    // Check if yField is an option type or other non-numeric field
    const yFieldProperty = tableProperties?.find(prop => prop.name === yEncoding.field);
    const isYFieldOption = yFieldProperty?.type === 'option' || yFieldProperty?.type === 'option-multi';
    
    // Use count aggregation for option fields, otherwise use the specified or default aggregation
    const aggregationType = isYFieldOption ? 'count' : (yEncoding.aggregate || 'sum');
    
    // Group and aggregate data
    const aggregatedData = this.aggregateData(
      rawData,
      xEncoding.field,
      yEncoding.field,
      seriesField,
      aggregationType,
      isYFieldOption
    );

    // Convert to bar chart format
    const chartData = this.convertToBarFormat(
      aggregatedData,
      xEncoding.field,
      yEncoding.field,
      seriesField,
      isStacked,
      tableProperties
    );

    return chartData;
  }

  /**
   * Aggregate data by category and series
   */
  private static aggregateData(
    data: Record<string, unknown>[],
    xField: string,
    yField: string,
    seriesField?: string,
    aggregation: AggregationType = 'sum',
    isYFieldOption: boolean = false
  ): Map<string, Map<string, number>> {
    // For counting option values or other non-numeric fields
    if (aggregation === 'count' || aggregation === 'distinct' || isYFieldOption) {
      const countMap = new Map<string, Map<string, number>>();
      
      // When yField is an option field, we want to count occurrences of each option value per category
      if (isYFieldOption) {
        // Group by x-axis category and count each option value
        data.forEach(record => {
          const category = String(record[xField] || 'undefined');
          const optionValue = String(record[yField] || 'undefined');
          const series = seriesField ? String(record[seriesField] || 'default') : optionValue;
          
          if (!countMap.has(category)) {
            countMap.set(category, new Map());
          }
          
          const categoryGroup = countMap.get(category)!;
          // Use the option value as the series key if no series field is specified
          const seriesKey = seriesField ? series : optionValue;
          categoryGroup.set(seriesKey, (categoryGroup.get(seriesKey) || 0) + 1);
        });
      } else {
        // Regular count aggregation
        data.forEach(record => {
          const category = String(record[xField] || 'undefined');
          const series = seriesField ? String(record[seriesField] || 'default') : 'default';
          
          if (!countMap.has(category)) {
            countMap.set(category, new Map());
          }
          
          const categoryGroup = countMap.get(category)!;
          if (aggregation === 'count') {
            // Count all occurrences
            categoryGroup.set(series, (categoryGroup.get(series) || 0) + 1);
          } else if (aggregation === 'distinct') {
            // For distinct, we need a different approach
            // Just count unique occurrences for now
            categoryGroup.set(series, (categoryGroup.get(series) || 0) + 1);
          }
        });
      }
      
      return countMap;
    }
    
    // Original numeric aggregation logic
    const grouped = new Map<string, Map<string, number[]>>();

    data.forEach(record => {
      const category = String(record[xField] || 'undefined');
      const series = seriesField ? String(record[seriesField] || 'default') : 'default';
      const value = Number(record[yField]);
      
      // Skip NaN values (e.g., from option fields)
      if (isNaN(value)) {
        return;
      }

      if (!grouped.has(category)) {
        grouped.set(category, new Map());
      }
      
      const categoryGroup = grouped.get(category)!;
      if (!categoryGroup.has(series)) {
        categoryGroup.set(series, []);
      }
      
      categoryGroup.get(series)!.push(value);
    });

    // Apply aggregation
    const aggregated = new Map<string, Map<string, number>>();
    
    grouped.forEach((seriesMap, category) => {
      aggregated.set(category, new Map());
      seriesMap.forEach((values, series) => {
        const aggregatedValue = this.aggregate(values, aggregation);
        aggregated.get(category)!.set(series, aggregatedValue);
      });
    });

    return aggregated;
  }

  /**
   * Apply aggregation function to values
   */
  private static aggregate(values: number[], type: AggregationType): number {
    if (values.length === 0) return 0;
    
    switch (type) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'mean':
      case 'average':
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
      case 'distinct':
        return new Set(values).size;
      case 'first':
        return values[0];
      case 'last':
        return values[values.length - 1];
      default:
        return values[0];
    }
  }

  /**
   * Convert aggregated data to bar chart format
   */
  private static convertToBarFormat(
    aggregatedData: Map<string, Map<string, number>>,
    xField: string,
    yField: string,
    seriesField?: string,
    isStacked?: boolean,
    tableProperties?: SpaceProperty[]
  ): BarChartData {
    const data: BarChartDataPoint[] = [];
    const categoriesSet = new Set<string | number>();
    const seriesSet = new Set<string>();

    // Convert to flat array
    aggregatedData.forEach((seriesMap, category) => {
      categoriesSet.add(category);
      
      seriesMap.forEach((value, series) => {
        seriesSet.add(series);
        
        data.push({
          category,
          value,
          series: seriesField ? series : undefined,
          stack: isStacked && seriesField ? 'stack1' : undefined,
          metadata: {
            [xField]: category,
            [yField]: value,
            ...(seriesField ? { [seriesField]: series } : {})
          }
        });
      });
    });

    // Sort categories for consistent ordering
    // Find field definition for proper option field sorting
    const xFieldDef = tableProperties?.find(p => p.name === xField);
    
    const categories = sortUniqueValues(
      Array.from(categoriesSet).map(String),
      xFieldDef
    ).map(cat => {
      // Try to convert back to number if it was originally numeric
      const num = Number(cat);
      return !isNaN(num) && categoriesSet.has(num) ? num : cat;
    });

    // Sort series using field definition if available
    const seriesFieldDef = seriesField ? tableProperties?.find(p => p.name === seriesField) : undefined;
    const series = seriesField ? sortUniqueValues(
      Array.from(seriesSet).map(String),
      seriesFieldDef
    ) : undefined;
    
    // Calculate y extent from aggregated values
    let minY = 0; // Bars typically start from 0
    let maxY = 0;
    
    if (isStacked && seriesField) {
      // For stacked bars, calculate cumulative totals per category
      const stackTotals = new Map<string | number, number>();
      data.forEach(d => {
        const current = stackTotals.get(d.category) || 0;
        stackTotals.set(d.category, current + Math.max(0, d.value));
      });
      maxY = Math.max(...Array.from(stackTotals.values()));
    } else {
      // For regular bars, find min and max values
      data.forEach(d => {
        minY = Math.min(minY, d.value);
        maxY = Math.max(maxY, d.value);
      });
    }

    return {
      data,
      categories,
      series,
      stacks: isStacked && seriesField ? ['stack1'] : undefined,
      yExtent: [minY, maxY]
    };
  }

  /**
   * Calculate stack positions for stacked bar charts
   * This should be called during rendering phase
   */
  static calculateStackPositions(data: BarChartData): BarChartData {
    if (!data.stacks || data.stacks.length === 0) {
      return data;
    }

    const stackedData = [...data.data];
    const categoryStacks = new Map<string, Map<string, number>>();

    // Initialize stack bases
    data.categories.forEach(category => {
      categoryStacks.set(String(category), new Map());
      data.stacks!.forEach(stack => {
        categoryStacks.get(String(category))!.set(stack, 0);
      });
    });

    // Calculate cumulative positions
    stackedData.forEach(point => {
      if (point.stack) {
        const categoryStack = categoryStacks.get(String(point.category))!;
        const currentBase = categoryStack.get(point.stack) || 0;
        
        // Store the base position
        (point as any).y0 = currentBase;
        (point as any).y1 = currentBase + point.value;
        
        // Update the base for next item in stack
        categoryStack.set(point.stack, currentBase + point.value);
      }
    });

    return { ...data, data: stackedData };
  }
}