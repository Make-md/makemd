import { VisualizationConfig } from "shared/types/visualization";
import { LineChartData, LineChartDataPoint, AggregationType } from "../types/ChartDataSchemas";
import { SpaceProperty } from "shared/types/mdb";
import { sortUniqueValues } from "../utils/sortingUtils";
import { ensureCorrectEncodingType } from "../utils/inferEncodingType";

/**
 * Transforms raw data into the format expected by line chart renderer
 */
export class LineChartTransformer {
  /**
   * Main transformation function
   */
  static transform(
    rawData: Record<string, unknown>[],
    config: VisualizationConfig,
    tableProperties?: SpaceProperty[]
  ): LineChartData {
    if (!rawData || rawData.length === 0) {
      return { data: [], series: [], xDomain: [], yExtent: [0, 0] };
    }

    let xEncodings = Array.isArray(config.encoding.x) ? config.encoding.x : [config.encoding.x];
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : [config.encoding.y];
    const colorEncoding = config.encoding.color;
    
    // Ensure correct encoding types for x-axis
    if (xEncodings[0] && tableProperties) {
      const xProperty = tableProperties.find(p => p.name === xEncodings[0].field);
      const xValues = rawData.map(d => d[xEncodings[0].field]);
      xEncodings[0] = ensureCorrectEncodingType(xEncodings[0], xProperty, xValues);
      
      // Set default timeUnit to 'day' for temporal fields if not specified
      if (xEncodings[0].type === 'temporal' && !xEncodings[0].timeUnit) {
        xEncodings[0] = { ...xEncodings[0], timeUnit: 'day' };
      }
    }
    
    // Handle multiple Y fields or color-based series
    const hasMultipleYFields = yEncodings.length > 1;
    const seriesField = colorEncoding?.field;
    
    let transformedData: LineChartDataPoint[] = [];
    let allXValues = new Set<string | number | Date>();
    let minY = Infinity;
    let maxY = -Infinity;
    const seriesSet = new Set<string>();

    if (hasMultipleYFields) {
      // Multiple Y fields: each Y field is a separate series
      transformedData = this.transformMultipleYFields(
        rawData,
        xEncodings,
        yEncodings,
        allXValues,
        seriesSet
      );
    } else if (seriesField) {
      // Single Y field with color grouping
      transformedData = this.transformWithColorGrouping(
        rawData,
        xEncodings[0],
        yEncodings[0],
        seriesField,
        allXValues,
        seriesSet
      );
    } else {
      // Single series line
      transformedData = this.transformSingleSeries(
        rawData,
        xEncodings[0],
        yEncodings[0],
        allXValues,
        seriesSet
      );
    }

    // Calculate Y extent
    transformedData.forEach(point => {
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });

    // Fill missing data points with zeros for categorical or temporal x-axis
    if (xEncodings[0]) {
      if (xEncodings[0].type === 'ordinal' || xEncodings[0].type === 'nominal') {
        transformedData = this.fillMissingCategoricalPoints(
          transformedData,
          Array.from(allXValues),
          Array.from(seriesSet),
          xEncodings[0].field
        );
      } else if (xEncodings[0].type === 'temporal' && xEncodings[0].timeUnit && allXValues.size > 0) {
        // For temporal data, generate complete date range
        const dates = Array.from(allXValues).filter(d => d instanceof Date) as Date[];
        if (dates.length > 0) {
          const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
          const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
          
          // Generate complete date range based on time unit
          const completeDateRange = this.generateDateRange(
            this.groupDateByTimeUnit(minDate, xEncodings[0].timeUnit),
            this.groupDateByTimeUnit(maxDate, xEncodings[0].timeUnit),
            xEncodings[0].timeUnit
          );
          
          // Fill missing points
          transformedData = this.fillMissingCategoricalPoints(
            transformedData,
            completeDateRange,
            Array.from(seriesSet),
            xEncodings[0].field
          );
          
          // Update allXValues to include all dates in range
          completeDateRange.forEach(date => allXValues.add(date));
        }
      }
    }

    // Sort data by x value within each series
    transformedData = this.sortData(transformedData, xEncodings[0]);

    // Convert x domain to sorted array
    const xDomain = this.sortXDomain(Array.from(allXValues), xEncodings[0], tableProperties);

    return {
      data: transformedData,
      series: Array.from(seriesSet).sort(),
      xDomain,
      yExtent: [minY === Infinity ? 0 : minY, maxY === -Infinity ? 0 : maxY]
    };
  }

