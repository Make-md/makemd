import i18n from "shared/i18n";

import { VisualizationConfig } from "shared/types/visualization";
import { PieChartData, PieChartDataPoint, AggregationType } from "../types/ChartDataSchemas";

/**
 * Transforms raw data into the format expected by pie chart renderer
 */
export class PieChartTransformer {
  /**
   * Main transformation function
   */
  static transform(
    rawData: Record<string, unknown>[],
    config: VisualizationConfig
  ): PieChartData {
    if (!rawData || rawData.length === 0) {
      return { data: [], total: 0 };
    }

    // Pie charts can use either x or color encoding for categories
    const categoryEncoding = config.encoding.color || 
      (Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x);
    const valueEncoding = Array.isArray(config.encoding.y) ? config.encoding.y[0] : config.encoding.y;
    
    if (!categoryEncoding?.field || !valueEncoding?.field) {
      return { data: [], total: 0 };
    }

    // Check if data is already aggregated (has _aggregatedCount marker from processDataAggregation)
    const isPreAggregated = rawData.some(d => '_aggregatedCount' in d);
    
    let aggregatedData: Map<string, number>;
    
    if (isPreAggregated) {
      // Data is already aggregated, just convert to Map format
      aggregatedData = new Map();
      rawData.forEach(record => {
        const category = String(record[categoryEncoding.field] || 'undefined');
        const value = Number(record[valueEncoding.field]) || 0;
        aggregatedData.set(category, value);
      });
    } else {
      // Aggregate data by category
      const aggregationType = valueEncoding.aggregate || 'sum';
      aggregatedData = this.aggregateData(
        rawData,
        categoryEncoding.field,
        valueEncoding.field,
        aggregationType
      );
    }

    // Convert to pie chart format
    const chartData = this.convertToPieFormat(
      aggregatedData,
      categoryEncoding.field,
      valueEncoding.field
    );

    // Sort by value if specified
    const transformArray = Array.isArray(config.transform) ? config.transform : [];
    const sortTransform = transformArray.find(t => t.type === 'sort');
    const limitTransform = transformArray.find(t => t.type === 'limit');
    
    if (sortTransform?.options?.order === 'descending') {
      chartData.data.sort((a, b) => b.value - a.value);
    } else if (sortTransform?.options?.order === 'ascending') {
      chartData.data.sort((a, b) => a.value - b.value);
    }

    // Apply limit if specified
    if (limitTransform?.options?.count && limitTransform.options.count > 0) {
      const limited = chartData.data.slice(0, limitTransform.options.count);
      const others = chartData.data.slice(limitTransform.options.count);
      
      if (others.length > 0) {
        const othersValue = others.reduce((sum, item) => sum + item.value, 0);
        const othersPercentage = (othersValue / chartData.total) * 100;
        
        limited.push({
          label: i18n.labels.others,
          value: othersValue,
          percentage: othersPercentage,
          metadata: {
            [categoryEncoding.field]: i18n.labels.others,
            [valueEncoding.field]: othersValue,
            count: others.length
          }
        });
      }
      
      chartData.data = limited;
    }

    return chartData;
  }

  /**
   * Aggregate data by category
   */
  private static aggregateData(
    data: Record<string, unknown>[],
    categoryField: string,
    valueField: string,
    aggregation: AggregationType = 'sum'
  ): Map<string, number> {
    const grouped = new Map<string, number[]>();

    // Group values by category
    data.forEach(record => {
      const category = String(record[categoryField] || 'undefined');
      const value = Number(record[valueField]) || 0;

      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      
      grouped.get(category)!.push(value);
    });

    // Apply aggregation
    const aggregated = new Map<string, number>();
    
    grouped.forEach((values, category) => {
      const aggregatedValue = this.aggregate(values, aggregation);
      aggregated.set(category, aggregatedValue);
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
   * Convert aggregated data to pie chart format
   */
  private static convertToPieFormat(
    aggregatedData: Map<string, number>,
    categoryField: string,
    valueField: string
  ): PieChartData {
    const data: PieChartDataPoint[] = [];
    let total = 0;

    // Calculate total for percentages
    aggregatedData.forEach(value => {
      if (value > 0) { // Only include positive values in pie charts
        total += value;
      }
    });

    // Convert to pie chart points
    aggregatedData.forEach((value, category) => {
      if (value > 0) { // Only include positive values
        const percentage = total > 0 ? (value / total) * 100 : 0;
        
        data.push({
          label: category,
          value,
          percentage,
          metadata: {
            [categoryField]: category,
            [valueField]: value
          }
        });
      }
    });

    return { data, total };
  }

  /**
   * Calculate angles for pie slices
   * This should be called during rendering phase
   */
  static calculateAngles(data: PieChartData, startAngle = 0): PieChartData {
    const dataWithAngles = [...data.data];
    let currentAngle = startAngle;

    dataWithAngles.forEach(point => {
      const angleSize = (point.percentage / 100) * 360;
      (point as any).startAngle = currentAngle;
      (point as any).endAngle = currentAngle + angleSize;
      (point as any).midAngle = currentAngle + angleSize / 2;
      currentAngle += angleSize;
    });

    return { ...data, data: dataWithAngles };
  }
}