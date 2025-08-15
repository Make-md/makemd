import { select } from 'core/utils/d3-imports';
import type { ScaleBand } from 'core/utils/d3-imports';
import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';
import { displayTextForType } from 'core/utils/displayTextForType';
import { getPaletteColors } from '../utils';

export class ScatterPlotUtility {
  static render(context: RenderContext): void {
    if (isSVGContext(context)) {
      this.renderSVG(context);
    } else if (isCanvasContext(context)) {
      this.renderCanvas(context);
    }
  }

  private static renderSVG(context: RenderContext): void {
    if (!isSVGContext(context)) return;

    const { g, svg, processedData, scales, config, graphArea, editMode, selectedElement, onElementSelect, showDataLabels, showLegend, resolveColor } = context;
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    
    if (!xScale || !yScale) return;

    // Handle multiple encodings for scatter plot
    const xEncodings = Array.isArray(config.encoding.x) ? config.encoding.x : (config.encoding.x ? [config.encoding.x] : []);
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : (config.encoding.y ? [config.encoding.y] : []);
    
    if (xEncodings.length === 0 || yEncodings.length === 0) return;

    const themeColors = getPaletteColors(context.colorPaletteId, context.superstate);

    // Get color and size scales if they exist
    const colorScale = scales.get('color');
    const sizeScale = scales.get('size');
    const colorField = config.encoding.color?.field;
    const sizeField = config.encoding.size?.field;

    // Default point size
    const defaultSize = config.mark?.size || 4;

    // Helper function to get X position based on scale type
    const getXPosition = (d: any, xEncoding: any) => {
      const value = d[xEncoding.field];
      if (xEncoding.type === 'quantitative') {
        return xScale(Number(value));
      } else if (xEncoding.type === 'temporal') {
        return xScale(new Date(String(value)));
      } else {
        // For band scales, use the center of the band
        const bandScale = xScale as ScaleBand<string>;
        const bandWidth = bandScale.bandwidth ? bandScale.bandwidth() : 0;
        const bandStart = bandScale(String(value));
        return bandStart !== undefined ? bandStart + bandWidth / 2 : 0;
      }
    };

    // Helper function to get Y position based on scale type
    const getYPosition = (d: any, yEncoding: any) => {
      const value = d[yEncoding.field];
      if (yEncoding.type === 'quantitative') {
        return yScale(Number(value));
      } else if (yEncoding.type === 'temporal') {
        return yScale(new Date(String(value)));
      } else {
        // For band scales, use the center of the band
        const bandScale = yScale as ScaleBand<string>;
        const bandWidth = bandScale.bandwidth ? bandScale.bandwidth() : 0;
        const bandStart = bandScale(String(value));
        return bandStart !== undefined ? bandStart + bandWidth / 2 : 0;
      }
    };

    // Store legend items if color encoding exists
    const legendItems: Array<{ label: string; color: string }> = [];
    const colorMap = new Map<string, string>();

    if (colorField && colorScale) {
      const uniqueValues = Array.from(new Set(processedData.map(d => String(d[colorField]))));
      uniqueValues.forEach((value: string) => {
        const color = colorScale(value);
        colorMap.set(value, color);
        legendItems.push({ label: value, color });
      });
    }

    // Add left border reference line for scatter plots without y-axis
    if (!context.showYAxis && config.chartType === 'scatter') {
      g.append('line')
        .attr('class', 'left-border')
        .attr('x1', graphArea.left)
        .attr('y1', graphArea.top)
        .attr('x2', graphArea.left)
        .attr('y2', graphArea.bottom)
        .style('stroke', resolveColor('var(--mk-ui-border)'))
        .style('stroke-width', 1)
        .style('opacity', 0.3);
    }

    // Create tooltip
    const tooltip = select('body').append('div')
      .attr('class', 'scatter-tooltip')
      .style('position', 'absolute')
      .style('padding', '8px 12px')
      .style('background', resolveColor('var(--mk-ui-background)'))
      .style('color', resolveColor('var(--mk-ui-text-primary)'))
      .style('border', `1px solid ${resolveColor('var(--mk-ui-border)')}`)
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.15)')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 10000);

