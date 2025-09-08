import { VisualizationConfig } from "shared/types/visualization";
import { SpaceProperty } from "shared/types/mdb";
import {
  BarChartTransformer,
  PieChartTransformer,
  LineChartTransformer,
  AreaChartTransformer,
  ScatterPlotTransformer,
  RadarChartTransformer,
  BarChartData,
  PieChartData,
  LineChartData,
  AreaChartData,
  ScatterPlotData,
  RadarChartData
} from "./transformers";

/**
 * Main data transformation pipeline
 * Orchestrates data transformation based on chart type
 */
export class DataTransformationPipeline {
  /**
   * Transform raw data based on visualization config
   */
  static transform(
    rawData: Record<string, unknown>[],
    config: VisualizationConfig,
    tableProperties?: SpaceProperty[]
  ): TransformedData {
    // Validate input
    if (!rawData || rawData.length === 0) {
      return {
        type: config.chartType,
        data: null,
        error: 'No data provided'
      };
    }

    if (!config.chartType) {
      return {
        type: 'unknown',
        data: null,
        error: 'Chart type not specified'
      };
    }

    try {
      switch (config.chartType) {
        case 'bar':
          return {
            type: 'bar',
            data: BarChartTransformer.transform(rawData, config, tableProperties)
          };

        case 'pie':
          return {
            type: 'pie',
            data: PieChartTransformer.transform(rawData, config)
          };

        case 'line':
          return {
            type: 'line',
            data: LineChartTransformer.transform(rawData, config, tableProperties)
          };

        case 'area':
          return {
            type: 'area',
            data: AreaChartTransformer.transform(rawData, config, tableProperties)
          };

        case 'scatter':
          const scatterResult = ScatterPlotTransformer.transform(rawData, config, tableProperties);
          return {
            type: 'scatter',
            data: scatterResult
          };

        case 'radar':
          return {
            type: 'radar',
            data: RadarChartTransformer.transform(rawData, config, tableProperties)
          };

        // Add more chart types as needed
        case 'heatmap':
        default:
          return {
            type: config.chartType,
            data: null,
            error: `Chart type '${config.chartType}' transformation not yet implemented`
          };
      }
    } catch (error) {
      return {
        type: config.chartType,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown transformation error'
      };
    }
  }

  /**
   * Apply rendering-phase transformations
   * These are transformations that should happen during rendering, not data prep
   */
  static applyRenderingTransformations(
    transformedData: TransformedData
  ): TransformedData {
    if (!transformedData.data) {
      return transformedData;
    }

    try {
      switch (transformedData.type) {
        case 'bar':
          // Apply stacking if needed
          const barData = transformedData.data as BarChartData;
          if (barData.stacks && barData.stacks.length > 0) {
            return {
              ...transformedData,
              data: BarChartTransformer.calculateStackPositions(barData)
            };
          }
          break;

        case 'pie':
          // Calculate angles for pie slices
          const pieData = transformedData.data as PieChartData;
          return {
            ...transformedData,
            data: PieChartTransformer.calculateAngles(pieData)
          };

        case 'area':
          // Apply stacking if needed
          const areaData = transformedData.data as AreaChartData;
          if (areaData.stacked) {
            return {
              ...transformedData,
              data: AreaChartTransformer.calculateStackPositions(areaData)
            };
          }
          break;

        case 'scatter':
          // Calculate scaled sizes if size encoding exists
          const scatterData = transformedData.data as ScatterPlotData;
          if (scatterData.sizeExtent) {
            return {
              ...transformedData,
              data: ScatterPlotTransformer.calculatePointSizes(scatterData)
            };
          }
          break;
      }
    } catch (error) {
      // Silently handle rendering transformation errors
    }

    return transformedData;
  }

  /**
   * Validate configuration against data
   */
  static validateConfig(
    rawData: Record<string, unknown>[],
    config: VisualizationConfig
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if required fields exist in data
    const sampleRecord = rawData[0];
    if (!sampleRecord) {
      errors.push('No data records found');
      return { valid: false, errors, warnings };
    }

    const availableFields = Object.keys(sampleRecord);

    // Check X encoding
    const xEncodings = Array.isArray(config.encoding.x) 
      ? config.encoding.x 
      : [config.encoding.x];
    
    xEncodings.forEach((encoding, index) => {
      if (encoding?.field && !availableFields.includes(encoding.field)) {
        errors.push(`X encoding field '${encoding.field}' not found in data`);
      }
    });

    // Check Y encoding
    const yEncodings = Array.isArray(config.encoding.y) 
      ? config.encoding.y 
      : [config.encoding.y];
    
    yEncodings.forEach((encoding, index) => {
      if (encoding?.field && !availableFields.includes(encoding.field)) {
        errors.push(`Y encoding field '${encoding.field}' not found in data`);
      }
    });

    // Check optional encodings
    if (config.encoding.color?.field && !availableFields.includes(config.encoding.color.field)) {
      warnings.push(`Color encoding field '${config.encoding.color.field}' not found in data`);
    }

    if (config.encoding.size?.field && !availableFields.includes(config.encoding.size.field)) {
      warnings.push(`Size encoding field '${config.encoding.size.field}' not found in data`);
    }

    // Chart-specific validations
    switch (config.chartType) {
      case 'scatter':
        // Scatter plots need quantitative x and y
        if (xEncodings[0]?.type !== 'quantitative' && xEncodings[0]?.type !== 'temporal') {
          warnings.push('Scatter plots work best with quantitative or temporal X axis');
        }
        if (yEncodings[0]?.type !== 'quantitative' && yEncodings[0]?.type !== 'temporal') {
          warnings.push('Scatter plots work best with quantitative or temporal Y axis');
        }
        break;

      case 'pie':
        // Pie charts need categorical and value fields
        if (!config.encoding.color && !config.encoding.x) {
          errors.push('Pie charts require either color or x encoding for categories');
        }
        if (!config.encoding.y) {
          errors.push('Pie charts require y encoding for values');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Result of data transformation
 */
export interface TransformedData {
  type: string;
  data: BarChartData | PieChartData | LineChartData | AreaChartData | ScatterPlotData | RadarChartData | null;
  error?: string;
}

/**
 * Result of configuration validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}