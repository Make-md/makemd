import { axisBottom, axisLeft } from 'core/utils/d3-imports';
import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';

export interface GridlineConfig {
  x?: boolean;
  y?: boolean;
  color?: string;
  strokeDasharray?: string;
}

export class GridlineUtility {
  static render(context: RenderContext, xScale: any, yScale: any): void {
    if (isSVGContext(context)) {
      this.renderSVG(context, xScale, yScale);
    } else if (isCanvasContext(context)) {
      this.renderCanvas(context, xScale, yScale);
    }
  }

  private static renderSVG(
    context: RenderContext,
    xScale: any,
    yScale: any
  ): void {
    if (!isSVGContext(context)) return;
    
    const { gridGroup, graphArea, config, resolveColor, editMode, onElementSelect } = context;
    
    if (!config?.layout?.grid) return;
    
    // Default y gridlines to true if not explicitly set
    const showYGridlines = config.layout.grid.y !== undefined ? config.layout.grid.y : true;
    const showXGridlines = config.layout.grid.x || false;
    
    // Check if graphArea values are valid
    if (!graphArea || isNaN(graphArea.bottom) || isNaN(graphArea.height) || 
        isNaN(graphArea.left) || isNaN(graphArea.width)) {
      console.warn('Invalid graphArea values in GridlineUtility', graphArea);
      return;
    }

    if (showXGridlines && xScale) {
      const xGridlines = gridGroup
        .append('g')
        .attr('class', 'grid-x')
        .attr('transform', `translate(0,${graphArea.bottom})`);

      const tickSizeY = -graphArea.height;
      if (!isFinite(tickSizeY)) return;

      if (xScale.bandwidth) {
        xGridlines.call(
          axisBottom(xScale)
            .tickSize(tickSizeY)
            .tickFormat(() => '')
        );
      } else {
        xGridlines.call(
          axisBottom(xScale)
            .ticks(5)
            .tickSize(tickSizeY)
            .tickFormat(() => '')
        );
      }

      xGridlines
        .selectAll('line')
        .style(
          'stroke',
          resolveColor(config?.layout?.grid?.color || 'var(--mk-ui-border)')
        )
        .style(
          'stroke-dasharray',
          config?.layout?.grid?.strokeDasharray || '3,3'
        )
        .style('opacity', 0.5);

      xGridlines.select('.domain').remove();
    }

    if (showYGridlines && yScale) {
      const yGridlines = gridGroup
        .append('g')
        .attr('class', 'grid-y')
        .attr('transform', `translate(${graphArea.left},0)`);

      const tickSizeX = graphArea.width;
      if (!isFinite(tickSizeX)) return;

      if (yScale.bandwidth) {
        yGridlines.call(
          axisLeft(yScale)
            .tickSize(-tickSizeX)
            .tickFormat(() => '')
        );
      } else {
        yGridlines.call(
          axisLeft(yScale)
            .ticks(5)
            .tickSize(-tickSizeX)
            .tickFormat(() => '')
        );
      }

      yGridlines
        .selectAll('line')
        .style(
          'stroke',
          resolveColor(config?.layout?.grid?.color || 'var(--mk-ui-border)')
        )
        .style(
          'stroke-dasharray',
          config?.layout?.grid?.strokeDasharray || '3,3'
        )
        .style('opacity', 0.5);

      yGridlines.select('.domain').remove();
    }

    if (editMode && onElementSelect) {
      gridGroup.style('cursor', 'pointer').on('click', () => {
        onElementSelect({ type: 'grid' });
      });
    }
  }

  private static renderCanvas(
    context: RenderContext,
    xScale: any,
    yScale: any
  ): void {
    if (!isCanvasContext(context)) return;
    
    const { ctx, graphArea, config, resolveColor } = context;
    
    if (!config?.layout?.grid) return;
    
    // Default y gridlines to true if not explicitly set
    const showYGridlines = config.layout.grid.y !== undefined ? config.layout.grid.y : true;
    const showXGridlines = config.layout.grid.x || false;
    
    // Check if graphArea values are valid
    if (!graphArea || isNaN(graphArea.bottom) || isNaN(graphArea.height) || 
        isNaN(graphArea.left) || isNaN(graphArea.width) || 
        isNaN(graphArea.top) || isNaN(graphArea.right)) {
      console.warn('Invalid graphArea values in GridlineUtility canvas', graphArea);
      return;
    }

    ctx.save();
    ctx.strokeStyle = resolveColor(config?.layout?.grid?.color || 'var(--mk-ui-border)');
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;

    if (config?.layout?.grid?.strokeDasharray) {
      const dashArray = config.layout.grid.strokeDasharray.split(',').map(Number);
      ctx.setLineDash(dashArray);
    }

    // X gridlines
    if (showXGridlines && xScale) {
      const ticks = xScale.ticks ? xScale.ticks(5) : xScale.domain();
      
      if (xScale.bandwidth) {
        // For band scales, draw gridlines between bands
        ticks.forEach((tick: any, index: number) => {
          if (index === 0) return; // Skip first gridline
          const x = xScale(tick);
          ctx.beginPath();
          ctx.moveTo(x, graphArea.top);
          ctx.lineTo(x, graphArea.bottom);
          ctx.stroke();
        });
        // Add last gridline
        const lastX = graphArea.right;
        ctx.beginPath();
        ctx.moveTo(lastX, graphArea.top);
        ctx.lineTo(lastX, graphArea.bottom);
        ctx.stroke();
      } else {
        // For continuous scales, draw gridlines at tick positions
        ticks.forEach((tick: any) => {
          const x = xScale(tick);
          ctx.beginPath();
          ctx.moveTo(x, graphArea.top);
          ctx.lineTo(x, graphArea.bottom);
          ctx.stroke();
        });
      }
    }

    // Y gridlines
    if (showYGridlines && yScale) {
      const ticks = yScale.ticks ? yScale.ticks(5) : yScale.domain();
      
      ticks.forEach((tick: any) => {
        const y = yScale(tick);
        ctx.beginPath();
        ctx.moveTo(graphArea.left, y);
        ctx.lineTo(graphArea.right, y);
        ctx.stroke();
      });
    }

    ctx.restore();
  }
}