    // Create points for each series combination
    let seriesIndex = 0;
    xEncodings.forEach((xEncoding, xIndex) => {
      yEncodings.forEach((yEncoding, yIndex) => {
        if (!xEncoding?.field || !yEncoding?.field) return;
        
        const seriesColor = themeColors[seriesIndex % themeColors.length];
        
        const points = g.selectAll(`.dot-${xIndex}-${yIndex}`)
          .data(processedData.filter(d => d[xEncoding.field] != null && d[yEncoding.field] != null))
          .enter()
          .append('circle')
          .attr('class', `dot dot-${xIndex}-${yIndex}`)
          .attr('cx', (d: any) => getXPosition(d, xEncoding))
          .attr('cy', (d: any) => getYPosition(d, yEncoding))
          .attr('r', (d: any) => {
            if (sizeField && sizeScale) {
              return sizeScale(d[sizeField]);
            }
            return defaultSize;
          })
          .attr('fill', (d: any) => {
            if (colorField && colorScale) {
              return colorScale(d[colorField]);
            }
            return seriesColor;
          })
          .attr('fill-opacity', config.mark?.fillOpacity || 0.7)
          .attr('stroke', 'none')
          .attr('stroke-width', 0)
          .style('cursor', 'pointer');

        seriesIndex++;
      });
    });

