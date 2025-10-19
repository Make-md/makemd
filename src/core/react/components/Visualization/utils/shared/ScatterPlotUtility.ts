import { select, timeFormat, utcFormat } from 'core/utils/d3-imports';
import type { ScaleBand } from 'core/utils/d3-imports';
import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';
import { displayTextForType } from 'core/utils/displayTextForType';
import { getPaletteColors, createTooltip, resolveColor } from '../utils';
import { ScatterPlotData } from '../../transformers';
import { formatNumber } from '../formatNumber';
import i18n from "shared/i18n";

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

    const { g, svg, processedData, transformedData, scales, config, graphArea, editMode, selectedElement, onElementSelect, showDataLabels, showLegend, resolveColor } = context;
    
    // Use transformed data if available
    if (transformedData?.type === 'scatter' && transformedData.data) {
      this.renderWithTransformedData(context, transformedData.data as ScatterPlotData);
      return;
    }
    
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
        // Handle values that are already Date objects or date strings
        const dateValue = value instanceof Date ? value : new Date(String(value));
        return xScale(dateValue);
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
        // Handle values that are already Date objects or date strings
        const dateValue = value instanceof Date ? value : new Date(String(value));
        return yScale(dateValue);
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
    const tooltip = createTooltip('scatter-tooltip');

    // Create points for each series combination
    let seriesIndex = 0;
    xEncodings.forEach((xEncoding, xIndex) => {
      yEncodings.forEach((yEncoding, yIndex) => {
        if (!xEncoding?.field || !yEncoding?.field) return;
        
        const seriesColor = themeColors[seriesIndex % themeColors.length];
        
        const filteredData = processedData.filter(d => d[xEncoding.field] != null && d[yEncoding.field] != null);
        
        const points = g.selectAll(`.dot-${xIndex}-${yIndex}`)
          .data(filteredData)
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
          .style('cursor', 'pointer')
          .style('pointer-events', 'all');

        // Add hover effects and tooltips to these specific points
        points
          .on('click', function(event, d: any) {
          })
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
            
            // X value as title (formatted to match axis)
            const xValue = d[xEncoding.field];
            let formattedX: string;
            // Exclude numeric-only strings (timestamps) from auto-detection
            const isNumericString = typeof xValue === 'string' && /^\d+$/.test(xValue);
            const isTemporalValue = xEncoding.type === 'temporal' || xValue instanceof Date || 
              (typeof xValue === 'string' && !isNumericString && !isNaN(Date.parse(String(xValue))));
            
            if (isTemporalValue) {
              const date = xValue instanceof Date ? xValue : new Date(String(xValue));
              if (!isNaN(date.getTime())) {
                const formatDay = utcFormat('%b %d');
                formattedX = formatDay(date);
              } else {
                formattedX = String(xValue);
              }
            } else {
              const xProp = context.tableProperties?.find(p => p.name === xEncoding.field);
              formattedX = xProp ? displayTextForType(xProp, xValue, context.superstate) : String(xValue);
            }
            
            tooltipContent += `<div style="font-weight: 600; margin-bottom: 4px;">${formattedX}</div>`;
            
            // Y value with label and color indicator
            tooltipContent += `<div style="display: flex; align-items: center; gap: 8px;">`;
            tooltipContent += `<div style="width: 12px; height: 12px; background-color: ${pointColor}; border-radius: 2px; flex-shrink: 0;"></div>`;
            
            const yValue = d[yEncoding.field];
            const yProp = context.tableProperties?.find(p => p.name === yEncoding.field);
            const formattedY = yProp ? displayTextForType(yProp, yValue, context.superstate) : formatNumber(Number(yValue));
            tooltipContent += `<div><strong>${yEncoding.field}:</strong> ${formattedY}</div>`;
            tooltipContent += `</div>`;
            
            // Color field value if present
            if (colorField) {
              const colorValue = d[colorField];
              const colorProp = context.tableProperties?.find(p => p.name === colorField);
              const formattedColor = colorProp ? displayTextForType(colorProp, colorValue, context.superstate) : String(colorValue);
              tooltipContent += `<div style="margin-top: 4px;"><strong>${colorField}:</strong> ${formattedColor}</div>`;
            }
            
            // Size field value if present
            if (sizeField) {
              const sizeValue = d[sizeField];
              const sizeProp = context.tableProperties?.find(p => p.name === sizeField);
              const formattedSize = sizeProp ? displayTextForType(sizeProp, sizeValue, context.superstate) : formatNumber(Number(sizeValue));
              tooltipContent += `<div style="margin-top: 4px;"><strong>${sizeField}:</strong> ${formattedSize}</div>`;
            }
            
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

        seriesIndex++;
      });
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
              const xFormatted = typeof xVal === 'number' ? formatNumber(xVal) : xVal;
              const yFormatted = typeof yVal === 'number' ? formatNumber(yVal) : yVal;
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
        // Handle values that are already Date objects or date strings
        const dateValue = value instanceof Date ? value : new Date(String(value));
        return xScale(dateValue);
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
        // Handle values that are already Date objects or date strings
        const dateValue = value instanceof Date ? value : new Date(String(value));
        return yScale(dateValue);
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
            
            const xFormatted = typeof xValue === 'number' ? formatNumber(xValue) : xValue;
            const yFormatted = typeof yValue === 'number' ? formatNumber(yValue) : yValue;
            ctx.fillText(`(${xFormatted}, ${yFormatted})`, x, y - radius - 5);
          });
        });
      });
      ctx.restore();
    }
  }

  private static renderWithTransformedData(context: RenderContext, scatterData: ScatterPlotData): void {
    if (!isSVGContext(context)) return;
    
    const { g, svg, scales, config, graphArea, editMode, selectedElement, onElementSelect, showDataLabels } = context;
    
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    const colorScale = scales.get('color');
    const sizeScale = scales.get('size');
    
    
    if (!xScale || !yScale) {
      return;
    }
    
    if (!scatterData.data || scatterData.data.length === 0) {
      // Draw a message indicating no data
      g.append('text')
        .attr('x', graphArea.left + graphArea.width / 2)
        .attr('y', graphArea.top + graphArea.height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--mk-ui-text-secondary)')
        .style('font-size', '14px')
        .text('No data points to display');
      return;
    }
    
    const themeColors = getPaletteColors(context.colorPaletteId, context.superstate);
    const defaultSize = config.mark?.size || 4;
    
    // Create tooltip
    const tooltip = createTooltip('scatter-tooltip');
    
    // Check if we need to use categorical mapping for X axis
    const hasXCategoricalMap = (scatterData as any).xCategoricalMap && (scatterData as any).xCategoricalMap.size > 0;
    const hasYCategoricalMap = (scatterData as any).yCategoricalMap && (scatterData as any).yCategoricalMap.size > 0;
    
    // Helper function to get X position
    const getXPosition = (d: any) => {
      if (hasXCategoricalMap && d.metadata) {
        // For categorical X, use the original string value with the scale
        const xField = Array.isArray(config.encoding.x) ? config.encoding.x[0]?.field : config.encoding.x?.field;
        const originalValue = d.metadata[xField || 'x'];
        if (originalValue !== undefined) {
          const scaledValue = xScale(originalValue);
          // For band scales, get the center of the band
          if ((xScale as any).bandwidth) {
            return scaledValue + (xScale as any).bandwidth() / 2;
          }
          return scaledValue;
        }
      }
      // For numeric X, use the numeric value directly
      return xScale(d.x);
    };
    
    // Helper function to get Y position
    const getYPosition = (d: any) => {
      if (hasYCategoricalMap && d.metadata) {
        // For categorical Y, use the original string value with the scale
        const yField = Array.isArray(config.encoding.y) ? config.encoding.y[0]?.field : config.encoding.y?.field;
        const originalValue = d.metadata[yField || 'y'];
        if (originalValue !== undefined) {
          const scaledValue = yScale(originalValue);
          // For band scales, get the center of the band
          if ((yScale as any).bandwidth) {
            return scaledValue + (yScale as any).bandwidth() / 2;
          }
          return scaledValue;
        }
      }
      // For numeric Y, use the numeric value directly
      return yScale(d.y);
    };
    
    // Draw points
    
    const points = g.selectAll('.scatter-point')
      .data(scatterData.data)
      .enter()
      .append('circle')
      .attr('class', 'scatter-point')
      .attr('cx', d => {
        const x = getXPosition(d);
        if (x == null || isNaN(x)) {
          return 0;
        }
        return x;
      })
      .attr('cy', d => {
        const y = getYPosition(d);
        if (y == null || isNaN(y)) {
          return 0;
        }
        return y;
      })
      .attr('r', d => {
        if (d.size !== undefined && sizeScale) {
          return Math.max(2, Math.sqrt(sizeScale(d.size) * 10));
        }
        return defaultSize;
      })
      .attr('fill', (d, i) => {
        if (colorScale && d.series) {
          return colorScale(d.series);
        }
        const seriesIndex = scatterData.series?.indexOf(d.series || 'default') || 0;
        return themeColors[seriesIndex % themeColors.length];
      })
      .attr('opacity', config.mark?.opacity || 0.7)
      .style('cursor', 'pointer')
      .style('pointer-events', 'all');
    
    // Add interactivity
    points
      .on('click', function(event, d) {
      })
      .on('mouseover', function(event, d) {
        
        select(this)
          .transition()
          .duration(150)
          .attr('opacity', 1)
          .attr('r', function() {
            const currentR = Number(select(this).attr('r'));
            return currentR * 1.2;
          });
        
        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        
        // Format values using metadata
        const xField = Array.isArray(config.encoding.x) ? config.encoding.x[0]?.field : config.encoding.x?.field;
        const yField = Array.isArray(config.encoding.y) ? config.encoding.y[0]?.field : config.encoding.y?.field;
        const xEncoding = Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x;
        const yEncoding = Array.isArray(config.encoding.y) ? config.encoding.y[0] : config.encoding.y;
        
        // Format X value
        let formattedX: string;
        if (xEncoding?.type === 'temporal' || (d.x as any) instanceof Date) {
          const date = (d.x as any) instanceof Date ? d.x as unknown as Date : new Date(Number(d.x));
          if (!isNaN(date.getTime())) {
            formattedX = utcFormat('%b %d')(date);
          } else {
            formattedX = String(d.x);
          }
        } else if (d.metadata && xField && d.metadata[xField] !== undefined) {
          const xProp = context.tableProperties?.find(p => p.name === xField);
          formattedX = xProp && context.superstate
            ? displayTextForType(xProp, d.metadata[xField], context.superstate)
            : formatNumber(Number(d.x));
        } else {
          formattedX = formatNumber(Number(d.x));
        }
        
        // Format Y value
        let formattedY: string;
        if (yEncoding?.type === 'temporal' || (d.y as any) instanceof Date) {
          const date = (d.y as any) instanceof Date ? d.y as unknown as Date : new Date(Number(d.y));
          if (!isNaN(date.getTime())) {
            formattedY = utcFormat('%b %d')(date);
          } else {
            formattedY = String(d.y);
          }
        } else if (d.metadata && yField && d.metadata[yField] !== undefined) {
          const yProp = context.tableProperties?.find(p => p.name === yField);
          formattedY = yProp && context.superstate
            ? displayTextForType(yProp, d.metadata[yField], context.superstate)
            : formatNumber(Number(d.y));
        } else {
          formattedY = formatNumber(Number(d.y));
        }
        
        const tooltipContent = `
          <div style="font-weight: 600; margin-bottom: 4px;">${formattedX}</div>
          <div><strong>${yField || 'Y'}:</strong> ${formattedY}</div>
          ${d.series && d.series !== 'default' ? `<div><strong>{i18n.labels.series}</strong> ${d.series}</div>` : ''}
          ${d.size !== undefined ? `<div><strong>{i18n.labels.size}</strong> ${formatNumber(Number(d.size))}</div>` : ''}
          ${d.label ? `<div><strong>{i18n.labels.label}</strong> ${d.label}</div>` : ''}
        `;
        
        tooltip.html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function(event, d) {
        select(this)
          .transition()
          .duration(150)
          .attr('opacity', config.mark?.opacity || 0.7)
          .attr('r', (d: any) => {
            if (d.size !== undefined && sizeScale) {
              return Math.max(2, Math.sqrt(sizeScale(d.size) * 10));
            }
            return defaultSize;
          });
        
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
    
    // Add data labels if configured
    if (showDataLabels) {
      g.selectAll('.scatter-label')
        .data(scatterData.data)
        .enter()
        .append('text')
        .attr('class', 'scatter-label')
        .attr('x', d => xScale(d.x))
        .attr('y', d => yScale(d.y) - 8)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'var(--mk-ui-text-primary)')
        .text(d => d.label || `(${formatNumber(d.x)}, ${formatNumber(d.y)})`);
    }
    
    // Store tooltip reference for cleanup
    (svg.node() as any).__scatterTooltip = tooltip;
  }
}