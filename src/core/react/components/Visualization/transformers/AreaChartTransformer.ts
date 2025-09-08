import { VisualizationConfig } from "shared/types/visualization";
import { AreaChartData, AreaChartDataPoint, AggregationType } from "../types/ChartDataSchemas";
import { SpaceProperty } from "shared/types/mdb";
import { sortUniqueValues } from "../utils/sortingUtils";

/**
 * Transforms raw data into the format expected by area chart renderer
 * Area charts are similar to line charts but support stacking
 */
export class AreaChartTransformer {
  /**
   * Main transformation function
   */
  static transform(
    rawData: Record<string, unknown>[],
    config: VisualizationConfig,
    tableProperties?: SpaceProperty[]
  ): AreaChartData {
    if (!rawData || rawData.length === 0) {
      return { data: [], series: [], xDomain: [], yExtent: [0, 0], stacked: false };
    }

    const xEncodings = Array.isArray(config.encoding.x) ? config.encoding.x : [config.encoding.x];
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : [config.encoding.y];
    const colorEncoding = config.encoding.color;
    const isStacked = config.mark?.stack === true;
    
    // Handle multiple Y fields or color-based series
    const hasMultipleYFields = yEncodings.length > 1;
    const seriesField = colorEncoding?.field;
    
    let transformedData: AreaChartDataPoint[] = [];
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
      // Single series area
      transformedData = this.transformSingleSeries(
        rawData,
        xEncodings[0],
        yEncodings[0],
        allXValues,
        seriesSet
      );
    }

    // Fill missing data points with zeros for complete areas
    transformedData = this.fillMissingPoints(
      transformedData,
      Array.from(allXValues),
      Array.from(seriesSet),
      xEncodings[0]
    );

    // Sort data by x value within each series
    transformedData = this.sortData(transformedData, xEncodings[0]);

    // Calculate stacking if needed (done in rendering phase)
    if (isStacked && seriesSet.size > 1) {
      // Stack positions will be calculated during rendering
      transformedData.forEach(point => {
        point.y0 = 0; // Initialize base position
      });
    }