    // Add hover effects and tooltips to all points
    g.selectAll('.dot')
      .on('mouseover', function(event, d: any) {
        // Enlarge point and increase opacity on hover
        select(this)
          .transition()
          .duration(150)
          .attr('r', function() {
            const currentR = Number(select(this).attr('r'));
            return currentR * 1.2;
          })
          .attr('fill-opacity', 1);
        
        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        
        // Build tooltip content
        let tooltipContent = '';
        
        // Get point color
        const pointElement = select(this);
        const pointColor = pointElement.attr('fill');
        
        // Get the class to determine which series this point belongs to
        const pointClass = select(this).attr('class');
        const match = pointClass.match(/dot-(\d+)-(\d+)/);
        const xIndex = match ? parseInt(match[1]) : 0;
        const yIndex = match ? parseInt(match[2]) : 0;
        const xEncoding = xEncodings[xIndex];
        const yEncoding = yEncodings[yIndex];
        
        // Primary field (X value) with color square
        const xValue = d[xEncoding.field];
        const xProp = context.tableProperties?.find(p => p.name === xEncoding.field);
        const formattedX = xProp ? displayTextForType(xProp, xValue, context.superstate) : xValue;
        
        tooltipContent += `<div style="display: flex; align-items: center; gap: 8px;">`;
        tooltipContent += `<div style="width: 12px; height: 12px; background-color: ${pointColor}; border-radius: 2px; flex-shrink: 0;"></div>`;
        tooltipContent += `<div>${formattedX}</div>`;
        tooltipContent += `</div>`;
        
        // Secondary fields (indented)
        tooltipContent += `<div style="margin-left: 20px; margin-top: 4px;">`;
        
        // Y value
        const yValue = d[yEncoding.field];
        const yProp = context.tableProperties?.find(p => p.name === yEncoding.field);
        const formattedY = yProp ? displayTextForType(yProp, yValue, context.superstate) : yValue;
        tooltipContent += `${formattedY}`;
        
        // Color field value if present
        if (colorField) {
          const colorValue = d[colorField];
          const colorProp = context.tableProperties?.find(p => p.name === colorField);
          const formattedColor = colorProp ? displayTextForType(colorProp, colorValue, context.superstate) : colorValue;
          tooltipContent += `<br/>${formattedColor}`;
        }
        
        // Size field value if present
        if (sizeField) {
          const sizeValue = d[sizeField];
          const sizeProp = context.tableProperties?.find(p => p.name === sizeField);
          const formattedSize = sizeProp ? displayTextForType(sizeProp, sizeValue, context.superstate) : sizeValue;
          tooltipContent += `<br/>${formattedSize}`;
        }
        
        tooltipContent += `</div>`;
        
        tooltip.html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function(event, d: any) {
        // Restore point size and opacity
        select(this)
          .transition()
          .duration(150)
          .attr('r', () => {
            if (sizeField && sizeScale) {
              return sizeScale(d[sizeField]);
            }
            return defaultSize;
          })
          .attr('fill-opacity', config.mark?.fillOpacity || 0.7);
        
        // Hide tooltip
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Add interactivity for edit mode
    if (editMode) {
      g.selectAll('.dot').on('click', function(event, d: any) {
        if (onElementSelect) {
          const pointClass = select(this).attr('class');
          const match = pointClass.match(/dot-(\d+)-(\d+)/);
          const xIndex = match ? parseInt(match[1]) : 0;
          const yIndex = match ? parseInt(match[2]) : 0;
          const xEncoding = xEncodings[xIndex];
          const yEncoding = yEncodings[yIndex];
          
          onElementSelect({
            type: 'series',
            id: `point-${d[xEncoding.field]}-${d[yEncoding.field]}`,
          });
        }
      });

      // Add selection indicator
      if (selectedElement?.type === 'series') {
        g.selectAll('.dot').each(function(d: any) {
          const pointClass = select(this).attr('class');
          const match = pointClass.match(/dot-(\d+)-(\d+)/);
          const xIndex = match ? parseInt(match[1]) : 0;
          const yIndex = match ? parseInt(match[2]) : 0;
          const xEncoding = xEncodings[xIndex];
          const yEncoding = yEncodings[yIndex];
          
          const id = `point-${d[xEncoding.field]}-${d[yEncoding.field]}`;
          if (selectedElement.id === id) {
            select(this)
              .style('stroke', 'var(--mk-ui-accent)')
              .style('stroke-width', 3)
              .style('stroke-dasharray', '4,2');
          }
        });
      }
    }

    // Add data labels if enabled
    if ((showDataLabels || config.mark?.dataLabels?.show) && processedData.length < 100) {
      let labelIndex = 0;
      xEncodings.forEach((xEncoding, xIndex) => {
        yEncodings.forEach((yEncoding, yIndex) => {
          if (!xEncoding?.field || !yEncoding?.field) return;
          
          g.selectAll(`.scatter-label-${xIndex}-${yIndex}`)
            .data(processedData.filter(d => d[xEncoding.field] != null && d[yEncoding.field] != null))
            .enter()
            .append('text')
            .attr('class', `scatter-label scatter-label-${xIndex}-${yIndex}`)
            .attr('x', (d: any) => getXPosition(d, xEncoding))
            .attr('y', (d: any) => {
              const y = getYPosition(d, yEncoding);
              const r = sizeField && sizeScale ? sizeScale(d[sizeField]) : defaultSize;
              return y - r - 5;
            })
            .attr('text-anchor', 'middle')
            .style('font-size', `${config.mark?.dataLabels?.fontSize || 10}px`)
            .style('fill', resolveColor(config.mark?.dataLabels?.color || 'var(--mk-ui-text-primary)'))
            .style('font-weight', '500')
            .text((d: any) => {
              const xVal = d[xEncoding.field];
              const yVal = d[yEncoding.field];
              const xFormatted = Number.isInteger(Number(xVal)) ? xVal : Number(xVal).toFixed(1);
              const yFormatted = Number.isInteger(Number(yVal)) ? yVal : Number(yVal).toFixed(1);
              return `(${xFormatted}, ${yFormatted})`;
            });
          
          labelIndex++;
        });
      });
    }

    // Store legend items for later rendering
    if (showLegend) {
      if (legendItems.length > 0) {
        (svg as any)._legendItems = legendItems;
      } else if (xEncodings.length > 1 || yEncodings.length > 1) {
        // Create legend for multiple series
        const seriesLegendItems: Array<{ label: string; color: string }> = [];
        let seriesIndex = 0;
        xEncodings.forEach((xEncoding, xIndex) => {
          yEncodings.forEach((yEncoding, yIndex) => {
            if (!xEncoding?.field || !yEncoding?.field) return;
            
            const seriesColor = themeColors[seriesIndex % themeColors.length];
            const label = xEncodings.length > 1 && yEncodings.length > 1 
              ? `${xEncoding.field} vs ${yEncoding.field}`
              : xEncodings.length > 1 
                ? xEncoding.field 
                : yEncoding.field;
            
            seriesLegendItems.push({ label, color: seriesColor });
            seriesIndex++;
          });
        });
        (svg as any)._legendItems = seriesLegendItems;
      }
    }

    // Store tooltip reference for cleanup
    (svg.node() as any).__scatterTooltip = tooltip;
  }

  private static renderCanvas(context: RenderContext): void {
    if (!isCanvasContext(context)) return;

    const { ctx, processedData, scales, config, graphArea, resolveColor } = context;
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    
    if (!xScale || !yScale) return;

    // Handle multiple encodings for scatter plot
    const xEncodings = Array.isArray(config.encoding.x) ? config.encoding.x : (config.encoding.x ? [config.encoding.x] : []);
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : (config.encoding.y ? [config.encoding.y] : []);
    
    if (xEncodings.length === 0 || yEncodings.length === 0) return;

    const themeColors = getPaletteColors(context.colorPaletteId, context.superstate);

    // Get color and size scales if they exist
    const colorScale = scales.get('color');
    const sizeScale = scales.get('size');
    const colorField = config.encoding.color?.field;
    const sizeField = config.encoding.size?.field;

    // Default point size
    const defaultSize = config.mark?.size || 4;

    // Helper function to get X position based on scale type
    const getXPosition = (d: any, xEncoding: any) => {
      const value = d[xEncoding.field];
      if (xEncoding.type === 'quantitative') {
        return xScale(Number(value));
      } else if (xEncoding.type === 'temporal') {
        return xScale(new Date(String(value)));
      } else {
        // For band scales, use the center of the band
        const bandScale = xScale as ScaleBand<string>;
        const bandWidth = bandScale.bandwidth ? bandScale.bandwidth() : 0;
        const bandStart = bandScale(String(value));
        return bandStart !== undefined ? bandStart + bandWidth / 2 : 0;
      }
    };

    // Helper function to get Y position based on scale type
    const getYPosition = (d: any, yEncoding: any) => {
      const value = d[yEncoding.field];
      if (yEncoding.type === 'quantitative') {
        return yScale(Number(value));
      } else if (yEncoding.type === 'temporal') {
        return yScale(new Date(String(value)));
      } else {
        // For band scales, use the center of the band
        const bandScale = yScale as ScaleBand<string>;
        const bandWidth = bandScale.bandwidth ? bandScale.bandwidth() : 0;
        const bandStart = bandScale(String(value));
        return bandStart !== undefined ? bandStart + bandWidth / 2 : 0;
      }
    };

    // Add left border reference line for scatter plots without y-axis
    if (!context.showYAxis && config.chartType === 'scatter') {
      ctx.save();
      ctx.strokeStyle = resolveColor('var(--mk-ui-border)');
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(graphArea.left, graphArea.top);
      ctx.lineTo(graphArea.left, graphArea.bottom);
      ctx.stroke();
      ctx.restore();
    }

    // Draw points for each series combination
    let seriesIndex = 0;
    xEncodings.forEach((xEncoding, xIndex) => {
      yEncodings.forEach((yEncoding, yIndex) => {
        if (!xEncoding?.field || !yEncoding?.field) return;
        
        const seriesColor = themeColors[seriesIndex % themeColors.length];
        
        processedData.forEach((d: any) => {
          const xValue = d[xEncoding.field];
          const yValue = d[yEncoding.field];
          
          if (xValue == null || yValue == null) return;
          
          const x = getXPosition(d, xEncoding);
          const y = getYPosition(d, yEncoding);
          const radius = sizeField && sizeScale ? sizeScale(d[sizeField]) : defaultSize;
          
          // Determine fill color
          let fillColor = seriesColor;
          if (colorField && colorScale) {
            fillColor = colorScale(d[colorField]);
          }
          
          // Determine stroke color
          let strokeColor = 'none';
          if (config.mark?.stroke) {
            strokeColor = resolveColor(config.mark.stroke);
          } else if (colorField && colorScale) {
            strokeColor = colorScale(d[colorField]);
          }
          
          // Draw point
          ctx.save();
          ctx.globalAlpha = config.mark?.fillOpacity || 0.7;
          ctx.fillStyle = fillColor;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();
          
          if (strokeColor !== 'none') {
            ctx.globalAlpha = config.mark?.strokeOpacity || 1;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = config.mark?.strokeWidth || 1;
            ctx.stroke();
          }
          
          // Draw debug outline if enabled
          if (context.debugMode) {
            ctx.save();
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(x - radius - 2, y - radius - 2, (radius + 2) * 2, (radius + 2) * 2);
            ctx.restore();
          }
          
          ctx.restore();
        });
        
        seriesIndex++;
      });
    });

    // Draw data labels if enabled
    if ((config.mark?.dataLabels?.show) && processedData.length < 100) {
      ctx.save();
      ctx.fillStyle = resolveColor(config.mark.dataLabels.color || 'var(--mk-ui-text-primary)');
      ctx.font = `500 ${config.mark.dataLabels.fontSize || 10}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      xEncodings.forEach((xEncoding, xIndex) => {
        yEncodings.forEach((yEncoding, yIndex) => {
          if (!xEncoding?.field || !yEncoding?.field) return;
          
          processedData.forEach((d: any) => {
            const xValue = d[xEncoding.field];
            const yValue = d[yEncoding.field];
            
            if (xValue == null || yValue == null) return;
            
            const x = getXPosition(d, xEncoding);
            const y = getYPosition(d, yEncoding);
            const radius = sizeField && sizeScale ? sizeScale(d[sizeField]) : defaultSize;
            
            const xFormatted = Number.isInteger(Number(xValue)) ? xValue : Number(xValue).toFixed(1);
            const yFormatted = Number.isInteger(Number(yValue)) ? yValue : Number(yValue).toFixed(1);
            ctx.fillText(`(${xFormatted}, ${yFormatted})`, x, y - radius - 5);
          });
        });
      });
      ctx.restore();
    }
  }
}