import i18n from "shared/i18n";

import { MDBFrame } from "shared/types/mframe";
import { ISuperstate } from "shared/types/superstate";
import { VisualizationConfig } from "shared/types/visualization";
import { mdbSchemaToFrameSchema } from "shared/utils/makemd/schema";

/**
 * Parses visualization data from an MDBFrame
 * Handles both old format (nested visualizationConfig) and new format (separate rows)
 */
export const parseVisualizationData = (frame: MDBFrame): VisualizationConfig => {
  // Get data source and path from schema.def

  // Find main row
  const mainRow = frame.rows?.find(row => row.name === 'main');
  
  if (!mainRow?.props) {
    // Return default config if no main row
     return createDefaultVisualizationConfig()
  }
  
  try {
    const parsedProps = JSON.parse(mainRow.props);
   
    
    // New format - build config from separate rows
    const titleRow = frame.rows?.find(row => row.name === 'title');
    const gridRow = frame.rows?.find(row => row.name === 'grid');
    const xAxisRow = frame.rows?.find(row => row.name === 'x-axis');
    const yAxisRow = frame.rows?.find(row => row.name === 'y-axis');
    const legendRow = frame.rows?.find(row => row.name === 'legend');
    const tooltipRow = frame.rows?.find(row => row.name === 'tooltip');
    
    
    const config: VisualizationConfig = {
      id: frame.schema?.id || '',
      name: parsedProps.name || i18n.labels.visualization,
      chartType: parsedProps.chartType || 'bar',
      mark: {
        type: parsedProps.chartType === 'line' ? 'line' :
              parsedProps.chartType === 'scatter' ? 'circle' :
              parsedProps.chartType === 'pie' ? 'arc' :
              parsedProps.chartType === 'area' ? 'area' : 'rect',
        fill: parsedProps.fill,
        stroke: parsedProps.stroke,
        strokeWidth: parsedProps.strokeWidth,
        interpolate: parsedProps.interpolate,
        innerRadius: parsedProps.innerRadius,
        ...(parsedProps.pointShow !== undefined && {
          point: {
            show: parsedProps.pointShow,
            size: parsedProps.pointSize || 4
          }
        })
      },
      encoding: {
        x: parsedProps.xFields && parsedProps.xFields.length > 1
          ? parsedProps.xFields.map((field: string) => ({ 
              field, 
              type: parsedProps.xType || 'nominal',
              ...(parsedProps.xAggregate && { aggregate: parsedProps.xAggregate }),
              ...(parsedProps.xTimeUnit && { timeUnit: parsedProps.xTimeUnit })
            }))
          : { 
              field: parsedProps.xField || '', 
              type: parsedProps.xType || 'nominal',
              ...(parsedProps.xAggregate && { aggregate: parsedProps.xAggregate }),
              ...(parsedProps.xTimeUnit && { timeUnit: parsedProps.xTimeUnit })
            },
        y: parsedProps.yFields !== undefined && parsedProps.yFields.length > 0
          ? parsedProps.yFields.map((field: string) => ({ 
              field, 
              type: parsedProps.yType || 'quantitative',
              ...(parsedProps.yAggregate && { aggregate: parsedProps.yAggregate })
            }))
          : parsedProps.yField 
          ? { 
              field: parsedProps.yField, 
              type: parsedProps.yType || 'quantitative',
              ...(parsedProps.yAggregate && { aggregate: parsedProps.yAggregate })
            }
          : { field: '', type: 'quantitative' },
        ...(parsedProps.colorField && {
          color: { 
            field: parsedProps.colorField, 
            type: parsedProps.colorType || 'nominal',
            ...(parsedProps.colorAggregate && { aggregate: parsedProps.colorAggregate })
          }
        }),
        ...(parsedProps.sizeField && {
          size: { 
            field: parsedProps.sizeField, 
            type: parsedProps.sizeType || 'quantitative',
            ...(parsedProps.sizeAggregate && { aggregate: parsedProps.sizeAggregate })
          }
        })
      },
      
      colorPalette: parsedProps.colorPaletteId || parsedProps.colorPalette,
      stacked: parsedProps.stacked !== undefined ? 
        (parsedProps.stacked === 'false' ? false : Boolean(parsedProps.stacked)) : 
        true,
      layout: {
        padding: parsedProps.padding || { top: 16, right: 16, bottom: 16, left: 16 },
        // Build title configuration - prefer main row props over separate row
        ...((titleRow?.props || parsedProps.title) && {
          title: titleRow?.props ? JSON.parse(titleRow.props) : {
            text: parsedProps.title,
            fontSize: 16,
            color: 'var(--mk-ui-text-primary)',
            align: 'left'
          }
        }),
        ...(gridRow?.props && {
          grid: JSON.parse(gridRow.props)
        }),
        // Build xAxis configuration
        xAxis: { 
          show: parsedProps.showXAxis !== undefined ? parsedProps.showXAxis : true,
          ...(xAxisRow?.props ? JSON.parse(xAxisRow.props) : {}),
          ...(parsedProps.xAxisLabel && { label: parsedProps.xAxisLabel }),
          // Ensure showLine is preserved from xAxisRow if it exists
          ...(xAxisRow?.props && JSON.parse(xAxisRow.props).showLine !== undefined ? 
            { showLine: JSON.parse(xAxisRow.props).showLine } : {})
        },
        // Build yAxis configuration
        yAxis: { 
          show: parsedProps.showYAxis !== undefined ? parsedProps.showYAxis : true,
          ...(yAxisRow?.props ? JSON.parse(yAxisRow.props) : {}),
          ...(parsedProps.yAxisLabel && { label: parsedProps.yAxisLabel }),
          // Ensure showLine is preserved from yAxisRow if it exists
          ...(yAxisRow?.props && JSON.parse(yAxisRow.props).showLine !== undefined ? 
            { showLine: JSON.parse(yAxisRow.props).showLine } : {})
        },
        ...(legendRow?.props && {
          legend: { ...JSON.parse(legendRow.props) }
        }),
        ...(tooltipRow?.props && {
          tooltip: { show: true, ...JSON.parse(tooltipRow.props) }
        })
      }
    };
    
    
    return config;
  } catch (e) {
    return createDefaultVisualizationConfig()
  }
};

