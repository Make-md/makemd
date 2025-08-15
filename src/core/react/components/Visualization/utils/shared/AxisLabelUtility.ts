import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';

export class AxisLabelUtility {
  static renderXLabel(
    context: RenderContext, 
    onXLabelClick?: (event: MouseEvent) => void
  ): void {
    if (isSVGContext(context)) {
      this.renderXLabelSVG(context, onXLabelClick);
    } else if (isCanvasContext(context)) {
      this.renderXLabelCanvas(context);
    }
  }

  static renderYLabel(
    context: RenderContext, 
    onYLabelClick?: (event: MouseEvent) => void
  ): void {
    if (isSVGContext(context)) {
      this.renderYLabelSVG(context, onYLabelClick);
    } else if (isCanvasContext(context)) {
      this.renderYLabelCanvas(context);
    }
  }

  private static renderXLabelSVG(
    context: RenderContext,
    onXLabelClick?: (event: MouseEvent) => void
  ): void {
    if (!isSVGContext(context)) return;

    const { svg, graphArea, config, resolveColor, editMode, selectedElement, onElementSelect, onElementDoubleClick, showXAxisLabel, showXAxis } = context;
    
    // Check for label in layout.xAxis.label or encoding.x.axis.title
    let label = config.layout.xAxis?.label;
    if (!label && config.encoding.x && !Array.isArray(config.encoding.x) && config.encoding.x.axis?.title) {
      label = config.encoding.x.axis.title;
    }
    
    // If no explicit label, use the field name
    if ((!label || label === '') && config.encoding.x && !Array.isArray(config.encoding.x)) {
      label = config.encoding.x.field;
    }
    
    // In edit mode, show field name or placeholder
    if (!label && editMode) {
      label = config.encoding.x && !Array.isArray(config.encoding.x) 
        ? config.encoding.x.field || 'X Axis' 
        : 'X Axis';
    }
    
    if (!label || !showXAxisLabel || 
        !['bar', 'line', 'scatter', 'area', 'histogram'].includes(config.chartType)) {
      return;
    }

    const xAxisLabelGroup = svg.append('g').attr('class', 'x-axis-label-group');

    // Add invisible background for better click detection
    if (editMode) {
      xAxisLabelGroup
        .append('rect')
        .attr('x', graphArea.left)
        .attr('y', graphArea.bottom + 10)
        .attr('width', graphArea.right - graphArea.left)
        .attr('height', 20)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
        .on('click', function(event: MouseEvent) {
          if (onElementSelect) {
            onElementSelect({ type: 'xAxisLabel' });
          }
          if (onXLabelClick) {
            onXLabelClick(event as MouseEvent);
          }
        });
    }

    const xAxisLabelText = xAxisLabelGroup
      .append('text')
      .attr('x', (graphArea.left + graphArea.right) / 2)
      .attr('y', graphArea.bottom + (showXAxis ? 25 : 0) + 10) // Position after axis with gap
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'hanging') // Align text from top like Canvas
      .style('font-size', `${config.layout.xAxis?.labelFontSize || 12}px`)
      .style('fill', resolveColor(config.layout.xAxis?.labelColor || 'var(--mk-ui-text-primary)'))
      .style('cursor', editMode ? 'pointer' : 'default')
      .style('opacity', editMode ? 0 : 1) // Hide in edit mode
      .text(label);

    // Add selection indicator
    if (editMode && selectedElement?.type === 'xAxisLabel') {
      const bbox = xAxisLabelText.node()?.getBBox();
      if (bbox) {
        xAxisLabelGroup
          .append('rect')
          .attr('x', (graphArea.left + graphArea.right) / 2 - bbox.width / 2 - 4)
          .attr('y', graphArea.bottom + 13)
          .attr('width', bbox.width + 8)
          .attr('height', bbox.height + 4)
          .attr('fill', 'none')
          .attr('stroke', 'var(--mk-ui-accent)')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,2')
          .attr('pointer-events', 'none');
      }
    }

