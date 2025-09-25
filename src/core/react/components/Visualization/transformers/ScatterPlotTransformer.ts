import { VisualizationConfig } from "shared/types/visualization";
import { ScatterPlotData, ScatterPlotDataPoint } from "../types/ChartDataSchemas";
import { SpaceProperty } from "shared/types/mdb";
import { ensureCorrectEncodingType } from "../utils/inferEncodingType";

/**
 * Transforms raw data into the format expected by scatter plot renderer
 */
export class ScatterPlotTransformer {
  /**
   * Main transformation function
   */
  static transform(
    rawData: Record<string, unknown>[],
    config: VisualizationConfig,
    tableProperties?: SpaceProperty[]
  ): ScatterPlotData {
    
    if (!rawData || rawData.length === 0) {
      return { 
        data: [], 
        xExtent: [0, 0], 
        yExtent: [0, 0] 
      };
    }

    let xEncoding = Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x;
    let yEncoding = Array.isArray(config.encoding.y) ? config.encoding.y[0] : config.encoding.y;
    
    // Ensure correct encoding types based on field properties
    if (xEncoding && tableProperties) {
      const xProperty = tableProperties.find(p => p.name === xEncoding.field);
      const xValues = rawData.map(d => d[xEncoding.field]);
      xEncoding = ensureCorrectEncodingType(xEncoding, xProperty, xValues);
    }
    
    if (yEncoding && tableProperties) {
      const yProperty = tableProperties.find(p => p.name === yEncoding.field);
      const yValues = rawData.map(d => d[yEncoding.field]);
      yEncoding = ensureCorrectEncodingType(yEncoding, yProperty, yValues);
    }
    
    const sizeEncoding = config.encoding.size;
    const colorEncoding = config.encoding.color;
    
    // Check for empty field strings as well as missing fields
    if (!xEncoding?.field || xEncoding.field === '' || !yEncoding?.field || yEncoding.field === '') {
      
      // Try to use default fields from data if available
      if (rawData && rawData.length > 0) {
        const dataKeys = Object.keys(rawData[0]);
        
        // Look for common x/y field names
        const possibleXFields = ['x', 'X', 'xValue', 'x_value'];
        const possibleYFields = ['y', 'Y', 'yValue', 'y_value', 'value'];
        
        const defaultXField = dataKeys.find(key => possibleXFields.includes(key)) || dataKeys[0];
        const defaultYField = dataKeys.find(key => possibleYFields.includes(key)) || dataKeys[1];
        
        if (defaultXField && defaultYField) {
          // Override with defaults
          if (!xEncoding || !xEncoding.field || xEncoding.field === '') {
            xEncoding = { field: defaultXField, type: 'quantitative' };
          }
          if (!yEncoding || !yEncoding.field || yEncoding.field === '') {
            yEncoding = { field: defaultYField, type: 'quantitative' };
          }
        } else {
          return { 
            data: [], 
            xExtent: [0, 0], 
            yExtent: [0, 0] 
          };
        }
      } else {
        return { 
          data: [], 
          xExtent: [0, 0], 
          yExtent: [0, 0] 
        };
      }
    }

    const transformedData: ScatterPlotDataPoint[] = [];
    const seriesSet = new Set<string>();
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minSize = Infinity, maxSize = -Infinity;
    
    // For categorical data, create a mapping to numeric indices
    const categoricalXMap = new Map<string, number>();
    const categoricalYMap = new Map<string, number>();
    let xIndex = 0;
    let yIndex = 0;
    
    // First pass: build categorical mappings if needed
    try {
      if (xEncoding.type === 'nominal' || xEncoding.type === 'ordinal') {
        const xValues = rawData.map(r => r[xEncoding.field]);
        
        const uniqueXValues = [...new Set(xValues.filter(v => v != null).map(v => String(v)))];
        
        uniqueXValues.forEach((val, idx) => {
          categoricalXMap.set(val, idx);
        });
      }
    } catch (e) {
      // Silently handle X mapping errors
    }
    
    if (yEncoding.type === 'nominal' || yEncoding.type === 'ordinal') {
      const uniqueYValues = [...new Set(rawData.map(r => {
        const val = r[yEncoding.field];
        return val !== null && val !== undefined ? String(val) : null;
      }).filter(v => v !== null))] as string[];
      
      uniqueYValues.forEach(val => {
        categoricalYMap.set(val, yIndex++);
      });
    }

    // Transform each data point
    let skippedCount = 0;
    let processedCount = 0;
    rawData.forEach((record, index) => {
      // Check if the record has the required fields
      const hasXField = xEncoding.field in record;
      const hasYField = yEncoding.field in record;
      
      if (!hasXField || !hasYField) {
        skippedCount++;
        return;
      }
      
      let xValue: number | null;
      let yValue: number | null;
      
      // Handle X value
      if ((xEncoding.type === 'nominal' || xEncoding.type === 'ordinal') && categoricalXMap.size > 0) {
        // Use categorical mapping for nominal/ordinal X
        const xString = String(record[xEncoding.field]);
        xValue = categoricalXMap.get(xString) ?? null;
      } else {
        // Use regular numeric extraction
        xValue = this.extractNumericValue(record[xEncoding.field], xEncoding.type);
      }
      
      // Handle Y value
      if ((yEncoding.type === 'nominal' || yEncoding.type === 'ordinal') && categoricalYMap.size > 0) {
        // Use categorical mapping for nominal/ordinal Y
        const yString = String(record[yEncoding.field]);
        yValue = categoricalYMap.get(yString) ?? null;
      } else {
        // Use regular numeric extraction
        yValue = this.extractNumericValue(record[yEncoding.field], yEncoding.type);
      }
      
      
      // Skip invalid points
      if (xValue === null || yValue === null || isNaN(xValue) || isNaN(yValue)) {
        skippedCount++;
        return;
      }
      
      processedCount++;

      // Extract optional dimensions
      const sizeValue = sizeEncoding?.field 
        ? this.extractNumericValue(record[sizeEncoding.field], 'quantitative')
        : undefined;
      
      const colorValue = colorEncoding?.field 
        ? record[colorEncoding.field]
        : undefined;
      
      // Determine series/group
      const series = colorEncoding?.field 
        ? String(record[colorEncoding.field] || 'default')
        : 'default';
      
      seriesSet.add(series);

      // Update extents
      minX = Math.min(minX, xValue);
      maxX = Math.max(maxX, xValue);
      minY = Math.min(minY, yValue);
      maxY = Math.max(maxY, yValue);
      
      if (sizeValue !== null && sizeValue !== undefined) {
        minSize = Math.min(minSize, sizeValue);
        maxSize = Math.max(maxSize, sizeValue);
      }

      // Create point
      const point: ScatterPlotDataPoint = {
        x: xValue,
        y: yValue,
        series,
        metadata: {
          [xEncoding.field]: record[xEncoding.field],
          [yEncoding.field]: record[yEncoding.field]
        }
      };

      // Add optional properties
      if (sizeValue !== null && sizeValue !== undefined) {
        point.size = sizeValue;
        point.metadata![sizeEncoding.field] = record[sizeEncoding.field];
      }

      if (colorValue !== undefined) {
        point.color = colorEncoding.type === 'quantitative' 
          ? Number(colorValue) || 0
          : String(colorValue);
        point.metadata![colorEncoding.field] = colorValue;
      }

      // Add label if specified
      if (config.mark?.text && typeof config.mark.text === 'string') {
        point.label = String(record[config.mark.text] || '');
      }

      transformedData.push(point);
    });

    // Apply jittering if enabled (for overlapping points)
    const jitteredData = config.mark?.jitter 
      ? this.applyJitter(transformedData, config.mark.jitter)
      : transformedData;

    // Sort by size (largest first) for better rendering order
    if (sizeEncoding?.field) {
      jitteredData.sort((a, b) => (b.size || 0) - (a.size || 0));
    }


    // Adjust extents for categorical data
    let finalXExtent: [number, number];
    let finalYExtent: [number, number];
    
    if (categoricalXMap.size > 0) {
      // For categorical X, extent is from 0 to number of categories - 1
      finalXExtent = [0, Math.max(0, categoricalXMap.size - 1)];
    } else {
      finalXExtent = [
        minX === Infinity ? 0 : minX,
        maxX === -Infinity ? 0 : maxX
      ];
    }
    
    if (categoricalYMap.size > 0) {
      // For categorical Y, extent is from 0 to number of categories - 1
      finalYExtent = [0, Math.max(0, categoricalYMap.size - 1)];
    } else {
      finalYExtent = [
        minY === Infinity ? 0 : minY,
        maxY === -Infinity ? 0 : maxY
      ];
    }
    
    const result = {
      data: jitteredData,
      xExtent: finalXExtent,
      yExtent: finalYExtent,
      sizeExtent: minSize !== Infinity && maxSize !== -Infinity 
        ? [minSize, maxSize] as [number, number]
        : undefined,
      series: Array.from(seriesSet).sort(),
      // Include mappings for reference
      xCategoricalMap: categoricalXMap.size > 0 ? categoricalXMap : undefined,
      yCategoricalMap: categoricalYMap.size > 0 ? categoricalYMap : undefined
    };
    
    return result;
  }