/**
 * Updates the frame schema to store the data source in def.db and source path in def.context
 */
export const updateVisualizationSchema = async (
  superstate: ISuperstate,
  spacePath: string,
  frameId: string,
  dataSource: string,
  sourcePath?: string
): Promise<void> => {
  
  try {
    // Read the current frame to get the schema
    const frame = await superstate.spaceManager.readFrame(spacePath, frameId);
    if (frame?.schema) {
      // Create updated schema with the data source and context
      const currentDef = frame.schema.def ? JSON.parse(frame.schema.def) : {};
      
      const updatedDef = {
        ...currentDef,
        db: dataSource,
        ...(sourcePath && { context: sourcePath })
      };
      
      const updatedSchema = {
        ...frame.schema,
        def: JSON.stringify(updatedDef),
        type: 'vis' // Ensure schema type is preserved as 'vis'
      };
      
      // Save the updated schema using saveFrameSchema
      await superstate.spaceManager.saveFrameSchema(spacePath, frameId, (prevSchema: any) => updatedSchema);
    }
  } catch (error) {
    console.error('Error updating visualization schema:', error);
  }
};

/**
 * Creates visualization frame rows from a config
 * Returns rows in the format expected by the loading logic
 */
export const createVisualizationRows = (
  config: VisualizationConfig,
  frameId: string,
  existingRows?: any[]
): any[] => {
  const rows = existingRows ? [...existingRows] : [];
  
  // Helper function to update or create a row
  const updateOrCreateRow = (rowName: string, props: any) => {
    const existingIndex = rows.findIndex(row => row.name === rowName);
    const rowData = {
      id: rowName,
      name: rowName,
      schemaId: frameId,
      type: 'vis',
      rank: String(rows.length),
      props: JSON.stringify(props)
    };
    
    
    if (existingIndex !== -1) {
      rows[existingIndex] = { ...rows[existingIndex], ...rowData };
    } else {
      rows.push(rowData);
    }
  };
  
  // Update main row with core config
  // Ensure mark type matches chart type
  const markType = config.chartType === 'line' ? 'line' :
                   config.chartType === 'scatter' ? 'circle' :
                   config.chartType === 'pie' ? 'arc' :
                   config.chartType === 'area' ? 'area' : 
                   config.chartType === 'radar' ? 'line' : 'rect';
  
  const mainProps = {
    chartType: config.chartType || 'bar',
    name: config.name || i18n.labels.visualization,
    markType: markType, // Save mark type explicitly
    xField: Array.isArray(config.encoding?.x) 
      ? config.encoding.x[0]?.field 
      : config.encoding?.x?.field || '',
    // Also save yField for backward compatibility
    yField: Array.isArray(config.encoding?.y) 
      ? config.encoding.y[0]?.field 
      : config.encoding?.y?.field || '',
    colorField: config.encoding?.color?.field || '',
    sizeField: config.encoding?.size?.field || '',
    // @ts-ignore - colorPaletteId might not be in the type definition yet
    colorPaletteId: (config as any).colorPaletteId || (config as any).colorPalette || '',
    stacked: config.stacked !== undefined ? config.stacked : true,
    fill: config.mark?.fill,
    stroke: config.mark?.stroke,
    strokeWidth: config.mark?.strokeWidth,
    interpolate: config.mark?.interpolate,
    pointShow: config.mark?.point?.show,
    pointSize: config.mark?.point?.size,
    innerRadius: config.mark?.innerRadius,
    xType: Array.isArray(config.encoding?.x) 
      ? config.encoding.x[0]?.type 
      : config.encoding?.x?.type,
    yType: Array.isArray(config.encoding?.y) 
      ? config.encoding.y[0]?.type 
      : config.encoding?.y?.type,
    colorType: config.encoding?.color?.type,
    sizeType: config.encoding?.size?.type,
    // Save aggregate values
    xAggregate: Array.isArray(config.encoding?.x) 
      ? config.encoding.x[0]?.aggregate 
      : config.encoding?.x?.aggregate,
    yAggregate: Array.isArray(config.encoding?.y) 
      ? config.encoding.y[0]?.aggregate 
      : config.encoding?.y?.aggregate,
    colorAggregate: config.encoding?.color?.aggregate,
    sizeAggregate: config.encoding?.size?.aggregate,
    // Save timeUnit for temporal grouping
    xTimeUnit: Array.isArray(config.encoding?.x) 
      ? config.encoding.x[0]?.timeUnit 
      : config.encoding?.x?.timeUnit,
    xFields: Array.isArray(config.encoding?.x) 
      ? config.encoding.x.map((e: any) => e.field) 
      : undefined,
    yFields: Array.isArray(config.encoding?.y) 
      ? config.encoding.y.map((e: any) => e.field).filter(Boolean)
      : config.encoding?.y?.field ? [config.encoding.y.field] : [],
    // Don't save listId in props - it should only be in schema.def
    // Save axis visibility
    showXAxis: config.layout?.xAxis?.show !== false,
    showYAxis: config.layout?.yAxis?.show !== false,
    // Save axis labels in main row too for backward compatibility
    xAxisLabel: config.layout?.xAxis?.label || '',
    yAxisLabel: config.layout?.yAxis?.label || ''
  };
  
  
  updateOrCreateRow('main', mainProps);
  
  // Create/update title row if title exists
  if (config.layout?.title) {
    updateOrCreateRow('title', {
      text: config.layout.title.text || 'Chart Title',
      fontSize: config.layout.title.fontSize || 16,
      color: config.layout.title.color || 'var(--mk-ui-text-primary)',
      anchor: config.layout.title.anchor || 'middle'
    });
  } else {
    // Remove title row if no title
    const titleIndex = rows.findIndex(row => row.name === 'title');
    if (titleIndex !== -1) rows.splice(titleIndex, 1);
  }
  
  // Create/update grid row
  if (config.layout?.grid) {
    updateOrCreateRow('grid', {
      x: config.layout.grid.x ?? false,
      y: config.layout.grid.y ?? true,
      color: config.layout.grid.color || 'var(--mk-ui-border)',
      strokeDasharray: config.layout.grid.strokeDasharray || '3,3'
    });
  }
  
  // Create/update x-axis row
  if (config.layout?.xAxis) {
    updateOrCreateRow('x-axis', {
      label: config.layout.xAxis.label || '',
      showLabel: config.layout.xAxis.showLabel ?? true,
      tickAngle: config.layout.xAxis.tickAngle ?? 0,
      tickColor: config.layout.xAxis.tickColor || 'var(--mk-ui-text-secondary)',
      labelColor: config.layout.xAxis.labelColor || 'var(--mk-ui-text-primary)',
      labelFontSize: config.layout.xAxis.labelFontSize || 12,
      showLine: config.layout.xAxis.showLine ?? false,
      color: config.layout.xAxis.color || 'var(--mk-ui-border)'
    });
  }
  
  // Create/update y-axis row
  if (config.layout?.yAxis) {
    updateOrCreateRow('y-axis', {
      label: config.layout.yAxis.label || '',
      showLabel: config.layout.yAxis.showLabel ?? true,
      tickColor: config.layout.yAxis.tickColor || 'var(--mk-ui-text-secondary)',
      labelColor: config.layout.yAxis.labelColor || 'var(--mk-ui-text-primary)',
      labelFontSize: config.layout.yAxis.labelFontSize || 12,
      format: config.layout.yAxis.format || '',
      showLine: config.layout.yAxis.showLine ?? false,
      color: config.layout.yAxis.color || 'var(--mk-ui-border)'
    });
  }
  
  // Create/update legend row - always create to preserve show state
  if (config.layout?.legend) {
    updateOrCreateRow('legend', {
      show: config.layout.legend.show ?? false,
      position: config.layout.legend.position || 'right',
      orient: config.layout.legend.orient || 'vertical',
      align: config.layout.legend.align || 'start',
      itemColor: config.layout.legend.itemColor || 'var(--mk-ui-text-primary)',
      itemFontSize: config.layout.legend.itemFontSize || 12
    });
  }
  
  // Create/update tooltip row
  if (config.layout?.tooltip) {
    updateOrCreateRow('tooltip', {
      backgroundColor: config.layout.tooltip.backgroundColor || 'var(--mk-ui-background)',
      borderColor: config.layout.tooltip.borderColor || 'var(--mk-ui-border)',
      textColor: config.layout.tooltip.textColor || 'var(--mk-ui-text-primary)',
      fontSize: config.layout.tooltip.fontSize || 12,
      format: config.layout.tooltip.format || ''
    });
  }
  
  
  return rows;
};

