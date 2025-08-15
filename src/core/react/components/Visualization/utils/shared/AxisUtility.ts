import { axisBottom, axisLeft, type Selection } from 'core/utils/d3-imports';
import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';
import { displayTextForType } from 'core/utils/displayTextForType';

export class AxisUtility {
  static renderAxes(context: RenderContext, xScale: any, yScale: any): void {
    if (isSVGContext(context)) {
      this.renderSVGAxes(context, xScale, yScale);
    } else if (isCanvasContext(context)) {
      this.renderCanvasAxes(context, xScale, yScale);
    }
  }

  private static renderSVGAxes(
    context: RenderContext,
    xScale: any,
    yScale: any
  ): void {
    if (!isSVGContext(context)) return;
    
    const { g, graphArea, config, resolveColor, editMode, selectedElement, onElementSelect, showXAxis, showYAxis } = context;

    // X axis
    if (showXAxis && xScale) {
      const xAxis = g
        .append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${graphArea.bottom})`);

      // Get x-axis property for formatting
      let xProperty: any = null;
      if (context.tableProperties && config.encoding.x && !Array.isArray(config.encoding.x)) {
        const fieldName = config.encoding.x.field;
        xProperty = context.tableProperties.find(col => col.name === fieldName);
      }

      const xAxisGenerator = axisBottom(xScale);
      
      // Apply custom tick format if we have property info
      if (xProperty && context.superstate) {
        xAxisGenerator.tickFormat((d: any) => {
          return displayTextForType(xProperty, d, context.superstate);
        });
      }
      
      if (!xScale.bandwidth) {
        // For numerical scales, limit the number of ticks
        xAxisGenerator.ticks(5);
      }
      
      xAxis.call(xAxisGenerator);

      this.styleAxis(xAxis, 'x', {
        layout: config.layout,
        resolveColor,
        editMode,
        selectedElement,
        onElementSelect,
        xScale,
      });
    }

    // Y axis
    if (showYAxis && yScale) {
      const yAxis = g
        .append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${graphArea.left},0)`);

      // Get y-axis property for formatting
      let yProperty: any = null;
      if (context.tableProperties && config.encoding.y && !Array.isArray(config.encoding.y)) {
        const fieldName = config.encoding.y.field;
        yProperty = context.tableProperties.find(col => col.name === fieldName);
      }

      const yAxisGenerator = axisLeft(yScale);
      
      // Apply custom tick format if we have property info
      if (yProperty && context.superstate) {
        yAxisGenerator.tickFormat((d: any) => {
          return displayTextForType(yProperty, d, context.superstate);
        });
      }
      
      if (!yScale.bandwidth) {
        // For numerical scales, limit the number of ticks
        yAxisGenerator.ticks(5);
      }
      
      yAxis.call(yAxisGenerator);

