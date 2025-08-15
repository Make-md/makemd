import * as d3 from 'd3';
import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';
import { displayTextForType } from 'core/utils/displayTextForType';

export class HeatmapUtility {
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
    const yEncoding = Array.isArray(config.encoding.y) ? config.encoding.y[0] : config.encoding.y;
    const colorEncoding = config.encoding.color;
    
    if (!xEncoding?.field || !yEncoding?.field || !colorEncoding?.field) return;

    // Get unique x and y values
    const xValues = Array.from(new Set(processedData.map(d => String(d[xEncoding.field]))));
    const yValues = Array.from(new Set(processedData.map(d => String(d[yEncoding.field]))));

    // Calculate cell dimensions based on scale type
    let cellWidth: number;
    let cellHeight: number;
    
    if (xScale.bandwidth) {
      cellWidth = xScale.bandwidth();
    } else {
      cellWidth = graphArea.width / xValues.length;
    }
    
    if (yScale.bandwidth) {
      cellHeight = yScale.bandwidth();
    } else {
      cellHeight = graphArea.height / yValues.length;
    }

    // Create color scale for values
    const colorValues = processedData.map(d => Number(d[colorEncoding.field]) || 0);
    const colorExtent = d3.extent(colorValues) as [number, number];
    
    // Use custom color scale or default to Viridis
    const colorScheme = config.scale?.color?.scheme || 'viridis';
    const interpolators: { [key: string]: (t: number) => string } = {
      'viridis': d3.interpolateViridis,
      'inferno': d3.interpolateInferno,
      'magma': d3.interpolateMagma,
      'plasma': d3.interpolatePlasma,
      'blues': d3.interpolateBlues,
      'greens': d3.interpolateGreens,
      'reds': d3.interpolateReds,
      'warm': d3.interpolateWarm,
      'cool': d3.interpolateCool,
    };
    
    const colorScale = d3.scaleSequential()
      .domain(colorExtent)
      .interpolator(interpolators[colorScheme] || d3.interpolateViridis);

    // Create data map for quick lookup
    const dataMap = new Map<string, any>();
    processedData.forEach(d => {
      const key = `${d[xEncoding.field]}-${d[yEncoding.field]}`;
      dataMap.set(key, d);
    });

