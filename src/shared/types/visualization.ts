// Chart types supported
export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap' | 'radar';

// Data field types  
export type FieldType = 'nominal' | 'ordinal' | 'quantitative' | 'temporal';

// Visual mark types
export type MarkType = 'rect' | 'line' | 'circle' | 'arc' | 'area' | 'point';

// Encoding for data mapping
export interface Encoding {
  field: string;
  type: FieldType;
  aggregate?: 'count' | 'sum' | 'average' | 'min' | 'max' | 'distinct';
  timeUnit?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  scale?: {
    type?: 'linear' | 'log' | 'sqrt' | 'pow' | 'time';
    domain?: [number, number] | string[];
    range?: [number, number] | string[];
  };
  axis?: {
    title?: string;
    format?: string;
    tickCount?: number;
    tickAngle?: number;
  };
}

// Visual mark configuration
export interface Mark {
  type: MarkType;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  opacity?: number;
  size?: number;
  fillOpacity?: number;
  interpolate?: 'linear' | 'monotone' | 'cardinal' | 'step';
  point?: {
    show?: boolean;
    size?: number;
  };
  dataLabels?: {
    show?: boolean;
    fontSize?: number;
    color?: string;
    format?: 'value' | 'percentage';
  };
  innerRadius?: number; // For donut charts
  stack?: boolean; // For stacked bar/area charts
  text?: string; // For text marks in scatter plots
  jitter?: number | boolean; // For jittering points in scatter plots
}

// Layout configuration
export interface Layout {
  padding?: { top: number; right: number; bottom: number; left: number };
  background?: string;
  title?: {
    text: string;
    fontSize: number;
    color: string;
    anchor?: 'start' | 'middle' | 'end';
    align?: 'left' | 'center' | 'right';
  };
  subtitle?: {
    text?: string;
    fontSize?: number;
    color?: string;
  };
  grid?: {
    x: boolean;
    y: boolean;
    color: string;
    strokeDasharray: string;
  };
  xAxis?: {
    show: boolean;
    showLabel?: boolean;
    label: string;
    tickAngle: number;
    tickColor: string;
    labelColor: string;
    labelFontSize: number;
    format?: string;
    color?: string;
    showLine?: boolean;
  };
  yAxis?: {
    show: boolean;
    showLabel?: boolean;
    label: string;
    tickColor: string;
    labelColor: string;
    labelFontSize: number;
    format?: string;
    color?: string;
    showLine?: boolean;
  };
  legend?: {
    show: boolean;
    position: 'top' | 'right' | 'bottom' | 'left';
    orient: 'horizontal' | 'vertical';
    align?: 'start' | 'center' | 'end'; // Alignment within the legend area
    itemColor: string;
    itemFontSize: number;
    fontSize?: number;
    titleFontSize?: number;
    markerSize?: number;
  };
  tooltip?: {
    show: boolean;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    fontSize: number;
    format?: string;
  };
}

// Aggregation operations
export interface Aggregate {
  field: string;
  op: 'sum' | 'mean' | 'median' | 'count' | 'min' | 'max';
  as: string;
}

// Transform operations
export interface Transform {
  type: 'filter' | 'aggregate' | 'calculate' | 'sort' | 'limit';
  filter?: string;
  groupby?: string[];
  aggregate?: Aggregate[];
  calculate?: string;
  as?: string;
  options?: {
    order?: 'ascending' | 'descending';
    count?: number;
    field?: string;
  };
}

// Main visualization configuration
export interface VisualizationConfig {
  id: string;
  name: string;
  description?: string;
  chartType: ChartType;
  colorPalette?: string;

  // Visual encoding
  mark: Mark;
  encoding: {
    x?: Encoding | Encoding[]; // Support multiple fields for x-axis
    y?: Encoding | Encoding[]; // Support multiple fields for y-axis
    color?: Encoding;
    size?: Encoding;
    opacity?: Encoding;
    shape?: Encoding;
    angle?: Encoding; // For pie charts
    theta?: Encoding; // Alternative for pie charts
  };

  // Layout and styling
  layout: Layout;
  
  // Data transformations
  transform?: Transform[];
  
  // Scale configurations
  scale?: {
    x?: {
      domain?: [number, number] | string[];
      nice?: boolean;
    };
    y?: {
      domain?: [number, number] | string[];
      nice?: boolean;
    };
    color?: {
      scheme?: string;
    };
  };
  
  // Stacking configuration
  stacked?: boolean;
  
  // Color scheme
  colorScheme?: string;
  
  // Custom code
  customCode?: {
    postProcess?: string;
  };
}