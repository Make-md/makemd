import type { Selection } from 'core/utils/d3-imports';
import { VisualizationConfig } from 'shared/types/visualization';
import { Superstate } from 'makemd-core';
import { SpaceProperty } from 'shared/types/mdb';

export interface GraphArea {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface BaseRenderContext {
  processedData: Record<string, unknown>[];
  scales: Map<string, any>;
  config: VisualizationConfig;
  graphArea: GraphArea;
  actualDimensions: {
    width: number;
    height: number;
  };
  resolveColor: (color: string) => string;
  colorPaletteId?: string;
  superstate?: Superstate;
  tableProperties?: SpaceProperty[];
}

export interface SVGRenderContext extends BaseRenderContext {
  type: 'svg';
  svg: Selection<SVGSVGElement, unknown, null, undefined>;
  g: Selection<SVGGElement, unknown, null, undefined>;
  gridGroup: Selection<SVGGElement, unknown, null, undefined>;
  editMode: boolean;
  selectedElement?: {
    type: string;
    id?: string;
  } | null;
  onElementSelect?: (element: {
    type: string;
    id?: string;
  } | null) => void;
  onElementDoubleClick?: (element: { type: string; id?: string }, rect: DOMRect, currentValue: string) => void;
  showTitle: boolean;
  showXAxis: boolean;
  showYAxis: boolean;
  showLegend: boolean;
  showXAxisLabel: boolean;
  showYAxisLabel: boolean;
  showDataLabels: boolean;
}

export interface CanvasRenderContext extends BaseRenderContext {
  type: 'canvas';
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  showXAxis?: boolean;
  showYAxis?: boolean;
  containerHeight?: number;
  debugMode?: boolean;
}

export type RenderContext = SVGRenderContext | CanvasRenderContext;

export function isSVGContext(context: RenderContext): context is SVGRenderContext {
  return context.type === 'svg';
}

export function isCanvasContext(context: RenderContext): context is CanvasRenderContext {
  return context.type === 'canvas';
}