/**
 * Creates a default visualization config
 */
export const createDefaultVisualizationConfig = (): VisualizationConfig => ({
  id: '',
  name: "Visualization",
  chartType: 'bar',
  mark: { 
    type: 'rect',
    interpolate: 'linear'
  },
  encoding: {
    x: { field: '', type: 'nominal' },
    y: { field: '', type: 'quantitative' }
  },
 
  stacked: true,
  layout: {
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    title: { 
      text: 'Chart Title', 
      fontSize: 16, 
      color: 'var(--mk-ui-text-primary)',
      anchor: 'middle'
    },
    xAxis: { 
      show: true, 
      label: '', 
      tickAngle: 0, 
      tickColor: 'var(--mk-ui-text-primary)', 
      labelColor: 'var(--mk-ui-text-primary)', 
      labelFontSize: 12 
    },
    yAxis: { 
      show: true, 
      label: '', 
      tickColor: 'var(--mk-ui-text-primary)', 
      labelColor: 'var(--mk-ui-text-primary)', 
      labelFontSize: 12 
    },
    grid: { 
      x: false, 
      y: true, 
      color: 'var(--mk-ui-border)', 
      strokeDasharray: '3,3' 
    }
  }
});

/**
 * Creates a new visualization frame structure
 */
export const createNewVisualizationFrame = (frameId: string): MDBFrame => {
  const defaultConfig = createDefaultVisualizationConfig();
  const rows = createVisualizationRows(defaultConfig, frameId);
  
  return {
    schema: {
      id: frameId,
      name: 'vis',
      type: 'vis'
    },
    cols: [
      { name: 'name', schemaId: frameId, type: 'text' },
      { name: 'props', schemaId: frameId, type: 'text' }
    ],
    rows
  } as MDBFrame;
};

