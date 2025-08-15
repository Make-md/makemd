// Centralized d3 imports to reduce bundle size
// Only import what we actually use

export { 
  // Scales
  scaleLinear,
  scaleBand,
  scaleOrdinal,
  scaleTime,
  scalePoint,
  scaleSqrt,
  scaleLog,
  scalePow,
  // Axes
  axisBottom,
  axisLeft,
  axisRight,
  axisTop,
  // Shapes
  arc,
  pie,
  line,
  area,
  stack,
  stackOrderNone,
  stackOffsetNone,
  curveCatmullRom,
  curveLinear,
  curveMonotoneX,
  curveMonotoneY,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
  curveBasis,
  curveCardinal,
  curveLinearClosed,
  // Selections
  select,
  selectAll,
  // Arrays
  max,
  min,
  extent,
  sum,
  mean,
  median,
  quantile,
  range,
  group,
  // Format
  format,
  // Time
  timeFormat,
  timeParse,
  // Color
  schemeCategory10,
  schemeSet1,
  schemeSet2,
  schemeSet3,
  schemePastel1,
  schemePastel2,
  schemeAccent,
  schemeDark2,
  schemePaired,
  schemeTableau10,
  // Interpolate
  interpolateRainbow,
  interpolateViridis,
  interpolatePlasma,
  interpolateWarm,
  interpolateCool,
  // Dispatch (for events)
  dispatch,
  // Ease
  easeLinear,
  easeQuadInOut,
  easeCubicInOut,
  // Bin
  bin,
  // Hierarchy
  hierarchy,
  treemap,
  treemapSquarify,
  // Force
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  // Drag
  drag,
  // Zoom
  zoom,
  zoomIdentity,
  // Brush
  brushX,
  brushY,
  brush
} from 'd3';

// Re-export types
export type { 
  Selection,
  ScaleLinear,
  ScaleBand,
  ScaleOrdinal,
  ScaleTime,
  Axis,
  Arc,
  Pie,
  Line,
  Area,
  Stack,
  Bin
} from 'd3';