  /**
   * Extract numeric value from data based on encoding type
   */
  private static extractNumericValue(
    value: unknown,
    type?: string
  ): number | null {
    if (value == null || value === '' || value === undefined) return null;

    switch (type) {
      case 'temporal':
        const date = value instanceof Date ? value : new Date(String(value));
        return isNaN(date.getTime()) ? null : date.getTime();
      
      case 'quantitative':
        // Handle various numeric formats
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          // Remove any non-numeric characters except . and -
          const cleanValue = value.replace(/[^0-9.-]/g, '');
          const num = Number(cleanValue);
          return isNaN(num) ? null : num;
        }
        const num = Number(value);
        return isNaN(num) ? null : num;
        
      case 'ordinal':
      case 'nominal':
        // For categorical data in scatter plots, try to convert to number
        // or use index-based positioning
        if (typeof value === 'string') {
          // Try to parse as number first
          const num = parseFloat(value);
          if (!isNaN(num)) return num;
          
          // For non-numeric strings, we can't use them in scatter plot
          // Would need to convert to index, but that's handled by scales
          return null;
        }
        const convertedNum = Number(value);
        return isNaN(convertedNum) ? null : convertedNum;
        
      default:
        // Try to convert to number as fallback
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const cleanValue = value.replace(/[^0-9.-]/g, '');
          const defaultNum = Number(cleanValue || value);
          return isNaN(defaultNum) ? null : defaultNum;
        }
        const defaultNum = Number(value);
        return isNaN(defaultNum) ? null : defaultNum;
    }
  }

  /**
   * Apply jittering to avoid overlapping points
   */
  private static applyJitter(
    data: ScatterPlotDataPoint[],
    jitterAmount: number | boolean | { x?: number; y?: number }
  ): ScatterPlotDataPoint[] {
    const jitterX = typeof jitterAmount === 'number' ? jitterAmount : 
                     typeof jitterAmount === 'boolean' ? (jitterAmount ? 0.05 : 0) :
                     jitterAmount.x || 0;
    const jitterY = typeof jitterAmount === 'number' ? jitterAmount : 
                     typeof jitterAmount === 'boolean' ? (jitterAmount ? 0.05 : 0) :
                     jitterAmount.y || 0;

    return data.map(point => {
      // Store original position in metadata
      const jitteredPoint = { ...point };
      
      if (!jitteredPoint.metadata) {
        jitteredPoint.metadata = {};
      }
      
      jitteredPoint.metadata.originalX = point.x;
      jitteredPoint.metadata.originalY = point.y;

      // Apply random jitter
      if (jitterX > 0) {
        jitteredPoint.x += (Math.random() - 0.5) * jitterX * 2;
      }
      if (jitterY > 0) {
        jitteredPoint.y += (Math.random() - 0.5) * jitterY * 2;
      }

      return jitteredPoint;
    });
  }

  /**
   * Group points by series for rendering
   * This can be used during rendering phase for optimized drawing
   */
  static groupBySeries(data: ScatterPlotData): Map<string, ScatterPlotDataPoint[]> {
    const grouped = new Map<string, ScatterPlotDataPoint[]>();
    
    data.data.forEach(point => {
      const series = point.series || 'default';
      if (!grouped.has(series)) {
        grouped.set(series, []);
      }
      grouped.get(series)!.push(point);
    });
    
    return grouped;
  }

  /**
   * Calculate point sizes based on size encoding
   * This should be called during rendering phase
   */
  static calculatePointSizes(
    data: ScatterPlotData,
    minRadius = 3,
    maxRadius = 20
  ): ScatterPlotData {
    if (!data.sizeExtent) {
      return data;
    }

    const [minSize, maxSize] = data.sizeExtent;
    const sizeRange = maxSize - minSize || 1;

    const scaledData = data.data.map(point => {
      if (point.size !== undefined) {
        // Scale size to radius range
        const normalizedSize = (point.size - minSize) / sizeRange;
        const scaledRadius = minRadius + normalizedSize * (maxRadius - minRadius);
        
        return {
          ...point,
          scaledSize: scaledRadius
        };
      }
      return point;
    });

    return { ...data, data: scaledData };
  }

  /**
   * Detect and mark outliers
   * Uses IQR method for outlier detection
   */
  static detectOutliers(data: ScatterPlotData): ScatterPlotData {
    const xValues = data.data.map(p => p.x).sort((a, b) => a - b);
    const yValues = data.data.map(p => p.y).sort((a, b) => a - b);
    
    const getQuartiles = (sorted: number[]) => {
      const q1Index = Math.floor(sorted.length * 0.25);
      const q3Index = Math.floor(sorted.length * 0.75);
      const q1 = sorted[q1Index];
      const q3 = sorted[q3Index];
      const iqr = q3 - q1;
      return { q1, q3, iqr };
    };
    
    const xQuartiles = getQuartiles(xValues);
    const yQuartiles = getQuartiles(yValues);
    
    const xLowerBound = xQuartiles.q1 - 1.5 * xQuartiles.iqr;
    const xUpperBound = xQuartiles.q3 + 1.5 * xQuartiles.iqr;
    const yLowerBound = yQuartiles.q1 - 1.5 * yQuartiles.iqr;
    const yUpperBound = yQuartiles.q3 + 1.5 * yQuartiles.iqr;
    
    const markedData = data.data.map(point => {
      const isOutlier = 
        point.x < xLowerBound || point.x > xUpperBound ||
        point.y < yLowerBound || point.y > yUpperBound;
      
      if (isOutlier) {
        return {
          ...point,
          metadata: {
            ...point.metadata,
            isOutlier: true
          }
        };
      }
      return point;
    });
    
    return { ...data, data: markedData };
  }
}