      this.styleAxis(yAxis, 'y', {
        layout: config.layout,
        resolveColor,
        editMode,
        selectedElement,
        onElementSelect,
      });
    }
  }

  private static renderCanvasAxes(
    context: RenderContext,
    xScale: any,
    yScale: any
  ): void {
    if (!isCanvasContext(context)) return;
    
    const { ctx, graphArea, resolveColor, showXAxis, showYAxis } = context;
    
    ctx.save();
    ctx.strokeStyle = resolveColor('var(--mk-ui-border)');
    ctx.lineWidth = 1;

    // X axis
    if (showXAxis && xScale) {
      // Get x-axis property for formatting
      let xProperty: any = null;
      if (context.tableProperties && context.config.encoding.x && !Array.isArray(context.config.encoding.x)) {
        const fieldName = context.config.encoding.x.field;
        xProperty = context.tableProperties.find(col => col.name === fieldName);
      }

      // Check if axis line (and tick marks) should be shown
      const showXLine = context.config.layout.xAxis?.showLine === true;
      
      if (showXLine) {
        // Draw x-axis line
        ctx.strokeStyle = resolveColor(context.config.layout.xAxis?.color || 'var(--mk-ui-border)');
        ctx.beginPath();
        ctx.moveTo(graphArea.left, graphArea.bottom);
        ctx.lineTo(graphArea.right, graphArea.bottom);
        ctx.stroke();

        // Draw tick marks only when axis line is shown
        const ticks = xScale.ticks ? xScale.ticks(5) : xScale.domain();
        
        ticks.forEach((tick: any) => {
          let x = xScale(tick);
          
          // For band scales, center the tick
          if (xScale.bandwidth) {
            x += xScale.bandwidth() / 2;
          }
          
          // Tick mark
          ctx.strokeStyle = resolveColor(context.config.layout.xAxis?.tickColor || 'var(--mk-ui-text-primary)');
          ctx.beginPath();
          ctx.moveTo(x, graphArea.bottom);
          ctx.lineTo(x, graphArea.bottom + 5);
          ctx.stroke();
        });
      }

      // Always show labels (independent of axis line)
      const ticks = xScale.ticks ? xScale.ticks(5) : xScale.domain();
      ctx.fillStyle = resolveColor(context.config.layout.xAxis?.tickColor || 'var(--mk-ui-text-primary)');
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      ticks.forEach((tick: any) => {
        let x = xScale(tick);
        
        // For band scales, center the tick
        if (xScale.bandwidth) {
          x += xScale.bandwidth() / 2;
        }
        
        // Label
        const tickLabel = xProperty && context.superstate 
          ? displayTextForType(xProperty, tick, context.superstate)
          : String(tick);
        
        // Clip text for band scales to prevent overlap
        if (xScale.bandwidth) {
          const maxWidth = xScale.bandwidth() - 4; // Leave some padding
          const metrics = ctx.measureText(tickLabel);
          
          if (metrics.width > maxWidth) {
            // Find the right length to fit
            let truncatedLabel = tickLabel;
            let i = tickLabel.length;
            
            while (i > 0 && ctx.measureText(truncatedLabel + '...').width > maxWidth) {
              i--;
              truncatedLabel = tickLabel.substring(0, i);
            }
            
            ctx.fillText(truncatedLabel + '...', x, graphArea.bottom + 7);
          } else {
            ctx.fillText(tickLabel, x, graphArea.bottom + 7);
          }
        } else {
          ctx.fillText(tickLabel, x, graphArea.bottom + 7);
        }
      });
    }

    // Y axis
    if (showYAxis && yScale) {
      // Get y-axis property for formatting
      let yProperty: any = null;
      if (context.tableProperties && context.config.encoding.y && !Array.isArray(context.config.encoding.y)) {
        const fieldName = context.config.encoding.y.field;
        yProperty = context.tableProperties.find(col => col.name === fieldName);
      }

      // Check if axis line (and tick marks) should be shown
      const showYLine = context.config.layout.yAxis?.showLine === true;
      
      if (showYLine) {
        // Draw y-axis line
        ctx.strokeStyle = resolveColor(context.config.layout.yAxis?.color || 'var(--mk-ui-border)');
        ctx.beginPath();
        ctx.moveTo(graphArea.left, graphArea.top);
        ctx.lineTo(graphArea.left, graphArea.bottom);
        ctx.stroke();

        // Draw tick marks only when axis line is shown
        const ticks = yScale.ticks ? yScale.ticks(5) : yScale.domain();
        
        ticks.forEach((tick: any) => {
          const y = yScale(tick);
          
          // Tick mark
          ctx.strokeStyle = resolveColor(context.config.layout.yAxis?.tickColor || 'var(--mk-ui-text-primary)');
          ctx.beginPath();
          ctx.moveTo(graphArea.left - 5, y);
          ctx.lineTo(graphArea.left, y);
          ctx.stroke();
        });
      }

      // Always show labels (independent of axis line)
      const ticks = yScale.ticks ? yScale.ticks(5) : yScale.domain();
      ctx.fillStyle = resolveColor(context.config.layout.yAxis?.tickColor || 'var(--mk-ui-text-primary)');
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      ticks.forEach((tick: any) => {
        const y = yScale(tick);
        
        // Label
        const tickLabel = yProperty && context.superstate 
          ? displayTextForType(yProperty, tick, context.superstate)
          : String(tick);
        ctx.fillText(tickLabel, graphArea.left - 7, y);
      });
    }

    ctx.restore();
  }

  private static styleAxis(
    axis: Selection<SVGGElement, unknown, null, undefined>,
    axisType: 'x' | 'y',
    config: any
  ): void {
    const { layout, resolveColor, editMode, selectedElement, onElementSelect, xScale } = config;

    // Apply tick text styling based on axis type
    const tickColor = axisType === 'x' 
      ? (layout.xAxis?.tickColor || 'var(--mk-ui-text-primary)')
      : (layout.yAxis?.tickColor || 'var(--mk-ui-text-primary)');

    axis
      .selectAll('text')
      .style('fill', resolveColor(tickColor))
      .style('font-size', '11px');
    
    // Add text clipping for x-axis labels to prevent overlap
    if (axisType === 'x' && xScale && xScale.bandwidth) {
      const bandwidth = xScale.bandwidth();
      const maxWidth = bandwidth - 4; // Leave some padding
      
      axis.selectAll('text').each(function(this: SVGTextElement) {
        const text = this;
        const originalText = text.textContent || '';
        let truncatedText = originalText;
        
        // Measure text width and truncate if needed
        if (text.getBBox().width > maxWidth) {
          // Binary search for the right length
          let low = 0;
          let high = originalText.length;
          
          while (low < high) {
            const mid = Math.floor((low + high + 1) / 2);
            text.textContent = originalText.substring(0, mid) + '...';
            
            if (text.getBBox().width <= maxWidth) {
              low = mid;
            } else {
              high = mid - 1;
            }
          }
          
          truncatedText = originalText.substring(0, low) + '...';
        }
        
        text.textContent = truncatedText;
        
        // Add title attribute for full text on hover
        if (truncatedText !== originalText) {
          text.setAttribute('title', originalText);
          // Add a title element for SVG hover
          const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
          title.textContent = originalText;
          text.appendChild(title);
        }
      });
    }

    // Apply axis line color and visibility
    const axisConfig = axisType === 'x' ? layout.xAxis : layout.yAxis;
    const showLine = axisConfig?.showLine === true; // Default to false
    const axisColor = axisConfig?.color || 'var(--mk-ui-border)';

    // Handle axis line and tick marks together
    if (showLine) {
      // Show both axis line and tick marks
      axis
        .select('.domain')
        .style('stroke', resolveColor(axisColor))
        .style('stroke-width', 1);
      
      axis
        .selectAll('.tick line')
        .style('stroke', resolveColor(tickColor));
    } else {
      // Hide both axis line and tick marks
      axis
        .select('.domain')
        .style('stroke', 'none');
      
      axis
        .selectAll('.tick line')
        .style('stroke', 'none');
    }

    // Rotate x-axis labels if needed (using tickAngle)
    if (axisType === 'x' && layout.xAxis?.tickAngle) {
      axis
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', `rotate(${layout.xAxis.tickAngle})`);
    }

    // Rotate y-axis labels if needed (using tickAngle)
    if (axisType === 'y' && layout.yAxis?.tickAngle) {
      axis
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', `rotate(${layout.yAxis.tickAngle})`);
    }

    // Add click handler in edit mode
    if (editMode && onElementSelect) {
      axis.style('cursor', 'pointer').on('click', () => {
        onElementSelect({ type: axisType === 'x' ? 'xAxis' : 'yAxis' });
      });
    }

    // Add selection indicator
    if (
      editMode &&
      selectedElement?.type === (axisType === 'x' ? 'xAxis' : 'yAxis')
    ) {
      const bbox = axis.node()?.getBBox();
      if (bbox) {
        axis
          .append('rect')
          .attr('x', bbox.x - 2)
          .attr('y', bbox.y - 2)
          .attr('width', bbox.width + 4)
          .attr('height', bbox.height + 4)
          .attr('fill', 'none')
          .attr('stroke', 'var(--mk-ui-accent)')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,2')
          .attr('pointer-events', 'none');
      }
    }
  }

  static renderBoundsLabels(
    context: RenderContext,
    xScale: any,
    yScale: any
  ): void {
    const { graphArea, config, resolveColor } = context;

    const labelStyle = {
      fontSize: '10px',
      fill: resolveColor('var(--mk-ui-text-secondary)'),
      fontWeight: '500',
    };

    if (isSVGContext(context)) {
      const boundsGroup = context.g.append('g').attr('class', 'bounds-labels');

      // X-axis bounds (for quantitative scales)
      if (xScale && xScale.domain && !Array.isArray(config.encoding.x) && config.encoding.x?.type === 'quantitative') {
        const [xMin, xMax] = xScale.domain();

        boundsGroup
          .append('text')
          .attr('x', graphArea.left)
          .attr('y', graphArea.bottom + 15)
          .attr('text-anchor', 'start')
          .style('font-size', labelStyle.fontSize)
          .style('fill', labelStyle.fill)
          .style('font-weight', labelStyle.fontWeight)
          .text(typeof xMin === 'number' ? xMin.toFixed(1) : xMin);

        boundsGroup
          .append('text')
          .attr('x', graphArea.right)
          .attr('y', graphArea.bottom + 15)
          .attr('text-anchor', 'end')
          .style('font-size', labelStyle.fontSize)
          .style('fill', labelStyle.fill)
          .style('font-weight', labelStyle.fontWeight)
          .text(typeof xMax === 'number' ? xMax.toFixed(1) : xMax);
      }

      // Y-axis bounds (for quantitative scales)
      if (
        yScale &&
        yScale.domain &&
        !Array.isArray(config.encoding.y) && config.encoding.y?.type === 'quantitative' &&
        config.chartType !== 'bar'
      ) {
        const [yMin, yMax] = yScale.domain();

        boundsGroup
          .append('text')
          .attr('x', graphArea.left - 5)
          .attr('y', graphArea.bottom)
          .attr('text-anchor', 'end')
          .attr('dy', '0.32em')
          .style('font-size', labelStyle.fontSize)
          .style('fill', labelStyle.fill)
          .style('font-weight', labelStyle.fontWeight)
          .text(typeof yMin === 'number' ? yMin.toFixed(1) : yMin);

        boundsGroup
          .append('text')
          .attr('x', graphArea.left - 5)
          .attr('y', graphArea.top)
          .attr('text-anchor', 'end')
          .attr('dy', '0.32em')
          .style('font-size', labelStyle.fontSize)
          .style('fill', labelStyle.fill)
          .style('font-weight', labelStyle.fontWeight)
          .text(typeof yMax === 'number' ? yMax.toFixed(1) : yMax);
      }
    } else if (isCanvasContext(context)) {
      const { ctx } = context;
      
      ctx.save();
      ctx.font = `${labelStyle.fontWeight} ${labelStyle.fontSize} sans-serif`;
      ctx.fillStyle = labelStyle.fill;

      // X-axis bounds
      if (xScale && xScale.domain && !Array.isArray(config.encoding.x) && config.encoding.x?.type === 'quantitative') {
        const [xMin, xMax] = xScale.domain();
        
        ctx.textAlign = 'start';
        ctx.textBaseline = 'top';
        ctx.fillText(typeof xMin === 'number' ? xMin.toFixed(1) : String(xMin), graphArea.left, graphArea.bottom + 15);
        
        ctx.textAlign = 'end';
        ctx.fillText(typeof xMax === 'number' ? xMax.toFixed(1) : String(xMax), graphArea.right, graphArea.bottom + 15);
      }

      // Y-axis bounds
      if (
        yScale &&
        yScale.domain &&
        !Array.isArray(config.encoding.y) && config.encoding.y?.type === 'quantitative' &&
        config.chartType !== 'bar'
      ) {
        const [yMin, yMax] = yScale.domain();
        
        ctx.textAlign = 'end';
        ctx.textBaseline = 'middle';
        ctx.fillText(typeof yMin === 'number' ? yMin.toFixed(1) : String(yMin), graphArea.left - 5, graphArea.bottom);
        ctx.fillText(typeof yMax === 'number' ? yMax.toFixed(1) : String(yMax), graphArea.left - 5, graphArea.top);
      }

      ctx.restore();
    }
  }
}