    // Draw cells
    const cells = g.selectAll('.heatmap-cell')
      .data(processedData)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', (d: any) => {
        if (xScale.bandwidth) {
          return xScale(String(d[xEncoding.field]));
        } else {
          const xIndex = xValues.indexOf(String(d[xEncoding.field]));
          return graphArea.left + xIndex * cellWidth;
        }
      })
      .attr('y', (d: any) => {
        if (yScale.bandwidth) {
          return yScale(String(d[yEncoding.field]));
        } else {
          const yIndex = yValues.indexOf(String(d[yEncoding.field]));
          return graphArea.top + yIndex * cellHeight;
        }
      })
      .attr('width', cellWidth - 1)
      .attr('height', cellHeight - 1)
      .attr('fill', (d: any) => {
        const value = Number(d[colorEncoding.field]) || 0;
        return colorScale(value);
      })
      .attr('stroke', 'white')
      .attr('stroke-width', 1);

    // Add hover effects with tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'heatmap-tooltip')
      .style('position', 'absolute')
      .style('padding', '8px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    cells
      .on('mouseenter', function(event, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke', 'black')
          .attr('stroke-width', 2);
        
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        
        // Get cell color
        const cellElement = d3.select(this);
        const cellColor = cellElement.attr('fill');
        
        // Build tooltip content
        let tooltipContent = '';
        
        // Primary field (X value) with color square
        const xValue = d[xEncoding.field];
        const xProp = context.tableProperties?.find(p => p.name === xEncoding.field);
        const formattedX = xProp ? displayTextForType(xProp, xValue, context.superstate) : xValue;
        
        tooltipContent += `<div style="display: flex; align-items: center; gap: 8px;">`;
        tooltipContent += `<div style="width: 12px; height: 12px; background-color: ${cellColor}; border-radius: 2px; flex-shrink: 0;"></div>`;
        tooltipContent += `<div>${formattedX}</div>`;
        tooltipContent += `</div>`;
        
        // Secondary fields (indented)
        tooltipContent += `<div style="margin-left: 20px; margin-top: 4px;">`;
        
        // Y value
        const yValue = d[yEncoding.field];
        const yProp = context.tableProperties?.find(p => p.name === yEncoding.field);
        const formattedY = yProp ? displayTextForType(yProp, yValue, context.superstate) : yValue;
        tooltipContent += `${formattedY}<br/>`;
        
        // Color/value field
        const colorValue = d[colorEncoding.field];
        const colorProp = context.tableProperties?.find(p => p.name === colorEncoding.field);
        const formattedColor = colorProp ? displayTextForType(colorProp, colorValue, context.superstate) : colorValue;
        tooltipContent += `${formattedColor}`;
        
        tooltipContent += `</div>`;
        
        tooltip.html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke', 'white')
          .attr('stroke-width', 1);
        
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Add interactivity for edit mode
    if (editMode) {
      cells
        .style('cursor', 'pointer')
        .on('click', function(event, d: any) {
          if (onElementSelect) {
            onElementSelect({
              type: 'series',
              id: `cell-${d[xEncoding.field]}-${d[yEncoding.field]}`,
            });
          }
        });

      // Add selection indicator
      if (selectedElement?.type === 'series') {
        cells.each(function(d: any) {
          const id = `cell-${d[xEncoding.field]}-${d[yEncoding.field]}`;
          if (selectedElement.id === id) {
            d3.select(this)
              .style('stroke', 'var(--mk-ui-accent)')
              .style('stroke-width', 3);
          }
        });
      }
    }

    // Add data labels if enabled
    if ((showDataLabels || config.mark?.dataLabels?.show)) {
      g.selectAll('.heatmap-label')
        .data(processedData)
        .enter()
        .append('text')
        .attr('class', 'heatmap-label')
        .attr('x', (d: any) => {
          if (xScale.bandwidth) {
            return xScale(String(d[xEncoding.field])) + cellWidth / 2;
          } else {
            const xIndex = xValues.indexOf(String(d[xEncoding.field]));
            return graphArea.left + xIndex * cellWidth + cellWidth / 2;
          }
        })
        .attr('y', (d: any) => {
          if (yScale.bandwidth) {
            return yScale(String(d[yEncoding.field])) + cellHeight / 2;
          } else {
            const yIndex = yValues.indexOf(String(d[yEncoding.field]));
            return graphArea.top + yIndex * cellHeight + cellHeight / 2;
          }
        })
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', `${config.mark?.dataLabels?.fontSize || 10}px`)
        .style('fill', (d: any) => {
          // Use white or black text based on background brightness
          const value = Number(d[colorEncoding.field]) || 0;
          const normalizedValue = (value - colorExtent[0]) / (colorExtent[1] - colorExtent[0]);
          return normalizedValue > 0.5 ? 'white' : 'black';
        })
        .text((d: any) => d[colorEncoding.field]);
    }

    // Store tooltip cleanup function
    (g.node() as any).__heatmapTooltip = tooltip;
  }

  private static renderCanvas(context: RenderContext): void {
    if (!isCanvasContext(context)) return;

    const { ctx, processedData, scales, config, graphArea, resolveColor } = context;
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    
    if (!xScale || !yScale) return;

    const xEncoding = Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x;
    const yEncoding = Array.isArray(config.encoding.y) ? config.encoding.y[0] : config.encoding.y;
    const colorEncoding = config.encoding.color;
    
    if (!xEncoding?.field || !yEncoding?.field || !colorEncoding?.field) return;

    // Get unique x and y values
    const xValues = Array.from(new Set(processedData.map(d => String(d[xEncoding.field]))));
    const yValues = Array.from(new Set(processedData.map(d => String(d[yEncoding.field]))));

    // Calculate cell dimensions based on scale type
    let cellWidth: number;
    let cellHeight: number;
    
    if (xScale.bandwidth) {
      cellWidth = xScale.bandwidth();
    } else {
      cellWidth = graphArea.width / xValues.length;
    }
    
    if (yScale.bandwidth) {
      cellHeight = yScale.bandwidth();
    } else {
      cellHeight = graphArea.height / yValues.length;
    }

    // Create color scale for values
    const colorValues = processedData.map(d => Number(d[colorEncoding.field]) || 0);
    const colorExtent = d3.extent(colorValues) as [number, number];
    
    // Use custom color scale or default to Viridis
    const colorScheme = config.scale?.color?.scheme || 'viridis';
    const interpolators: { [key: string]: (t: number) => string } = {
      'viridis': d3.interpolateViridis,
      'inferno': d3.interpolateInferno,
      'magma': d3.interpolateMagma,
      'plasma': d3.interpolatePlasma,
      'blues': d3.interpolateBlues,
      'greens': d3.interpolateGreens,
      'reds': d3.interpolateReds,
      'warm': d3.interpolateWarm,
      'cool': d3.interpolateCool,
    };
    
    const colorScale = d3.scaleSequential()
      .domain(colorExtent)
      .interpolator(interpolators[colorScheme] || d3.interpolateViridis);

    ctx.save();

    // Draw cells
    processedData.forEach(d => {
      let x: number;
      let y: number;
      
      if (xScale.bandwidth) {
        x = xScale(String(d[xEncoding.field]));
      } else {
        const xIndex = xValues.indexOf(String(d[xEncoding.field]));
        x = graphArea.left + xIndex * cellWidth;
      }
      
      if (yScale.bandwidth) {
        y = yScale(String(d[yEncoding.field]));
      } else {
        const yIndex = yValues.indexOf(String(d[yEncoding.field]));
        y = graphArea.top + yIndex * cellHeight;
      }
      const value = Number(d[colorEncoding.field]) || 0;
      
      // Fill cell
      ctx.fillStyle = colorScale(value);
      ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1);
      
      // Draw border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellWidth - 1, cellHeight - 1);
      
      // Draw label if enabled
      if (config.mark?.dataLabels?.show) {
        ctx.save();
        
        // Determine text color based on background brightness
        const normalizedValue = (value - colorExtent[0]) / (colorExtent[1] - colorExtent[0]);
        ctx.fillStyle = normalizedValue > 0.5 ? 'white' : 'black';
        
        ctx.font = `${config.mark?.dataLabels?.fontSize || 10}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText(
          String(value),
          x + cellWidth / 2,
          y + cellHeight / 2
        );
        
        ctx.restore();
      }
    });

    ctx.restore();
  }
}