/**
 * Aggregation type for data processing
 */
export type AggregationType = 'count' | 'sum' | 'average' | 'min' | 'max' | 'distinct';

/**
 * Aggregates data by grouping field and x-axis field
 */
/**
 * Aggregates data specifically for pie charts - group by the category field only
 */
export const aggregateForPieChart = (
  rows: any[],
  categoryField: string,
  valueField: string,
  aggregation: AggregationType,
  hasValueFieldInData: boolean
): any[] => {
  const groupedData = new Map<string, any[]>();
  
  // Group data by the category field only (not by x field)
  rows.forEach(row => {
    const categoryValue = String(row[categoryField] || i18n.labels.none);
    
    if (!groupedData.has(categoryValue)) {
      groupedData.set(categoryValue, []);
    }
    groupedData.get(categoryValue)!.push(row);
  });
  
  // Aggregate based on the selected method
  const tableData: any[] = [];
  groupedData.forEach((rows, categoryValue) => {
    if (valueField && hasValueFieldInData) {
      let aggregatedValue = 0;
      
      switch (aggregation) {
        case 'count':
          aggregatedValue = rows.length;
          break;
        case 'sum':
          aggregatedValue = rows.reduce((sum, row) => {
            const val = parseFloat(row[valueField]) || 0;
            return sum + val;
          }, 0);
          break;
        case 'average':
          {const sum = rows.reduce((s, row) => {
            const val = parseFloat(row[valueField]) || 0;
            return s + val;
          }, 0);
          aggregatedValue = rows.length > 0 ? sum / rows.length : 0;}
          break;
        case 'min':
          aggregatedValue = Math.min(...rows.map(row => parseFloat(row[valueField]) || 0));
          break;
        case 'max':
          aggregatedValue = Math.max(...rows.map(row => parseFloat(row[valueField]) || 0));
          break;
        case 'distinct':
          {const distinctValues = new Set(rows.map(row => row[valueField]));
          aggregatedValue = distinctValues.size;}
          break;
        default:
          aggregatedValue = rows.length;
      }
      
      tableData.push({
        [categoryField]: categoryValue,
        [valueField]: aggregatedValue,
        _aggregatedCount: rows.length
      });
    } else {
      // No value field - just count occurrences
      tableData.push({
        [categoryField]: categoryValue,
        [valueField]: rows.length,
        _aggregatedCount: rows.length
      });
    }
  });
  
  return tableData;
};

