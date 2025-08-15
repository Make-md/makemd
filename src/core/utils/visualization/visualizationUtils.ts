import { MDBFrame } from "shared/types/mframe";
import { VisualizationConfig } from "shared/types/visualization";
import { mdbSchemaToFrameSchema } from "shared/utils/makemd/schema";

/**
 * Parses visualization data from an MDBFrame
 * Handles both old format (nested visualizationConfig) and new format (separate rows)
 */
export const parseVisualizationData = (frame: MDBFrame): {
  config: VisualizationConfig;
  dataSource: string;
} => {
  
  // Get data source from schema.def.db (primary) or schema.def (fallback)
  const frameSchema = mdbSchemaToFrameSchema(frame.schema);
  const dataSourceFromSchema = frameSchema?.def?.db || (typeof frameSchema?.def === 'string' ? frameSchema.def : '') || '';
  
  // Find main row
  const mainRow = frame.rows?.find(row => row.name === 'main');
  
  if (!mainRow?.props) {
    // Return default config if no main row
    return {
      config: createDefaultVisualizationConfig(dataSourceFromSchema),
      dataSource: dataSourceFromSchema
    };
  }
  
  try {
    const parsedProps = JSON.parse(mainRow.props);
    
    // Check if this is the old format (with visualizationConfig nested)
    if (parsedProps.visualizationConfig) {
      // Old format - use the nested config
      const config = parsedProps.visualizationConfig;
      if (dataSourceFromSchema && !config.data?.listId) {
        config.data = { ...config.data, listId: dataSourceFromSchema };
      }
      return {
        config,
        dataSource: config.data?.listId || dataSourceFromSchema
      };
    }
    
    // New format - build config from separate rows
    const titleRow = frame.rows?.find(row => row.name === 'title');
    const gridRow = frame.rows?.find(row => row.name === 'grid');
    const xAxisRow = frame.rows?.find(row => row.name === 'x-axis');
    const yAxisRow = frame.rows?.find(row => row.name === 'y-axis');
    const legendRow = frame.rows?.find(row => row.name === 'legend');
    const tooltipRow = frame.rows?.find(row => row.name === 'tooltip');
    
    
    const config: VisualizationConfig = {
      id: frame.schema?.id || '',
      name: parsedProps.name || 'Visualization',
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
          ? parsedProps.xFields.map((field: string) => ({ field, type: parsedProps.xType || 'nominal' }))
          : { field: parsedProps.xField || '', type: parsedProps.xType || 'nominal' },
        y: parsedProps.yFields !== undefined && parsedProps.yFields.length > 0
          ? parsedProps.yFields.map((field: string) => ({ field, type: parsedProps.yType || 'quantitative' }))
          : parsedProps.yField 
          ? { field: parsedProps.yField, type: parsedProps.yType || 'quantitative' }
          : { field: '', type: 'quantitative' },
        ...(parsedProps.colorField && {
          color: { field: parsedProps.colorField, type: parsedProps.colorType || 'nominal' }
        }),
        ...(parsedProps.sizeField && {
          size: { field: parsedProps.sizeField, type: parsedProps.sizeType || 'quantitative' }
        })
      },
      data: {
        listId: parsedProps.listId || dataSourceFromSchema || ''
      },
      // @ts-ignore - colorPaletteId might not be in the type definition yet
      colorPaletteId: parsedProps.colorPaletteId,
      stacked: parsedProps.stacked || false,
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
    
    
    return {
      config,
      dataSource: config.data?.listId || dataSourceFromSchema
    };
  } catch (e) {
    return {
      config: createDefaultVisualizationConfig(dataSourceFromSchema),
      dataSource: dataSourceFromSchema
    };
  }
};

/**
 * Updates the frame schema to store the data source in def.db
 */
export const updateVisualizationSchema = async (
  superstate: any,
  spacePath: string,
  frameId: string,
  dataSource: string
): Promise<void> => {
  try {
    // Read the current frame to get the schema
    const frame = await superstate.spaceManager.readFrame(spacePath, frameId);
    if (frame?.schema) {
      // Update the schema def to include the data source
      const currentDef = frame.schema.def ? JSON.parse(frame.schema.def) : {};
      const updatedDef = {
        ...currentDef,
        db: dataSource
      };
      
      frame.schema.def = JSON.stringify(updatedDef);
      
      // Ensure schema type is preserved as 'vis'
      if (frame.schema.type !== 'vis') {
        frame.schema.type = 'vis';
      }
      
      // Save the updated frame
      await superstate.spaceManager.saveFrame(spacePath, frame);
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
  const mainProps = {
    chartType: config.chartType || 'bar',
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
    colorPaletteId: (config as any).colorPaletteId || '',
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
    xFields: Array.isArray(config.encoding?.x) 
      ? config.encoding.x.map((e: any) => e.field) 
      : undefined,
    yFields: Array.isArray(config.encoding?.y) 
      ? config.encoding.y.map((e: any) => e.field).filter(Boolean)
      : config.encoding?.y?.field ? [config.encoding.y.field] : [],
    listId: config.data?.listId || '',
    name: config.name,
    // Save axis visibility
    showXAxis: config.layout?.xAxis?.show !== false,
    showYAxis: config.layout?.yAxis?.show !== false,
    // Save axis labels in main row too for backward compatibility
    xAxisLabel: config.layout?.xAxis?.label || '',
    yAxisLabel: config.layout?.yAxis?.label || '',
    // Save stacked property
    stacked: config.stacked || false
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
export const createDefaultVisualizationConfig = (dataSource?: string): VisualizationConfig => ({
  id: '',
  name: 'Visualization',
  chartType: 'bar',
  mark: { 
    type: 'rect',
    interpolate: 'linear'
  },
  encoding: {
    x: { field: '', type: 'nominal' },
    y: { field: '', type: 'quantitative' }
  },
  data: {
    listId: dataSource || ''
  },
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