  /**
   * Transform data with multiple Y fields
   */
  private static transformMultipleYFields(
    data: Record<string, unknown>[],
    xEncodings: any[],
    yEncodings: any[],
    allXValues: Set<string | number | Date>,
    seriesSet: Set<string>
  ): LineChartDataPoint[] {
    const result: LineChartDataPoint[] = [];

    yEncodings.forEach((yEncoding, index) => {
      if (!yEncoding?.field) return;
      
      const xEncoding = xEncodings[Math.min(index, xEncodings.length - 1)];
      if (!xEncoding?.field) return;

      const seriesName = yEncoding.field;
      seriesSet.add(seriesName);
      const aggregationType = yEncoding.aggregate || 'mean';

      // Special handling for count/distinct - just count records per x-value
      if (aggregationType === 'count' || aggregationType === 'distinct') {
        const countMap = new Map<string, { xValue: string | number | Date, count: number, values: Set<any> }>();
        
        data.forEach(record => {
          const xValue = this.normalizeXValue(record[xEncoding.field], xEncoding.type, xEncoding.timeUnit);
          
          if (xValue !== null) {
            allXValues.add(xValue);
            const groupKey = xValue instanceof Date ? xValue.getTime().toString() : String(xValue);
            
            if (!countMap.has(groupKey)) {
              countMap.set(groupKey, { xValue, count: 0, values: new Set() });
            }
            
            const group = countMap.get(groupKey)!;
            group.count++;
            
            if (aggregationType === 'distinct') {
              const yValue = record[yEncoding.field];
              if (yValue != null) {
                group.values.add(String(yValue));
              }
            }
          }
        });
        
        countMap.forEach(({ xValue, count, values }) => {
          const aggregatedValue = aggregationType === 'distinct' ? values.size : count;
          result.push({
            x: xValue,
            y: aggregatedValue,
            series: seriesName,
            metadata: {
              [xEncoding.field]: xValue,
              [yEncoding.field]: aggregatedValue
            }
          });
        });
        
        return;
      }

      // Normal numeric aggregation
      const grouped = new Map<string, { xValue: string | number | Date, yValues: number[] }>();

      data.forEach(record => {
        const xValue = this.normalizeXValue(record[xEncoding.field], xEncoding.type, xEncoding.timeUnit);
        const yValue = Number(record[yEncoding.field]) || 0;
        
        if (xValue !== null && !isNaN(yValue)) {
          allXValues.add(xValue);
          
          const groupKey = xValue instanceof Date ? xValue.getTime().toString() : String(xValue);
          
          if (!grouped.has(groupKey)) {
            grouped.set(groupKey, { xValue, yValues: [] });
          }
          grouped.get(groupKey)!.yValues.push(yValue);
        }
      });

      grouped.forEach(({ xValue, yValues }) => {
        const aggregatedValue = this.aggregate(yValues, aggregationType);
        result.push({
          x: xValue,
          y: aggregatedValue,
          series: seriesName,
          metadata: {
            [xEncoding.field]: xValue,
            [yEncoding.field]: aggregatedValue
          }
        });
      });
    });

    return result;
  }