export const aggregateByGroup = (
  rows: any[],
  xField: string,
  yField: string,
  groupByField: string,
  aggregation: AggregationType,
  hasYFieldInData: boolean
): any[] => {
  const groupedData = new Map<string, any[]>();
  
  // Group data by the groupBy field and x field
  rows.forEach(row => {
    const xValue = String(row[xField] || '');
    const groupValue = String(row[groupByField] || i18n.labels.none);
    const key = `${xValue}|${groupValue}`;
    
    if (!groupedData.has(key)) {
      groupedData.set(key, []);
    }
    groupedData.get(key)!.push(row);
  });
  
  // Aggregate based on the selected method
  const tableData: any[] = [];
  groupedData.forEach((rows, key) => {
    const [xVal, groupVal] = key.split('|');
    
    if (yField && hasYFieldInData) {
      let aggregatedValue = 0;
      
      switch (aggregation) {
        case 'count':
          aggregatedValue = rows.length;
          break;
        case 'sum':
          aggregatedValue = rows.reduce((sum, row) => {
            const val = parseFloat(row[yField]) || 0;
            return sum + val;
          }, 0);
          break;
        case 'average':
          {const sum = rows.reduce((s, row) => {
            const val = parseFloat(row[yField]) || 0;
            return s + val;
          }, 0);
          aggregatedValue = rows.length > 0 ? sum / rows.length : 0;}
          break;
        case 'min':
          aggregatedValue = Math.min(...rows.map(row => parseFloat(row[yField]) || 0));
          break;
        case 'max':
          aggregatedValue = Math.max(...rows.map(row => parseFloat(row[yField]) || 0));
          break;
        case 'distinct':
          aggregatedValue = new Set(rows.map(row => row[yField])).size;
          break;
      }
      
      tableData.push({
        [xField]: xVal,
        [yField]: aggregatedValue,
        [groupByField]: groupVal
      });
    } else {
      // No Y field or Y field doesn't exist - just count
      tableData.push({
        [xField]: xVal,
        [yField || 'count']: rows.length,
        [groupByField]: groupVal
      });
    }
  });
  
  return tableData;
};

