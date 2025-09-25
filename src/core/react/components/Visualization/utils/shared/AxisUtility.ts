import { axisBottom, axisLeft, type Selection, timeFormat } from 'core/utils/d3-imports';
import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';
import { displayTextForType } from 'core/utils/displayTextForType';
import { formatNumber } from '../formatNumber';

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
      // Position x-axis at zero line if there are negative values, otherwise at bottom
      let xAxisYPosition = graphArea.bottom;
      if (yScale && yScale.domain) {
        const [yMin, yMax] = yScale.domain();
        if (yMin < 0 && yMax > 0) {
          // There are both positive and negative values - position at y=0
          xAxisYPosition = yScale(0);
        } else if (yMax <= 0) {
          // All values are negative - position at top
          xAxisYPosition = graphArea.top;
        }
      }
      
      const xAxis = g
        .append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${xAxisYPosition})`);

      // Get x-axis property for formatting
      let xProperty: any = null;
      if (context.tableProperties && config.encoding.x && !Array.isArray(config.encoding.x)) {
        const fieldName = config.encoding.x.field;
        xProperty = context.tableProperties.find(col => col.name === fieldName);
      }

      const xAxisGenerator = axisBottom(xScale);
      
      // Check if this is a temporal scale
      const xEncoding = config.encoding.x && !Array.isArray(config.encoding.x) ? config.encoding.x : null;
      const isTemporalX = xEncoding?.type === 'temporal';
      const isCategoricalX = xEncoding?.type === 'nominal' || xEncoding?.type === 'ordinal';
      
      // Apply custom tick format
      if (isCategoricalX && !xProperty) {
        // For categorical scales without property info, handle empty labels
        xAxisGenerator.tickFormat((d: any) => {
          const label = String(d);
          return (!label || label.trim() === '') ? 'None' : label;
        });
      } else if (isTemporalX) {
        // For temporal scales, use custom formatting
        const formatMonth = timeFormat('%b'); // e.g., "Jan"
        const formatDay = timeFormat('%d'); // e.g., "15"
        const formatYear = timeFormat('%Y');
        const formatMonthYear = timeFormat('%b %Y');
        const formatTime = timeFormat('%I:%M %p');
        
        // Track which months we've already labeled
        const labeledMonths = new Set<string>();
        
        xAxisGenerator.tickFormat((d: any, i: number) => {
          const date = d instanceof Date ? d : new Date(d);
          if (isNaN(date.getTime())) return String(d);
          
          // Determine the best format based on the scale's domain
          const domain = xScale.domain();
          const domainSpan = domain[1] - domain[0];
          const msPerDay = 24 * 60 * 60 * 1000;
          const msPerMonth = 30 * msPerDay;
          const msPerYear = 365 * msPerDay;
          
          if (domainSpan > msPerYear * 2) {
            // Show years for very large ranges
            return formatYear(date);
          } else if (domainSpan > msPerMonth * 6) {
            // Show month and year for large ranges
            return formatMonthYear(date);
          } else if (domainSpan > msPerDay) {
            // For day-level data, show month at boundaries and day numbers otherwise
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            const dayOfMonth = date.getDate();
            
            // Check if this is the first tick of the month or the first tick overall
            if (dayOfMonth === 1 || i === 0) {
              // Show month label at month boundary or start
              if (!labeledMonths.has(monthKey)) {
                labeledMonths.add(monthKey);
                return formatMonth(date);
              }
            }
            
            // For all other ticks, just show the day number
            return formatDay(date);
          } else {
            // Show time for intraday ranges
            return formatTime(date);
          }
        });
        
        // For temporal scales with day-level data, use more ticks to show individual days
        const domain = xScale.domain();
        const domainSpan = domain[1] - domain[0];
        const msPerDay = 24 * 60 * 60 * 1000;
        const daysInRange = Math.ceil(domainSpan / msPerDay);
        
        if (daysInRange <= 31) {
          // Show all days if less than a month
          xAxisGenerator.ticks(daysInRange);
        } else if (daysInRange <= 90) {
          // Show every few days for up to 3 months
          xAxisGenerator.ticks(15);
        } else {
          // Default to fewer ticks for larger ranges
          xAxisGenerator.ticks(8);
        }
      } else if (xProperty && context.superstate) {
        // Use property-based formatting for non-temporal scales
        xAxisGenerator.tickFormat((d: any) => {
          if (d === null || d === undefined || d === '') {
            return 'None';
          }
          const formatted = displayTextForType(xProperty, d, context.superstate);
          return (!formatted || formatted.trim() === '') ? 'None' : formatted;
        });
      } else {
        // Default formatter that handles empty values and dates
        xAxisGenerator.tickFormat((d: any) => {
          // Check if it's a date
          if (d instanceof Date) {
            const formatDay = timeFormat('%b %d');
            return formatDay(d);
          }
          // Check if it's a date string
          if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
            const date = new Date(d);
            if (!isNaN(date.getTime())) {
              const formatDay = timeFormat('%b %d');
              return formatDay(date);
            }
          }
          const label = String(d);
          return (!label || label.trim() === '') ? 'None' : label;
        });
      }
      
      if (!xScale.bandwidth && !isTemporalX) {
        // For numerical scales (non-temporal), limit the number of ticks
        xAxisGenerator.ticks(5);
      }
      
      xAxis.call(xAxisGenerator);

      this.styleAxis(xAxis, 'x', {
        layout: config.layout,
        config: config,
        resolveColor,
        editMode,
        selectedElement,
        onElementSelect,
        xScale,
      });
    }

    // Y axis
    if (showYAxis && yScale) {
      // Position y-axis at zero line if there are negative values, otherwise at left
      let yAxisXPosition = graphArea.left;
      if (xScale && xScale.domain && !xScale.bandwidth) {
        const [xMin, xMax] = xScale.domain();
        if (xMin < 0 && xMax > 0) {
          // There are both positive and negative values - position at x=0
          yAxisXPosition = xScale(0);
        } else if (xMax <= 0) {
          // All values are negative - position at right
          yAxisXPosition = graphArea.right;
        }
      }
      
      const yAxis = g
        .append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${yAxisXPosition},0)`);

      // Get y-axis property for formatting
      let yProperty: any = null;
      if (context.tableProperties && config.encoding.y && !Array.isArray(config.encoding.y)) {
        const fieldName = config.encoding.y.field;
        yProperty = context.tableProperties.find(col => col.name === fieldName);
      }

      const yAxisGenerator = axisLeft(yScale);
      
      // Check if this is a temporal scale
      const yEncoding = config.encoding.y && !Array.isArray(config.encoding.y) ? config.encoding.y : null;
      const isTemporalY = yEncoding?.type === 'temporal';
      const isCategoricalY = yEncoding?.type === 'nominal' || yEncoding?.type === 'ordinal';
      
      // Apply custom tick format
      if (isCategoricalY && !yProperty) {
        // For categorical scales without property info, handle empty labels
        yAxisGenerator.tickFormat((d: any) => {
          const label = String(d);
          return (!label || label.trim() === '') ? 'None' : label;
        });
      } else if (isTemporalY) {
        // For temporal scales on Y axis, use appropriate date formatting
        const formatDate = timeFormat('%b %d');
        const formatYear = timeFormat('%Y');
        const formatMonth = timeFormat('%b %Y');
        
        yAxisGenerator.tickFormat((d: any) => {
          const date = d instanceof Date ? d : new Date(d);
          if (isNaN(date.getTime())) return String(d);
          
          // Use simpler format for Y axis
          const domain = yScale.domain();
          const domainSpan = domain[1] - domain[0];
          const msPerMonth = 30 * 24 * 60 * 60 * 1000;
          const msPerYear = 365 * 24 * 60 * 60 * 1000;
          
          if (domainSpan > msPerYear * 2) {
            return formatYear(date);
          } else if (domainSpan > msPerMonth * 3) {
            return formatMonth(date);
          } else {
            return formatDate(date);
          }
        });
        
        yAxisGenerator.ticks(5);
      } else if (yProperty && context.superstate) {
        // Use property-based formatting for non-temporal scales
        yAxisGenerator.tickFormat((d: any) => {
          if (d === null || d === undefined || d === '') {
            return 'None';
          }
          const formatted = displayTextForType(yProperty, d, context.superstate);
          return (!formatted || formatted.trim() === '') ? 'None' : formatted;
        });
      } else if (isCategoricalY) {
        // Default formatter for categorical Y axis that handles empty values
        yAxisGenerator.tickFormat((d: any) => {
          const label = String(d);
          return (!label || label.trim() === '') ? 'None' : label;
        });
      } else {
        // Default formatter that handles dates and other values
        yAxisGenerator.tickFormat((d: any) => {
          // Check if it's a date
          if (d instanceof Date) {
            const formatDay = timeFormat('%b %d');
            return formatDay(d);
          }
          // Check if it's a date string
          if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
            const date = new Date(d);
            if (!isNaN(date.getTime())) {
              const formatDay = timeFormat('%b %d');
              return formatDay(date);
            }
          }
          // For numbers, use the formatNumber function
          if (typeof d === 'number') {
            return formatNumber(d);
          }
          return String(d);
        });
      }
      
      if (!yScale.bandwidth && !isTemporalY) {
        // For numerical scales (non-temporal), limit the number of ticks
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
      // Position x-axis at zero line if there are negative values, otherwise at bottom
      let xAxisYPosition = graphArea.bottom;
      if (yScale && yScale.domain) {
        const [yMin, yMax] = yScale.domain();
        if (yMin < 0 && yMax > 0) {
          // There are both positive and negative values - position at y=0
          xAxisYPosition = yScale(0);
        } else if (yMax <= 0) {
          // All values are negative - position at top
          xAxisYPosition = graphArea.top;
        }
      }
      
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
        ctx.moveTo(graphArea.left, xAxisYPosition);
        ctx.lineTo(graphArea.right, xAxisYPosition);
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
          ctx.moveTo(x, xAxisYPosition);
          ctx.lineTo(x, xAxisYPosition + 5);
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
        let tickLabel: string;
        if (xProperty && context.superstate) {
          tickLabel = displayTextForType(xProperty, tick, context.superstate);
        } else if (tick instanceof Date) {
          const formatDay = timeFormat('%b %d');
          tickLabel = formatDay(tick);
        } else if (typeof tick === 'string' && /^\d{4}-\d{2}-\d{2}/.test(tick)) {
          const date = new Date(tick);
          if (!isNaN(date.getTime())) {
            const formatDay = timeFormat('%b %d');
            tickLabel = formatDay(date);
          } else {
            tickLabel = tick;
          }
        } else {
          tickLabel = String(tick);
        }
        
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
            
            ctx.fillText(truncatedLabel + '...', x, xAxisYPosition + 7);
          } else {
            ctx.fillText(tickLabel, x, xAxisYPosition + 7);
          }
        } else {
          ctx.fillText(tickLabel, x, xAxisYPosition + 7);
        }
      });
    }

    // Y axis
    if (showYAxis && yScale) {
      // Position y-axis at zero line if there are negative values, otherwise at left
      let yAxisXPosition = graphArea.left;
      if (xScale && xScale.domain && !xScale.bandwidth) {
        const [xMin, xMax] = xScale.domain();
        if (xMin < 0 && xMax > 0) {
          // There are both positive and negative values - position at x=0
          yAxisXPosition = xScale(0);
        } else if (xMax <= 0) {
          // All values are negative - position at right
          yAxisXPosition = graphArea.right;
        }
      }
      
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
        ctx.moveTo(yAxisXPosition, graphArea.top);
        ctx.lineTo(yAxisXPosition, graphArea.bottom);
        ctx.stroke();

        // Draw tick marks only when axis line is shown
        const ticks = yScale.ticks ? yScale.ticks(5) : yScale.domain();
        
        ticks.forEach((tick: any) => {
          const y = yScale(tick);
          
          // Tick mark
          ctx.strokeStyle = resolveColor(context.config.layout.yAxis?.tickColor || 'var(--mk-ui-text-primary)');
          ctx.beginPath();
          ctx.moveTo(yAxisXPosition - 5, y);
          ctx.lineTo(yAxisXPosition, y);
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
        let tickLabel: string;
        if (yProperty && context.superstate) {
          tickLabel = displayTextForType(yProperty, tick, context.superstate);
        } else if (tick instanceof Date) {
          const formatDay = timeFormat('%b %d');
          tickLabel = formatDay(tick);
        } else if (typeof tick === 'string' && /^\d{4}-\d{2}-\d{2}/.test(tick)) {
          const date = new Date(tick);
          if (!isNaN(date.getTime())) {
            const formatDay = timeFormat('%b %d');
            tickLabel = formatDay(date);
          } else {
            tickLabel = tick;
          }
        } else if (typeof tick === 'number') {
          tickLabel = formatNumber(tick);
        } else {
          tickLabel = String(tick);
        }
        ctx.fillText(tickLabel, yAxisXPosition - 7, y);
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
    
    // Add tooltips and text clipping for axis labels
    if (axisType === 'x') {
      const bandwidth = xScale && xScale.bandwidth ? xScale.bandwidth() : null;
      const maxWidth = bandwidth ? bandwidth - 4 : null; // Leave some padding for band scales
      
      // Check if this is a temporal axis to apply special styling
      const xEncoding = layout && config.config && config.config.encoding && config.config.encoding.x && 
                        !Array.isArray(config.config.encoding.x) ? config.config.encoding.x : null;
      const isTemporalX = xEncoding?.type === 'temporal';
      
      axis.selectAll('text').each(function(this: SVGTextElement, d: any, i: number) {
        const text = this;
        const originalText = text.textContent || '';
        
        // Apply special styling for month labels in temporal axes
        if (isTemporalX && originalText) {
          // Check if this is a month label (3 letters, like "Jan", "Feb", etc.)
          const isMonthLabel = /^[A-Z][a-z]{2}$/.test(originalText);
          
          if (isMonthLabel) {
            // Style month labels differently
            text.style.fontWeight = '600';
            text.style.fontSize = '12px';
            text.style.fill = resolveColor(layout.xAxis?.tickColor || 'var(--mk-ui-text-primary)');
          } else {
            // Style day numbers with lighter weight
            text.style.fontWeight = '400';
            text.style.fontSize = '10px';
            text.style.fill = resolveColor(layout.xAxis?.tickColor || 'var(--mk-ui-text-secondary)');
          }
        }
        let truncatedText = originalText;
        
        // Measure text width and truncate if needed (only for band scales)
        if (maxWidth && text.getBBox().width > maxWidth) {
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
          text.textContent = truncatedText;
        }
        
        // Always add tooltips for x-axis labels
        text.setAttribute('aria-label', originalText);
        text.setAttribute('title', originalText);
        
        // Add a title element for SVG hover (works better in some browsers)
        const existingTitle = text.querySelector('title');
        if (existingTitle) {
          existingTitle.textContent = originalText;
        } else {
          const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
          title.textContent = originalText;
          text.appendChild(title);
        }
      });
    }
    
    // Add tooltips for y-axis labels
    if (axisType === 'y') {
      axis.selectAll('text').each(function(this: SVGTextElement) {
        const text = this;
        const originalText = text.textContent || '';
        
        // Always add tooltips for y-axis labels
        text.setAttribute('aria-label', originalText);
        text.setAttribute('title', originalText);
        
        // Add a title element for SVG hover
        const existingTitle = text.querySelector('title');
        if (existingTitle) {
          existingTitle.textContent = originalText;
        } else {
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
          .text(typeof xMin === 'number' ? formatNumber(xMin) : xMin);

        boundsGroup
          .append('text')
          .attr('x', graphArea.right)
          .attr('y', graphArea.bottom + 15)
          .attr('text-anchor', 'end')
          .style('font-size', labelStyle.fontSize)
          .style('fill', labelStyle.fill)
          .style('font-weight', labelStyle.fontWeight)
          .text(typeof xMax === 'number' ? formatNumber(xMax) : xMax);
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
          .text(typeof yMin === 'number' ? formatNumber(yMin) : yMin);

        boundsGroup
          .append('text')
          .attr('x', graphArea.left - 5)
          .attr('y', graphArea.top)
          .attr('text-anchor', 'end')
          .attr('dy', '0.32em')
          .style('font-size', labelStyle.fontSize)
          .style('fill', labelStyle.fill)
          .style('font-weight', labelStyle.fontWeight)
          .text(typeof yMax === 'number' ? formatNumber(yMax) : yMax);
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
        ctx.fillText(typeof xMin === 'number' ? formatNumber(xMin) : String(xMin), graphArea.left, graphArea.bottom + 15);
        
        ctx.textAlign = 'end';
        ctx.fillText(typeof xMax === 'number' ? formatNumber(xMax) : String(xMax), graphArea.right, graphArea.bottom + 15);
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
        ctx.fillText(typeof yMin === 'number' ? formatNumber(yMin) : String(yMin), graphArea.left - 5, graphArea.bottom);
        ctx.fillText(typeof yMax === 'number' ? formatNumber(yMax) : String(yMax), graphArea.left - 5, graphArea.top);
      }

      ctx.restore();
    }
  }
}