  /**
   * Transform data with color-based grouping
   */
  private static transformWithColorGrouping(
    data: Record<string, unknown>[],
    xEncoding: any,
    yEncoding: any,
    seriesField: string,
    allXValues: Set<string | number | Date>,
    seriesSet: Set<string>
  ): LineChartDataPoint[] {
    const result: LineChartDataPoint[] = [];
    
    if (!xEncoding?.field || !yEncoding?.field) {
      return result;
    }

    const aggregationType = yEncoding.aggregate || 'mean';

    // Special handling for count/distinct - just count records per x-value and series
    if (aggregationType === 'count' || aggregationType === 'distinct') {
      const countMap = new Map<string, Map<string, { xValue: string | number | Date, count: number, values: Set<any> }>>();
      
      data.forEach(record => {
        const xValue = this.normalizeXValue(record[xEncoding.field], xEncoding.type, xEncoding.timeUnit);
        const series = String(record[seriesField] || 'default');
        
        if (xValue !== null) {
          allXValues.add(xValue);
          seriesSet.add(series);
          
          if (!countMap.has(series)) {
            countMap.set(series, new Map());
          }
          const seriesGroup = countMap.get(series)!;
          const groupKey = xValue instanceof Date ? xValue.getTime().toString() : String(xValue);
          
          if (!seriesGroup.has(groupKey)) {
            seriesGroup.set(groupKey, { xValue, count: 0, values: new Set() });
          }
          
          const group = seriesGroup.get(groupKey)!;
          group.count++;
          
          if (aggregationType === 'distinct') {
            const yValue = record[yEncoding.field];
            if (yValue != null) {
              group.values.add(String(yValue));
            }
          }
        }
      });
      
      countMap.forEach((seriesData, series) => {
        seriesData.forEach(({ xValue, count, values }) => {
          const aggregatedValue = aggregationType === 'distinct' ? values.size : count;
          result.push({
            x: xValue,
            y: aggregatedValue,
            series,
            metadata: {
              [xEncoding.field]: xValue,
              [yEncoding.field]: aggregatedValue,
              [seriesField]: series
            }
          });
        });
      });
      
      return result;
    }

    // Normal numeric aggregation
    const grouped = new Map<string, Map<string, { xValue: string | number | Date, yValues: number[] }>>();
    
    data.forEach(record => {
      const xValue = this.normalizeXValue(record[xEncoding.field], xEncoding.type, xEncoding.timeUnit);
      const yValue = Number(record[yEncoding.field]) || 0;
      const series = String(record[seriesField] || 'default');
      
      if (xValue !== null && !isNaN(yValue)) {
        allXValues.add(xValue);
        seriesSet.add(series);
        
        if (!grouped.has(series)) {
          grouped.set(series, new Map());
        }
        const seriesGroup = grouped.get(series)!;
        
        const groupKey = xValue instanceof Date ? xValue.getTime().toString() : String(xValue);
        
        if (!seriesGroup.has(groupKey)) {
          seriesGroup.set(groupKey, { xValue, yValues: [] });
        }
        seriesGroup.get(groupKey)!.yValues.push(yValue);
      }
    });

    grouped.forEach((seriesData, series) => {
      seriesData.forEach(({ xValue, yValues }) => {
        const aggregatedValue = this.aggregate(yValues, aggregationType);
        result.push({
          x: xValue,
          y: aggregatedValue,
          series,
          metadata: {
            [xEncoding.field]: xValue,
            [yEncoding.field]: aggregatedValue,
            [seriesField]: series
          }
        });
      });
    });

    return result;
  }