/**
 * Aggregates data when Y field is non-numeric
 */
export const aggregateNonNumericY = (
  rows: any[],
  xField: string,
  yField: string,
  hasYFieldInData: boolean
): any[] => {
  if (hasYFieldInData) {
    // Y field exists but is non-numeric - count occurrences of x,y pairs
    const aggregatedMap = new Map<string, number>();
    rows.forEach(row => {
      const xValue = String(row[xField] || '');
      const yValue = String(row[yField] || '');
      const key = `${xValue}|${yValue}`;
      aggregatedMap.set(key, (aggregatedMap.get(key) || 0) + 1);
    });
    
    // Convert back to array format
    return Array.from(aggregatedMap.entries()).map(([key, count]) => {
      const [xVal, yVal] = key.split('|');
      return {
        [xField]: xVal,
        [`${yField}_value`]: yVal,
        [yField]: count  // Use count as the y value
      };
    });
  } else {
    // Y field doesn't exist - count occurrences of x values
    const aggregatedMap = new Map<string, number>();
    rows.forEach(row => {
      const xValue = String(row[xField] || '');
      aggregatedMap.set(xValue, (aggregatedMap.get(xValue) || 0) + 1);
    });
    
    return Array.from(aggregatedMap.entries()).map(([xValue, count]) => ({
      [xField]: xValue,
      [yField]: count
    }));
  }
};

/**
 * Aggregates data for line graphs by properly bucketing data points by x-axis values
 * Line graphs always need data bucketing regardless of duplicates
 */