    // Calculate Y extent (accounting for stacking if needed)
    if (isStacked) {
      // For stacked areas, calculate cumulative max
      const xTotals = new Map<string | number | Date, number>();
      transformedData.forEach(point => {
        const current = xTotals.get(point.x) || 0;
        xTotals.set(point.x, current + point.y);
      });
      minY = 0; // Stacked areas typically start from 0
      maxY = Math.max(...Array.from(xTotals.values()));
    } else {
      transformedData.forEach(point => {
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
    }

    // Convert x domain to sorted array
    const xDomain = this.sortXDomain(Array.from(allXValues), xEncodings[0], tableProperties);

    return {
      data: transformedData,
      series: Array.from(seriesSet).sort(),
      xDomain,
      yExtent: [minY === Infinity ? 0 : minY, maxY === -Infinity ? 0 : maxY],
      stacked: isStacked
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
  ): AreaChartDataPoint[] {
    const result: AreaChartDataPoint[] = [];

    yEncodings.forEach((yEncoding, index) => {
      if (!yEncoding?.field) return;
      
      const xEncoding = xEncodings[Math.min(index, xEncodings.length - 1)];
      if (!xEncoding?.field) return;

      const seriesName = yEncoding.field;
      seriesSet.add(seriesName);

      // Group by x value for aggregation
      const grouped = new Map<string | number | Date, number[]>();

      data.forEach(record => {
        const xValue = this.normalizeXValue(record[xEncoding.field], xEncoding.type);
        const yValue = Number(record[yEncoding.field]) || 0;
        
        if (xValue !== null && !isNaN(yValue)) {
          allXValues.add(xValue);
          
          if (!grouped.has(xValue)) {
            grouped.set(xValue, []);
          }
          grouped.get(xValue)!.push(yValue);
        }
      });

      // Aggregate and convert to points
      grouped.forEach((values, xValue) => {
        const aggregatedValue = this.aggregate(values, yEncoding.aggregate || 'sum');
        result.push({
          x: xValue,
          y: aggregatedValue,
          y0: 0,
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
  ): AreaChartDataPoint[] {
    const result: AreaChartDataPoint[] = [];
    
    if (!xEncoding?.field || !yEncoding?.field) {
      return result;
    }

    // Group by series and aggregate if needed
    const grouped = new Map<string, Map<string | number | Date, number[]>>();
    
    data.forEach(record => {
      const xValue = this.normalizeXValue(record[xEncoding.field], xEncoding.type);
      const yValue = Number(record[yEncoding.field]) || 0;
      const series = String(record[seriesField] || 'default');
      
      if (xValue !== null && !isNaN(yValue)) {
        allXValues.add(xValue);
        seriesSet.add(series);
        
        if (!grouped.has(series)) {
          grouped.set(series, new Map());
        }
        const seriesGroup = grouped.get(series)!;
        
        if (!seriesGroup.has(xValue)) {
          seriesGroup.set(xValue, []);
        }
        seriesGroup.get(xValue)!.push(yValue);
      }
    });

    // Aggregate and convert to points
    grouped.forEach((seriesData, series) => {
      seriesData.forEach((values, xValue) => {
        const aggregatedValue = this.aggregate(values, yEncoding.aggregate || 'sum');
        result.push({
          x: xValue,
          y: aggregatedValue,
          y0: 0,
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
  ): AreaChartDataPoint[] {
    const result: AreaChartDataPoint[] = [];
    
    if (!xEncoding?.field || !yEncoding?.field) {
      return result;
    }

    const seriesName = yEncoding.field;
    seriesSet.add(seriesName);

    // Group by x value for aggregation
    const grouped = new Map<string | number | Date, number[]>();
    
    data.forEach(record => {
      const xValue = this.normalizeXValue(record[xEncoding.field], xEncoding.type);
      const yValue = Number(record[yEncoding.field]) || 0;
      
      if (xValue !== null && !isNaN(yValue)) {
        allXValues.add(xValue);
        
        if (!grouped.has(xValue)) {
          grouped.set(xValue, []);
        }
        grouped.get(xValue)!.push(yValue);
      }
    });

    // Aggregate and convert to points
    grouped.forEach((values, xValue) => {
      const aggregatedValue = this.aggregate(values, yEncoding.aggregate || 'sum');
      result.push({
        x: xValue,
        y: aggregatedValue,
        y0: 0,
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
   * Fill missing points to create complete areas
   */
  private static fillMissingPoints(
    data: AreaChartDataPoint[],
    allXValues: (string | number | Date)[],
    allSeries: string[],
    xEncoding: any
  ): AreaChartDataPoint[] {
    const existingPoints = new Set(
      data.map(d => `${d.series}:${d.x}`)
    );
    
    const filledData = [...data];
    
    allSeries.forEach(series => {
      allXValues.forEach(xValue => {
        const key = `${series}:${xValue}`;
        if (!existingPoints.has(key)) {
          filledData.push({
            x: xValue,
            y: 0,
            y0: 0,
            series,
            metadata: {
              [xEncoding.field]: xValue,
              isFilled: true
            }
          });
        }
      });
    });
    
    return filledData;
  }

  /**
   * Calculate stack positions for stacked area charts
   * This should be called during rendering phase
   */
  static calculateStackPositions(data: AreaChartData): AreaChartData {
    if (!data.stacked || data.series.length <= 1) {
      return data;
    }

    const stackedData = [...data.data];
    const xStacks = new Map<string | number | Date, number>();

    // Sort by series to ensure consistent stacking order
    stackedData.sort((a, b) => {
      const seriesCompare = a.series.localeCompare(b.series);
      if (seriesCompare !== 0) return seriesCompare;
      
      // Then sort by x value within series
      if (typeof a.x === 'number' && typeof b.x === 'number') {
        return a.x - b.x;
      }
      return String(a.x).localeCompare(String(b.x));
    });

    // Calculate cumulative positions
    stackedData.forEach(point => {
      const currentBase = xStacks.get(point.x) || 0;
      point.y0 = currentBase;
      xStacks.set(point.x, currentBase + point.y);
    });

    return { ...data, data: stackedData };
  }

  /**
   * Normalize X values based on type
   */
  private static normalizeXValue(
    value: unknown,
    type: string
  ): string | number | Date | null {
    if (value == null) return null;
    
    switch (type) {
      case 'temporal':
        const date = value instanceof Date ? value : new Date(String(value));
        return isNaN(date.getTime()) ? null : date;
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
    data: AreaChartDataPoint[],
    xEncoding: any
  ): AreaChartDataPoint[] {
    return data.sort((a, b) => {
      // First sort by x value
      let xCompare = 0;
      if (xEncoding?.type === 'temporal') {
        xCompare = (a.x as Date).getTime() - (b.x as Date).getTime();
      } else if (xEncoding?.type === 'quantitative') {
        xCompare = (a.x as number) - (b.x as number);
      } else {
        xCompare = String(a.x).localeCompare(String(b.x), undefined, { numeric: true });
      }
      
      if (xCompare !== 0) return xCompare;
      
      // Then sort by series for consistent stacking
      return a.series.localeCompare(b.series);
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
        return values[0];
    }
  }
}