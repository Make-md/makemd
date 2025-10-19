import { histogram, max, select, axisBottom } from 'core/utils/d3-imports';
import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';

export class HistogramUtility {
  static render(context: RenderContext): void {
    if (isSVGContext(context)) {
      this.renderSVG(context);
    } else if (isCanvasContext(context)) {
      this.renderCanvas(context);
    }
  }

  private static renderSVG(context: RenderContext): void {
    if (!isSVGContext(context)) return;

    const { g, processedData, scales, config, graphArea, editMode, selectedElement, onElementSelect, showDataLabels, resolveColor } = context;
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    
    if (!xScale || !yScale) return;

    const xEncoding = Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x;
    
    if (!xEncoding?.field) return;

    // Get bin configuration
    const binCount = (!Array.isArray(config.encoding.x) ? (config.encoding.x as any)?.bin : null) === true ? 10 : 
                    (typeof (!Array.isArray(config.encoding.x) ? (config.encoding.x as any)?.bin : null) === 'object' ? (!Array.isArray(config.encoding.x) ? (config.encoding.x as any).bin.maxbins : 10) || 10 : 10);

    // Extract values for binning
    const values = processedData
      .map(d => Number(d[xEncoding.field]))
      .filter(v => !isNaN(v));

    // Create histogram generator
    const histogramGen = histogram()
      .domain(xScale.domain() as [number, number])
      .thresholds(binCount);

    // Generate bins
    const bins = histogramGen(values);

    // Update y scale to use frequency
    const maxFrequency = max(bins, d => d.length) || 0;
    yScale.domain([0, maxFrequency]);

    // Calculate bar width
    const barWidth = graphArea.width / bins.length;
    const barPadding = barWidth * 0.1;

    // Draw bars
    const bars = g.selectAll('.histogram-bar')
      .data(bins)
      .enter()
      .append('rect')
      .attr('class', 'histogram-bar')
      .attr('x', (d: any, i: number) => graphArea.left + i * barWidth + barPadding / 2)
      .attr('y', (d: any) => yScale(d.length))
      .attr('width', barWidth - barPadding)
      .attr('height', (d: any) => graphArea.bottom - yScale(d.length))
      .attr('fill', resolveColor(config.mark?.fill || 'var(--mk-ui-accent)'))
      .attr('stroke', resolveColor(config.mark?.stroke || 'none'))
      .attr('stroke-width', config.mark?.strokeWidth || 0);

    // Add hover effects
    bars
      .on('mouseenter', function() {
        select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', 0.8);
      })
      .on('mouseleave', function() {
        select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', 1);
      });

    // Add interactivity for edit mode
    if (editMode) {
      bars
        .style('cursor', 'pointer')
        .on('click', function(event, d: any) {
          if (onElementSelect) {
            const binIndex = bins.indexOf(d);
            onElementSelect({
              type: 'series',
              id: `histogram-bin-${binIndex}`,
            });
          }
        });

      // Add selection indicator
      if (selectedElement?.type === 'series') {
        bars.each(function(d: any, i: number) {
          const id = `histogram-bin-${i}`;
          if (selectedElement.id === id) {
            select(this)
              .style('stroke', 'var(--mk-ui-accent)')
              .style('stroke-width', 2)
              .style('stroke-dasharray', '4,2');
          }
        });
      }
    }

    // Add data labels
    if ((showDataLabels || config.mark?.dataLabels?.show)) {
      g.selectAll('.histogram-label')
        .data(bins)
        .enter()
        .append('text')
        .attr('class', 'histogram-label')
        .attr('x', (d: any, i: number) => graphArea.left + i * barWidth + barWidth / 2)
        .attr('y', (d: any) => yScale(d.length) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', `${config.mark?.dataLabels?.fontSize || 10}px`)
        .style('fill', resolveColor(config.mark?.dataLabels?.color || 'var(--mk-ui-text-primary)'))
        .text((d: any) => d.length);
    }

    // Update x-axis to show bin ranges
    const xAxis = g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${graphArea.bottom})`);

    // Create custom tick values for bin edges
    const tickValues = bins.map(bin => bin.x0!);
    if (bins.length > 0 && bins[bins.length - 1].x1) {
      tickValues.push(bins[bins.length - 1].x1);
    }

    xAxis.call(
      axisBottom(xScale)
        .tickValues(tickValues)
        .tickFormat((d: any) => {
          const num = Number(d);
          return isNaN(num) ? String(d) : num.toFixed(1);
        })
    );

    // Style the axis
    if (context.showXAxis) {
      xAxis.selectAll('text')
        .style('fill', resolveColor('var(--mk-ui-text-primary)'))
        .style('font-size', '11px');
      
      xAxis.selectAll('line')
        .style('stroke', resolveColor('var(--mk-ui-border)'));
      
      xAxis.select('.domain')
        .style('stroke', resolveColor('var(--mk-ui-border)'));
    } else {
      xAxis.remove();
    }
  }

  private static renderCanvas(context: RenderContext): void {
    if (!isCanvasContext(context)) return;

    const { ctx, processedData, scales, config, graphArea, resolveColor } = context;
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    
    if (!xScale || !yScale) return;

    const xEncoding = Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x;
    
    if (!xEncoding?.field) return;

    // Get bin configuration
    const binCount = (!Array.isArray(config.encoding.x) ? (config.encoding.x as any)?.bin : null) === true ? 10 : 
                    (typeof (!Array.isArray(config.encoding.x) ? (config.encoding.x as any)?.bin : null) === 'object' ? (!Array.isArray(config.encoding.x) ? (config.encoding.x as any).bin.maxbins : 10) || 10 : 10);

    // Extract values for binning
    const values = processedData
      .map(d => Number(d[xEncoding.field]))
      .filter(v => !isNaN(v));

    // Create histogram generator
    const histogramGen = histogram()
      .domain(xScale.domain() as [number, number])
      .thresholds(binCount);

    // Generate bins
    const bins = histogramGen(values);

    // Update y scale to use frequency
    const maxFrequency = max(bins, d => d.length) || 0;
    yScale.domain([0, maxFrequency]);

    // Calculate bar width
    const barWidth = graphArea.width / bins.length;
    const barPadding = barWidth * 0.1;

    ctx.save();

    // Draw bars
    ctx.fillStyle = resolveColor(config.mark?.fill || 'var(--mk-ui-accent)');
    
    bins.forEach((bin, i) => {
      const x = graphArea.left + i * barWidth + barPadding / 2;
      const y = yScale(bin.length);
      const width = barWidth - barPadding;
      const height = graphArea.bottom - y;
      
      ctx.fillRect(x, y, width, height);
      
      // Draw stroke if specified
      if (config.mark?.stroke) {
        ctx.strokeStyle = resolveColor(config.mark.stroke);
        ctx.lineWidth = config.mark.strokeWidth || 1;
        ctx.strokeRect(x, y, width, height);
      }
    });

    // Draw data labels if enabled
    if (config.mark?.dataLabels?.show) {
      ctx.fillStyle = resolveColor(config.mark?.dataLabels?.color || 'var(--mk-ui-text-primary)');
      ctx.font = `${config.mark?.dataLabels?.fontSize || 10}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      bins.forEach((bin, i) => {
        const x = graphArea.left + i * barWidth + barWidth / 2;
        const y = yScale(bin.length) - 5;
        ctx.fillText(String(bin.length), x, y);
      });
    }

    ctx.restore();
  }
}