export const aggregateForLineGraph = (
  rows: any[],
  xField: string,
  yField: string,
  aggregationMethod: AggregationType = 'sum'
): any[] => {
  // Group all data points by x-axis value
  const buckets = new Map<string, { sum: number, count: number, values: number[], min: number, max: number }>();
  
  rows.forEach(row => {
    const xValue = String(row[xField] || '');
    const yValue = parseFloat(row[yField]) || 0;
    
    if (!buckets.has(xValue)) {
      buckets.set(xValue, { 
        sum: 0, 
        count: 0, 
        values: [], 
        min: Number.MAX_VALUE, 
        max: Number.MIN_VALUE 
      });
    }
    
    const bucket = buckets.get(xValue)!;
    bucket.sum += yValue;
    bucket.count += 1;
    bucket.values.push(yValue);
    bucket.min = Math.min(bucket.min, yValue);
    bucket.max = Math.max(bucket.max, yValue);
  });
  
  // Convert buckets to array format based on aggregation method
  const aggregatedData = Array.from(buckets.entries()).map(([xValue, bucket]) => {
    let aggregatedValue: number;
    
    switch (aggregationMethod) {
      case 'count':
        aggregatedValue = bucket.count;
        break;
      case 'sum':
        aggregatedValue = bucket.sum;
        break;
      case 'average':
        aggregatedValue = bucket.count > 0 ? bucket.sum / bucket.count : 0;
        break;
      case 'min':
        aggregatedValue = bucket.min === Number.MAX_VALUE ? 0 : bucket.min;
        break;
      case 'max':
        aggregatedValue = bucket.max === Number.MIN_VALUE ? 0 : bucket.max;
        break;
      case 'distinct':
        aggregatedValue = new Set(bucket.values).size;
        break;
      default:
        aggregatedValue = bucket.sum;
    }
    
    return {
      [xField]: xValue,
      [yField]: aggregatedValue,
      _originalXValue: xValue  // Keep original for sorting
    };
  });

  // Sort data points from left to right
  aggregatedData.sort((a, b) => {
    const aVal = a._originalXValue;
    const bVal = b._originalXValue;
    
    // Enhanced date detection and sorting
    const isDateLike = (val: string): boolean => {
      if (!val || typeof val !== 'string') return false;
      // Check for common date patterns
      return /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}|\d{4}\/\d{2}\/\d{2}/.test(val) ||
             /\w{3}\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+\w{3}\s+\d{4}/.test(val); // e.g., "Jan 1, 2023" or "1 Jan 2023"
    };
    
    // Try date sorting first (most important for line graphs)
    if (isDateLike(aVal) || isDateLike(bVal)) {
      const aDate = new Date(aVal);
      const bDate = new Date(bVal);
      
      // Handle invalid dates by putting them at the end
      if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
      if (isNaN(aDate.getTime())) return 1;
      if (isNaN(bDate.getTime())) return -1;
      
      if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
        return aDate.getTime() - bDate.getTime();
      }
    }
    
    // Try numeric sorting
    const aNum = parseFloat(aVal);
    const bNum = parseFloat(bVal);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    
    // Try pure date sorting for any remaining date-like strings
    const aDate = new Date(aVal);
    const bDate = new Date(bVal);
    
    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
      return aDate.getTime() - bDate.getTime();
    }
    
    // Fallback to string sorting
    return aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Remove the temporary sorting field and return
  return aggregatedData.map(({ _originalXValue, ...item }) => item);
};

/**
 * Aggregates duplicate x-axis values for bar charts (keeps existing logic for bars)
 */
export const aggregateDuplicateXValues = (
  rows: any[],
  xField: string,
  yField: string,
  chartType: string
): any[] => {
  // Only apply to bar charts - line charts use aggregateForLineGraph
  if (chartType !== 'bar') {
    return rows;
  }
  
  // Check if we have duplicate x-axis values
  const xValueCounts = new Map<string, number>();
  rows.forEach(row => {
    const xValue = String(row[xField] || '');
    xValueCounts.set(xValue, (xValueCounts.get(xValue) || 0) + 1);
  });
  
  const hasDuplicateXValues = Array.from(xValueCounts.values()).some(count => count > 1);
  
  if (!hasDuplicateXValues) {
    // No duplicates - return data as-is
    return rows;
  }
  
  // Aggregate duplicate x-axis values by summing y values
  const aggregatedMap = new Map<string, { sum: number, count: number, values: number[] }>();
  
  rows.forEach(row => {
    const xValue = String(row[xField] || '');
    const yValue = parseFloat(row[yField]) || 0;
    
    if (!aggregatedMap.has(xValue)) {
      aggregatedMap.set(xValue, { sum: 0, count: 0, values: [] });
    }
    
    const current = aggregatedMap.get(xValue)!;
    current.sum += yValue;
    current.count += 1;
    current.values.push(yValue);
  });
  
  // Convert back to array format using sum aggregation by default
  return Array.from(aggregatedMap.entries()).map(([xValue, data]) => ({
    [xField]: xValue,
    [yField]: data.sum
  }));
};

/**
 * Determines if Y field should be aggregated based on its type and values
 */