    if (editMode) {
      xAxisLabelText.on('click', function(event: MouseEvent) {
        if (onElementSelect) {
          onElementSelect({ type: 'xAxisLabel' });
        }
        if (onXLabelClick) {
          onXLabelClick(event as MouseEvent);
        }
      })
      .on('dblclick', function(event) {
        if (onElementDoubleClick) {
          const node = this as SVGTextElement;
          const rect = node.getBoundingClientRect();
          const currentValue = label || '';
          onElementDoubleClick({ type: 'xAxisLabel' }, rect, currentValue);
        }
      });
    }
  }

  private static renderYLabelSVG(
    context: RenderContext,
    onYLabelClick?: (event: MouseEvent) => void
  ): void {
    if (!isSVGContext(context)) return;

    const { svg, graphArea, config, resolveColor, editMode, selectedElement, onElementSelect, onElementDoubleClick, showYAxisLabel, showYAxis } = context;
    
    // Check for label in layout.yAxis.label or encoding.y.axis.title
    let label = config.layout.yAxis?.label;
    if (!label && config.encoding.y && !Array.isArray(config.encoding.y) && config.encoding.y.axis?.title) {
      label = config.encoding.y.axis.title;
    }
    
    // If no explicit label, use the field name
    if ((!label || label === '') && config.encoding.y && !Array.isArray(config.encoding.y)) {
      label = config.encoding.y.field;
    }
    
    // In edit mode, show field name or placeholder
    if (!label && editMode) {
      label = config.encoding.y && !Array.isArray(config.encoding.y) 
        ? config.encoding.y.field || 'Y Axis' 
        : 'Y Axis';
    }
    
    if (!label || !showYAxisLabel || 
        !['bar', 'line', 'scatter', 'area', 'histogram'].includes(config.chartType)) {
      return;
    }

    const yAxisLabelGroup = svg.append('g').attr('class', 'y-axis-label-group');

    // Add invisible background for better click detection
    if (editMode) {
      const yAxisWidth = showYAxis ? 35 : 0;
      const labelFontSize = config.layout.yAxis?.labelFontSize || 12;
      const yAxisLabelWidth = labelFontSize + 10;
      const yLabelX = graphArea.left - yAxisWidth - yAxisLabelWidth / 2; // Center of label area
      
      yAxisLabelGroup
        .append('rect')
        .attr('x', yLabelX - 10)
        .attr('y', graphArea.top)
        .attr('width', 20)
        .attr('height', graphArea.bottom - graphArea.top)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
        .on('click', function(event: MouseEvent) {
          if (onElementSelect) {
            onElementSelect({ type: 'yAxisLabel' });
          }
          if (onYLabelClick) {
            onYLabelClick(event as MouseEvent);
          }
        });
    }

    // Calculate Y-axis label position
    // Position to the left of Y-axis, accounting for axis width if shown
    const yAxisWidth = showYAxis ? 35 : 0;
    const labelFontSize = config.layout.yAxis?.labelFontSize || 12;
    const yAxisLabelWidth = labelFontSize + 10;
    const yLabelX = graphArea.left - yAxisWidth - yAxisLabelWidth / 2; // Center of label area

    const yAxisLabelText = yAxisLabelGroup
      .append('text')
      .attr('x', yLabelX)
      .attr('y', (graphArea.top + graphArea.bottom) / 2)
      .attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90, ${yLabelX}, ${(graphArea.top + graphArea.bottom) / 2})`)
      .style('font-size', `${config.layout.yAxis?.labelFontSize || 12}px`)
      .style('fill', resolveColor(config.layout.yAxis?.labelColor || 'var(--mk-ui-text-primary)'))
      .style('cursor', editMode ? 'pointer' : 'default')
      .style('opacity', editMode ? 0 : 1) // Hide in edit mode
      .text(label);

    // Add selection indicator
    if (editMode && selectedElement?.type === 'yAxisLabel') {
      const bbox = yAxisLabelText.node()?.getBBox();
      if (bbox) {
        // Create selection indicator that accounts for rotation
        const centerX = yLabelX;
        const centerY = (graphArea.top + graphArea.bottom) / 2;
        
        yAxisLabelGroup
          .append('rect')
          .attr('x', centerX - bbox.height / 2 - 2)
          .attr('y', centerY - bbox.width / 2 - 2)
          .attr('width', bbox.height + 4)
          .attr('height', bbox.width + 4)
          .attr('fill', 'none')
          .attr('stroke', 'var(--mk-ui-accent)')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,2')
          .attr('pointer-events', 'none');
      }
    }

    if (editMode) {
      yAxisLabelText.on('click', function(event: MouseEvent) {
        if (onElementSelect) {
          onElementSelect({ type: 'yAxisLabel' });
        }
        if (onYLabelClick) {
          onYLabelClick(event as MouseEvent);
        }
      })
      .on('dblclick', function(event) {
        if (onElementDoubleClick) {
          const node = this as SVGTextElement;
          const rect = node.getBoundingClientRect();
          const currentValue = label || '';
          onElementDoubleClick({ type: 'yAxisLabel' }, rect, currentValue);
        }
      });
    }
  }

  private static renderXLabelCanvas(context: RenderContext): void {
    if (!isCanvasContext(context)) return;

    const { ctx, graphArea, config, resolveColor } = context;
    
    // Check for label in layout.xAxis.label or encoding.x.axis.title
    let label = config.layout.xAxis?.label;
    if (!label && config.encoding.x && !Array.isArray(config.encoding.x) && config.encoding.x.axis?.title) {
      label = config.encoding.x.axis.title;
    }
    
    // If no explicit label, use the field name
    if ((!label || label === '') && config.encoding.x && !Array.isArray(config.encoding.x)) {
      label = config.encoding.x.field;
    }
    
    if (!label || 
        !['bar', 'line', 'scatter', 'area', 'histogram'].includes(config.chartType)) {
      return;
    }

    ctx.save();
    ctx.fillStyle = resolveColor(config.layout.xAxis?.labelColor || 'var(--mk-ui-text-primary)');
    ctx.font = `${config.layout.xAxis?.labelFontSize || 12}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xAxisHeight = context.showXAxis ? 25 : 0;
    ctx.fillText(
      label,
      (graphArea.left + graphArea.right) / 2,
      graphArea.bottom + xAxisHeight + 10 // Position after axis with gap
    );
    ctx.restore();
  }

  private static renderYLabelCanvas(context: RenderContext): void {
    if (!isCanvasContext(context)) return;

    const { ctx, graphArea, config, resolveColor } = context;
    
    // Check for label in layout.yAxis.label or encoding.y.axis.title
    let label = config.layout.yAxis?.label;
    if (!label && config.encoding.y && !Array.isArray(config.encoding.y) && config.encoding.y.axis?.title) {
      label = config.encoding.y.axis.title;
    }
    
    // If no explicit label, use the field name
    if ((!label || label === '') && config.encoding.y && !Array.isArray(config.encoding.y)) {
      label = config.encoding.y.field;
    }
    
    if (!label || 
        !['bar', 'line', 'scatter', 'area', 'histogram'].includes(config.chartType)) {
      return;
    }

    ctx.save();
    ctx.fillStyle = resolveColor(config.layout.yAxis?.labelColor || 'var(--mk-ui-text-primary)');
    ctx.font = `${config.layout.yAxis?.labelFontSize || 12}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Rotate for vertical text - position to the left of Y-axis
    // Account for Y-axis width if shown
    const yAxisWidth = context.showYAxis ? 35 : 0;
    const labelFontSize = config.layout.yAxis?.labelFontSize || 12;
    const yAxisLabelWidth = labelFontSize + 10;
    const yLabelX = graphArea.left - yAxisWidth - yAxisLabelWidth / 2; // Center of label area
    ctx.translate(yLabelX, (graphArea.top + graphArea.bottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
}