  /**
   * Transform single series data
   */
  private static transformSingleSeries(
    data: Record<string, unknown>[],
    xEncoding: any,
    yEncoding: any,
    allXValues: Set<string | number | Date>,
    seriesSet: Set<string>
  ): LineChartDataPoint[] {
    const result: LineChartDataPoint[] = [];
    
    if (!xEncoding?.field || !yEncoding?.field) {
      return result;
    }

    const seriesName = yEncoding.field;
    seriesSet.add(seriesName);
    const aggregationType = yEncoding.aggregate || 'mean';

    // Special handling for count/distinct - just count records per x-value
    if (aggregationType === 'count' || aggregationType === 'distinct') {
      const countMap = new Map<string, { xValue: string | number | Date, count: number, values: Set<any> }>();
      
      data.forEach(record => {
        const xValue = this.normalizeXValue(record[xEncoding.field], xEncoding.type, xEncoding.timeUnit);
        
        if (xValue !== null) {
          allXValues.add(xValue);
          const groupKey = xValue instanceof Date ? xValue.getTime().toString() : String(xValue);
          
          if (!countMap.has(groupKey)) {
            countMap.set(groupKey, { xValue, count: 0, values: new Set() });
          }
          
          const group = countMap.get(groupKey)!;
          group.count++;
          
          if (aggregationType === 'distinct') {
            const yValue = record[yEncoding.field];
            if (yValue != null) {
              group.values.add(String(yValue));
            }
          }
        }
      });
      
      countMap.forEach(({ xValue, count, values }) => {
        const aggregatedValue = aggregationType === 'distinct' ? values.size : count;
        result.push({
          x: xValue,
          y: aggregatedValue,
          series: seriesName,
          metadata: {
            [xEncoding.field]: xValue,
            [yEncoding.field]: aggregatedValue
          }
        });
      });
      
      return result;
    }

    // Normal numeric aggregation
    const grouped = new Map<string, { xValue: string | number | Date, yValues: number[] }>();
    
    data.forEach(record => {
      const xValue = this.normalizeXValue(record[xEncoding.field], xEncoding.type, xEncoding.timeUnit);
      const yValue = Number(record[yEncoding.field]) || 0;
      
      if (xValue !== null && !isNaN(yValue)) {
        allXValues.add(xValue);
        
        const groupKey = xValue instanceof Date ? xValue.getTime().toString() : String(xValue);
        
        if (!grouped.has(groupKey)) {
          grouped.set(groupKey, { xValue, yValues: [] });
        }
        grouped.get(groupKey)!.yValues.push(yValue);
      }
    });

    grouped.forEach(({ xValue, yValues }) => {
      const aggregatedValue = this.aggregate(yValues, aggregationType);
      result.push({
        x: xValue,
        y: aggregatedValue,
        series: seriesName,
        metadata: {
          [xEncoding.field]: xValue,
          [yEncoding.field]: aggregatedValue
        }
      });
    });

    return result;
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
   * Fill missing categorical points with zeros
   */
  private static fillMissingCategoricalPoints(
    data: LineChartDataPoint[],
    allCategories: (string | number | Date)[],
    allSeries: string[],
    xField: string
  ): LineChartDataPoint[] {
    const existingPoints = new Set(
      data.map(d => {
        // For dates, use timestamp for consistent comparison
        const key = d.x instanceof Date ? d.x.getTime() : d.x;
        return `${d.series}:${key}`;
      })
    );
    
    const filledData = [...data];
    
    allSeries.forEach(series => {
      allCategories.forEach(category => {
        const key = category instanceof Date ? category.getTime() : category;
        const pointKey = `${series}:${key}`;
        if (!existingPoints.has(pointKey)) {
          filledData.push({
            x: category,
            y: 0,
            series,
            metadata: {
              [xField]: category,
              isFilled: true
            }
          });
        }
      });
    });
    
    return filledData;
  }

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
   * Normalize X values based on type
   */
  private static normalizeXValue(
    value: unknown,
    type: string,
    timeUnit?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  ): string | number | Date | null {
    if (value == null) return null;
    
    switch (type) {
      case 'temporal':
        const date = value instanceof Date ? value : new Date(String(value));
        if (isNaN(date.getTime())) return null;
        return timeUnit ? this.groupDateByTimeUnit(date, timeUnit) : date;
      case 'quantitative':
        const num = Number(value);
        return isNaN(num) ? null : num;
      case 'ordinal':
      case 'nominal':
      default:
        return String(value);
    }
  }

  /**
   * Sort data by x value
   */
  private static sortData(
    data: LineChartDataPoint[],
    xEncoding: any
  ): LineChartDataPoint[] {
    return data.sort((a, b) => {
      if (xEncoding?.type === 'temporal') {
        return (a.x as Date).getTime() - (b.x as Date).getTime();
      } else if (xEncoding?.type === 'quantitative') {
        return (a.x as number) - (b.x as number);
      } else {
        return String(a.x).localeCompare(String(b.x), undefined, { numeric: true });
      }
    });
  }

  /**
   * Sort X domain values
   */
  private static sortXDomain(
    domain: (string | number | Date)[],
    xEncoding: any,
    tableProperties?: SpaceProperty[]
  ): (string | number | Date)[] {
    // Find field definition for proper sorting
    const xFieldDef = tableProperties?.find(p => p.name === xEncoding?.field);
    
    if (xFieldDef && (xFieldDef.type === 'option' || xFieldDef.type === 'option-multi')) {
      // Use sortUniqueValues which respects option ordering
      const sorted = sortUniqueValues(
        domain.map(String),
        xFieldDef
      );
      // Convert back to original types if needed
      return sorted.map(val => {
        const original = domain.find(d => String(d) === val);
        return original !== undefined ? original : val;
      });
    }
    
    return domain.sort((a, b) => {
      if (xEncoding?.type === 'temporal') {
        return (a as Date).getTime() - (b as Date).getTime();
      } else if (xEncoding?.type === 'quantitative') {
        return (a as number) - (b as number);
      } else {
        return String(a).localeCompare(String(b), undefined, { numeric: true });
      }
    });
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
}