export const shouldAggregateYField = (
  hasYFieldInData: boolean,
  spaceData: any,
  yField: string,
  rows: any[]
): boolean => {
  if (!hasYFieldInData) {
    // Y field doesn't exist - always aggregate
    return true;
  }
  
  if (hasYFieldInData && rows.length > 0) {
    // Y field exists - check if it's non-numeric
    const yFieldColumn = spaceData.cols?.find((col: any) => col.name === yField);
    const yFieldType = yFieldColumn?.type?.toLowerCase();
    
    // Check if the y-field is non-numeric based on column type
    const isNonNumericType = yFieldType && 
      !['number', 'currency'].includes(yFieldType) &&
      !yFieldType.includes('number');
    
    // Also check actual values to be sure
    const sampleYValue = rows[0][yField];
    const isNumericValue = typeof sampleYValue === 'number' || 
      (!isNaN(Number(sampleYValue)) && sampleYValue !== '' && sampleYValue !== null);
    
    return isNonNumericType || !isNumericValue;
  }
  
  return false;
};

/**
 * Processes data aggregation based on chart configuration
 */
export const processDataAggregation = (
  rows: any[],
  config: {
    xField: string;
    yField: string;
    groupByField?: string;
    groupByAggregation?: AggregationType;
    chartType: string;
    hasYFieldInData: boolean;
    spaceData: any;
    xType?: string;
    yType?: string;
  }
): any[] => {
  const { 
    xField, 
    yField, 
    groupByField, 
    groupByAggregation = 'count',
    chartType, 
    hasYFieldInData, 
    spaceData,
    xType,
    yType
  } = config;
  
  // Special handling for pie charts - always aggregate by category field
  if (chartType === 'pie' && rows.length > 0) {
    // For pie charts, use color field if available, otherwise use x field as category
    const categoryField = groupByField || xField;
    const valueField = yField;
    
    // Only aggregate if we have at least a category field
    if (categoryField && valueField) {
      const aggregationType = groupByField ? groupByAggregation : 'sum';
      return aggregateForPieChart(rows, categoryField, valueField, aggregationType, hasYFieldInData);
    } else {
      // Return data as-is if fields are not properly configured
      return rows;
    }
  } else if (groupByField && xField && yField && rows.length > 0) {
    return aggregateByGroup(rows, xField, yField, groupByField, groupByAggregation, hasYFieldInData);
  } else if (xField && yField && (chartType === 'line' || chartType === 'area')) {
    // Line and area charts ALWAYS need proper bucketing and aggregation
    const shouldAggregate = shouldAggregateYField(hasYFieldInData, spaceData, yField, rows);
    
    if (shouldAggregate) {
      // Y field is non-numeric - use count aggregation
      return aggregateNonNumericY(rows, xField, yField, hasYFieldInData);
    } else {
      // Y field is numeric - use proper line graph bucketing with sum aggregation
      return aggregateForLineGraph(rows, xField, yField, 'sum');
    }
  } else if (xField && yField && 
             (chartType === 'scatter' || chartType === 'bar')) {
    
    const shouldAggregate = shouldAggregateYField(hasYFieldInData, spaceData, yField, rows);
    if (shouldAggregate) {
      return aggregateNonNumericY(rows, xField, yField, hasYFieldInData);
    } else {
      // For bar charts, only aggregate if duplicates exist; scatter charts use data as-is
      if (chartType === 'bar') {
        return aggregateDuplicateXValues(rows, xField, yField, chartType);
      } else {
        return rows; // Scatter charts use raw data
      }
    }
  } else if (xField && yField && 
             (xType === 'nominal' || xType === 'ordinal') && 
             yType === 'quantitative' && !hasYFieldInData) {
    // Original logic for other chart types when y field doesn't exist
    const aggregatedMap = new Map<string, number>();
    rows.forEach(row => {
      const xValue = String(row[xField] || '');
      aggregatedMap.set(xValue, (aggregatedMap.get(xValue) || 0) + 1);
    });
    
    return Array.from(aggregatedMap.entries()).map(([xValue, count]) => ({
      [xField]: xValue,
      [yField]: count
    }));
  } else {
    // Use data as-is for other cases
    return rows;
  }
};