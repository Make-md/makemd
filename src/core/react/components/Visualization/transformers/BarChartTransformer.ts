import { SpaceProperty } from "shared/types/mdb";
import { VisualizationConfig } from "shared/types/visualization";
import { AggregationType, BarChartData, BarChartDataPoint } from "../types/ChartDataSchemas";
import { sortUniqueValues } from "../utils/sortingUtils";
import { ensureCorrectEncodingType } from "../utils/inferEncodingType";

/**
 * Transforms raw data into the format expected by bar chart renderer
 */
export class BarChartTransformer {
  /**
   * Group date by time unit
   */
  private static groupDateByTimeUnit(
    date: Date,
    timeUnit?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  ): Date {
    if (!timeUnit || timeUnit === 'day') {
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }
    
    switch (timeUnit) {
      case 'hour':
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours()));
      case 'week': {
        const day = date.getUTCDay();
        const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff));
      }
      case 'month':
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
      case 'quarter': {
        const quarter = Math.floor(date.getUTCMonth() / 3);
        return new Date(Date.UTC(date.getUTCFullYear(), quarter * 3, 1));
      }
      case 'year':
        return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      default:
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }
  }

  /**
   * Generate complete date range based on time unit
   */
  private static generateDateRange(
    startDate: Date,
    endDate: Date,
    timeUnit: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  ): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      
      switch (timeUnit) {
        case 'hour':
          current.setUTCHours(current.getUTCHours() + 1);
          break;
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'quarter':
          current.setMonth(current.getMonth() + 3);
          break;
        case 'year':
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
    }
    
    return dates;
  }

  /**
   * Normalize X values based on type and time unit
   */
  private static normalizeXValue(
    value: unknown,
    type: string,
    timeUnit?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  ): string {
    if (value == null) return 'undefined';
    
    if (type === 'temporal') {
      const date = value instanceof Date ? value : new Date(String(value));
      if (isNaN(date.getTime())) return String(value);
      
      const grouped = timeUnit ? this.groupDateByTimeUnit(date, timeUnit) : date;
      return grouped.getTime().toString();
    }
    
    return String(value);
  }

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

    let xEncoding = Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x;
    const yEncoding = Array.isArray(config.encoding.y) ? config.encoding.y[0] : config.encoding.y;
    const colorEncoding = config.encoding.color;
    
    if (!xEncoding?.field || !yEncoding?.field) {
      return { data: [], categories: [] };
    }

    // Ensure correct encoding type for x-axis (detect temporal fields)
    if (xEncoding && tableProperties) {
      const xProperty = tableProperties.find(p => p.name === xEncoding.field);
      const xValues = rawData.map(d => d[xEncoding.field]);
      xEncoding = ensureCorrectEncodingType(xEncoding, xProperty, xValues);
    }

    // Set default timeUnit to 'day' for temporal fields if not specified
    if (xEncoding.type === 'temporal' && !xEncoding.timeUnit) {
      xEncoding = { ...xEncoding, timeUnit: 'day' };
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
    let aggregatedData = this.aggregateData(
      rawData,
      xEncoding.field,
      yEncoding.field,
      seriesField,
      aggregationType,
      isYFieldOption,
      xEncoding.type,
      xEncoding.timeUnit
    );

    // Fill missing dates with zeros for temporal x-axis
    if (xEncoding.type === 'temporal' && xEncoding.timeUnit) {
      aggregatedData = this.fillMissingDates(
        aggregatedData,
        rawData,
        xEncoding.field,
        xEncoding.timeUnit,
        seriesField
      );
    }

    // Convert to bar chart format
    const chartData = this.convertToBarFormat(
      aggregatedData,
      xEncoding.field,
      yEncoding.field,
      seriesField,
      isStacked,
      tableProperties,
      xEncoding.type
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
    isYFieldOption: boolean = false,
    xFieldType?: string,
    timeUnit?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  ): Map<string, Map<string, number>> {
    // For counting option values or other non-numeric fields
    if (aggregation === 'count' || aggregation === 'distinct' || isYFieldOption) {
      const countMap = new Map<string, Map<string, number>>();
      
      // When yField is an option field, we want to count occurrences of each option value per category
      if (isYFieldOption) {
        // Group by x-axis category and count each option value
        data.forEach(record => {
          const category = this.normalizeXValue(record[xField], xFieldType || 'nominal', timeUnit);
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
          const category = this.normalizeXValue(record[xField], xFieldType || 'nominal', timeUnit);
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
      const category = this.normalizeXValue(record[xField], xFieldType || 'nominal', timeUnit);
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
   * Fill missing dates with zeros
   */
  private static fillMissingDates(
    aggregatedData: Map<string, Map<string, number>>,
    rawData: Record<string, unknown>[],
    xField: string,
    timeUnit: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year',
    seriesField?: string
  ): Map<string, Map<string, number>> {
    // Extract all dates from raw data
    const dates = rawData
      .map(record => {
        const value = record[xField];
        if (value == null) return null;
        const date = value instanceof Date ? value : new Date(String(value));
        return isNaN(date.getTime()) ? null : date;
      })
      .filter((d): d is Date => d !== null);

    if (dates.length === 0) return aggregatedData;

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Generate complete date range
    const completeDateRange = this.generateDateRange(
      this.groupDateByTimeUnit(minDate, timeUnit),
      this.groupDateByTimeUnit(maxDate, timeUnit),
      timeUnit
    );

    // Get all series
    const allSeries = new Set<string>();
    aggregatedData.forEach((seriesMap) => {
      seriesMap.forEach((_, series) => allSeries.add(series));
    });

    // Fill missing dates
    completeDateRange.forEach(date => {
      const dateKey = date.getTime().toString();
      if (!aggregatedData.has(dateKey)) {
        aggregatedData.set(dateKey, new Map());
      }
      const seriesMap = aggregatedData.get(dateKey)!;
      allSeries.forEach(series => {
        if (!seriesMap.has(series)) {
          seriesMap.set(series, 0);
        }
      });
    });

    return aggregatedData;
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
    tableProperties?: SpaceProperty[],
    xFieldType?: string
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
      // For temporal fields, convert timestamp strings back to Date objects
      if (xFieldType === 'temporal') {
        const num = Number(cat);
        if (!isNaN(num)) {
          return new Date(num);
        }
      }
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
      const stackTotals = new Map<string | number | Date, number>();
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