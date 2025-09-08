import { group, select, line as d3Line, curveMonotoneX, curveLinear } from 'core/utils/d3-imports';
import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';
import { getPaletteColors } from '../utils';
import { displayTextForType } from 'core/utils/displayTextForType';
import { sortByEncodingType } from '../sortingUtils';
import { LineChartData } from '../../transformers';

export class LineChartUtility {
  static render(context: RenderContext): void {
    
    if (isSVGContext(context)) {
      this.renderSVG(context);
    } else if (isCanvasContext(context)) {
      this.renderCanvas(context);
    }
  }

  private static renderSVG(context: RenderContext): void {
    if (!isSVGContext(context)) return;

    const { g, svg, processedData, transformedData, scales, config, editMode, selectedElement, onElementSelect, showDataLabels, showLegend, resolveColor, graphArea } = context;
    
    // Use transformed data if available
    if (transformedData?.type === 'line' && transformedData.data) {
      this.renderWithTransformedData(context, transformedData.data as LineChartData);
      return;
    }
    
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    
    
    if (!xScale || !yScale) {
      return;
    }

    const xEncodings = Array.isArray(config.encoding.x) ? config.encoding.x : [config.encoding.x];
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : [config.encoding.y];
    

    // Store legend items if color encoding exists
    const legendItems: Array<{ label: string; color: string }> = [];

    // Handle color encoding for multiple lines
    const colorScale = scales.get('color');
    const colorField = config.encoding.color?.field;

    // Helper to get x position handling both linear and band scales
    const getXPosition = (d: any, xEncoding: any) => {
      if (!xEncoding || !xEncoding.field) {
        return NaN; // Return NaN to properly exclude this point
      }
      
      const value = d[xEncoding.field];
      if (value == null) {
        return NaN; // Return NaN to properly exclude this point
      }
      
      if (xEncoding.type === 'quantitative' || xEncoding.type === 'temporal') {
        // Linear or time scale
        const scaledValue = xEncoding.type === 'temporal' 
          ? (value instanceof Date ? value : new Date(String(value)))
          : Number(value);
        // Check for invalid dates or numbers
        if (xEncoding.type === 'temporal' && scaledValue instanceof Date && isNaN(scaledValue.getTime())) {
          return NaN;
        }
        if (xEncoding.type === 'quantitative' && typeof scaledValue === 'number' && isNaN(scaledValue)) {
          return NaN;
        }
        
        const result = xScale(scaledValue as any);
        if (result === undefined || isNaN(result)) {
          return NaN;
        }
        return result;
      } else {
        // Band scale - use center of band for line charts
        const bandScale = xScale as any;
        const bandWidth = bandScale.bandwidth ? bandScale.bandwidth() : 0;
        const bandStart = bandScale(String(value));
        if (bandStart === undefined || isNaN(bandStart)) {
          return NaN;
        }
        return bandStart + bandWidth / 2;
      }
    };

    // Group data by color field if it exists, but be smarter about line charts
    let dataGroups: Map<string, any[]>;
    if (colorField) {
      // For line charts, check if grouping by color creates meaningful lines
      const potentialGroups = group(processedData, (d: any) => String(d[colorField]));
      const hasMultiPointGroups = Array.from(potentialGroups.values()).some(group => group.length > 1);
      
      if (hasMultiPointGroups) {
        // Use color grouping if at least one group has multiple points
        dataGroups = potentialGroups;
      } else {
        // All groups have single points, treat as one series without color grouping
        dataGroups = new Map([['single', processedData]]);
      }
    } else if (yEncodings.length > 1) {
      // If multiple Y encodings, treat each as a separate series
      dataGroups = new Map();
      dataGroups.set('all', processedData);
    } else {
      // Single series
      dataGroups = new Map([['single', processedData]]);
    }
    

    let seriesIndex = 0;
    const themeColors = getPaletteColors(context.colorPaletteId, context.superstate);

    // Create tooltip
    const tooltip = select('body').append('div')
      .attr('class', 'line-tooltip')
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

    // Draw lines for each series
    dataGroups.forEach((groupData, groupKey) => {
      yEncodings.forEach((yEncoding, yIndex) => {
        const xEncoding = xEncodings[Math.min(yIndex, xEncodings.length - 1)];
        
        
        if (!xEncoding?.field || !yEncoding?.field) {
          return;
        }

        // Create line generator with curve
        const line = (d3Line as any)()
          .x((d: any) => getXPosition(d, xEncoding))
          .y((d: any) => {
            const value = Number(d[yEncoding.field]) || 0;
            const result = yScale(value);
            return (result !== undefined && !isNaN(result)) ? result : 0;
          })
          .defined((d: any) => {
            const xPos = getXPosition(d, xEncoding);
            const yValue = Number(d[yEncoding.field]);
            const isDefined = d[yEncoding.field] != null && !isNaN(yValue) && !isNaN(xPos);
            return isDefined;
          })
          .curve((config.mark?.interpolate || 'linear') === 'monotone' ? curveMonotoneX : curveLinear);

        // Filter and sort data
        let lineData = groupData
          .filter((d) => {
            const xVal = d[xEncoding.field];
            const yVal = d[yEncoding.field];
            const isValid = xVal != null && yVal != null && !isNaN(Number(yVal));
            if (!isValid) {
            }
            return isValid;
          })
          .sort((a, b) => sortByEncodingType(a, b, xEncoding.type, xEncoding.field, xScale));

        // For categorical (ordinal/nominal) x-axis, add zero points for missing categories
        if ((xEncoding.type === 'ordinal' || xEncoding.type === 'nominal') && (xScale as any).domain) {
          const allCategories = (xScale as any).domain();
          const existingCategories = new Set(lineData.map(d => String(d[xEncoding.field])));
          const missingCategories = allCategories.filter((cat: string) => !existingCategories.has(cat));
          
          // Add zero points for missing categories
          if (missingCategories.length > 0) {
            const zeroPoints = missingCategories.map((cat: string) => {
              const zeroPoint: any = {};
              zeroPoint[xEncoding.field] = cat;
              zeroPoint[yEncoding.field] = 0;
              // Include color field if it exists
              if (colorField && groupKey !== 'single' && groupKey !== 'all') {
                zeroPoint[colorField] = groupKey;
              }
              return zeroPoint;
            });
            
            // Combine existing data with zero points
            lineData = [...lineData, ...zeroPoints];
            
            // Re-sort to maintain category order
            lineData.sort((a, b) => {
              const aIndex = allCategories.indexOf(String(a[xEncoding.field]));
              const bIndex = allCategories.indexOf(String(b[xEncoding.field]));
              return aIndex - bIndex;
            });
          }
        }

        // Skip if no valid data
        if (lineData.length === 0) {
          return;
        }

        // Determine color
        let color: string;
        if (typeof config.mark?.stroke === 'string') {
          color = config.mark.stroke.startsWith('#') ? config.mark.stroke : resolveColor(config.mark.stroke);
        } else if (colorField && colorScale) {
          const scaleColor = colorScale(groupKey);
          color = scaleColor || themeColors[0];
        } else if (yEncodings.length > 1) {
          color = themeColors[yIndex % themeColors.length];
        } else if (seriesIndex > 0) {
          color = themeColors[seriesIndex % themeColors.length];
        } else {
          // Single line, use first theme color
          color = themeColors[0];
        }

        // Add to legend
        if ((colorField && groupKey !== 'all') || yEncodings.length > 1) {
          const label = colorField ? groupKey : yEncoding.field;
          if (!legendItems.find(item => item.label === label)) {
            legendItems.push({ label, color });
          }
        }

        // Draw line - stroke is always enabled for line charts
        let path: any = null;
        const strokeWidth = config.mark?.strokeWidth !== undefined ? Math.max(config.mark.strokeWidth, 1) : 1; // Default to 1px, minimum of 1
        {
          path = g.append('path')
            .datum(lineData)
            .attr('class', `line series-${seriesIndex}`)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', strokeWidth)
            .attr('opacity', config.mark?.opacity || 1)
            .attr('d', line);
        }
          
        const pathData = line(lineData);

        // Add interactivity
        if (editMode && path) {
          path
            .style('cursor', 'pointer')
            .on('click', function() {
              if (onElementSelect) {
                onElementSelect({
                  type: 'series',
                  id: `line-${seriesIndex}`,
                });
              }
            });

          // Add selection indicator
          if (selectedElement?.type === 'series' && selectedElement.id === `line-${seriesIndex}`) {
            path
              .style('stroke-width', strokeWidth + 2)
              .style('filter', 'drop-shadow(0 0 4px var(--mk-ui-accent))');
          }
        }

        // Draw points if enabled or if single-point line for interactivity
        const showPoints = (config.mark as any)?.point?.show || lineData.length === 1;
        if (showPoints || editMode) {
          const points = g.selectAll(`.point-series-${seriesIndex}`)
            .data(lineData)
            .enter()
            .append('circle')
            .attr('class', `point point-series-${seriesIndex}`)
            .attr('cx', (d) => getXPosition(d, xEncoding))
            .attr('cy', (d) => {
              const value = Number(d[yEncoding.field]) || 0;
              const result = yScale(value);
              return (result !== undefined && !isNaN(result)) ? result : 0;
            })
            .attr('r', (config.mark as any)?.point?.size || 4)
            .attr('fill', color)
            .attr('stroke', 'none')
            .attr('stroke-width', 0)
            .attr('opacity', showPoints ? 1 : (editMode ? 0.3 : 0)) // Show points when enabled, semi-transparent in edit mode
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
              // Enlarge point on hover
              select(this)
                .transition()
                .duration(150)
                .attr('r', (config.mark?.point?.size || 4) + 2)
                .attr('opacity', 1);
              
              // Show tooltip
              tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
              
              // Build tooltip content
              let tooltipContent = '';
              
              // X value (not indented)
              if (xEncoding.field) {
                const xValue = d[xEncoding.field];
                const xProp = context.tableProperties?.find(p => p.name === xEncoding.field);
                const formattedX = xProp ? displayTextForType(xProp, xValue, context.superstate) : xValue;
                tooltipContent += `<div>${formattedX}</div>`;
              }
              
              // Y value with color square
              tooltipContent += `<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">`;
              tooltipContent += `<div style="width: 12px; height: 12px; background-color: ${color}; border-radius: 2px; flex-shrink: 0;"></div>`;
              
              tooltipContent += `<div>`;
              const yValue = d[yEncoding.field];
              const yProp = context.tableProperties?.find(p => p.name === yEncoding.field);
              const formattedY = yProp ? displayTextForType(yProp, yValue, context.superstate) : yValue;
              tooltipContent += `${formattedY}`;
              
              // Color field value if present
              if (colorField) {
                const colorValue = d[colorField];
                const colorProp = context.tableProperties?.find(p => p.name === colorField);
                const formattedColor = colorProp ? displayTextForType(colorProp, colorValue, context.superstate) : colorValue;
                tooltipContent += ` • ${formattedColor}`;
              }
              
              tooltipContent += `</div>`;
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
            .on('mouseout', function() {
              // Restore point size
              select(this)
                .transition()
                .duration(150)
                .attr('r', (config.mark as any)?.point?.size || 4)
                .attr('opacity', showPoints ? 1 : (editMode ? 0.3 : 0));
              
              // Hide tooltip
              tooltip.transition()
                .duration(500)
                .style('opacity', 0);
            });

          if (editMode) {
            points.style('cursor', 'pointer');
          }
        }

        // Draw data labels if enabled
        if ((showDataLabels || (config.mark as any)?.dataLabels?.show) && lineData.length < 50) {
          g.selectAll(`.label-series-${seriesIndex}`)
            .data(lineData)
            .enter()
            .append('text')
            .attr('class', `label label-series-${seriesIndex}`)
            .attr('x', (d) => getXPosition(d, xEncoding))
            .attr('y', (d) => {
              const value = Number(d[yEncoding.field]) || 0;
              const result = yScale(value);
              return (result !== undefined && !isNaN(result)) ? result - 8 : -8;
            })
            .attr('text-anchor', 'middle')
            .style('font-size', `${(config.mark as any)?.dataLabels?.fontSize || 10}px`)
            .style('fill', resolveColor((config.mark as any)?.dataLabels?.color || 'var(--mk-ui-text-primary)'))
            .style('font-weight', '500')
            .text((d) => {
              const value = Number(d[yEncoding.field]) || 0;
              return Number.isInteger(value) ? value.toString() : value.toFixed(1);
            });
        }

        seriesIndex++;
      });
    });

    // Store legend items for later rendering
    if (legendItems.length > 0 && showLegend) {
      (svg as any)._legendItems = legendItems;
    }

    // Store tooltip reference for cleanup
    (svg.node() as any).__lineTooltip = tooltip;
  }

  private static renderCanvas(context: RenderContext): void {
    if (!isCanvasContext(context)) return;

    const { ctx, processedData, scales, config, actualDimensions, resolveColor } = context;
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    
    if (!xScale || !yScale) {
      return;
    }

    const xEncodings = Array.isArray(config.encoding.x) ? config.encoding.x : [config.encoding.x];
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : [config.encoding.y];

    // Helper to get x position handling both linear and band scales
    const getXPosition = (d: any, xEncoding: any) => {
      if (!xEncoding || !xEncoding.field) return NaN;
      
      const value = d[xEncoding.field];
      if (value == null) return NaN;
      
      if (xEncoding.type === 'quantitative' || xEncoding.type === 'temporal') {
        const scaledValue = xEncoding.type === 'temporal' 
          ? (value instanceof Date ? value : new Date(String(value)))
          : Number(value);
        // Check for invalid dates or numbers
        if (xEncoding.type === 'temporal' && scaledValue instanceof Date && isNaN(scaledValue.getTime())) return NaN;
        if (xEncoding.type === 'quantitative' && typeof scaledValue === 'number' && isNaN(scaledValue)) return NaN;
        
        const result = xScale(scaledValue as any);
        return (result !== undefined && !isNaN(result)) ? result : NaN;
      } else {
        const bandScale = xScale as any;
        const bandWidth = bandScale.bandwidth ? bandScale.bandwidth() : 0;
        const bandStart = bandScale(String(value));
        return (bandStart !== undefined && !isNaN(bandStart)) ? bandStart + bandWidth / 2 : NaN;
      }
    };

    // Handle color encoding
    const colorScale = scales.get('color');
    const colorField = config.encoding.color?.field;

    // Group data by color field if it exists
    let dataGroups: Map<string, any[]>;
    if (colorField) {
      dataGroups = group(processedData, (d: any) => String(d[colorField]));
    } else if (yEncodings.length > 1) {
      dataGroups = new Map();
      dataGroups.set('all', processedData);
    } else {
      dataGroups = new Map([['single', processedData]]);
    }

    let seriesIndex = 0;
    const themeColors = getPaletteColors(context.colorPaletteId, context.superstate);

    // Draw lines for each series
    dataGroups.forEach((groupData, groupKey) => {
      yEncodings.forEach((yEncoding, yIndex) => {
        const xEncoding = xEncodings[Math.min(yIndex, xEncodings.length - 1)];
        
        if (!xEncoding?.field || !yEncoding?.field) return;

        // Filter and sort data
        let lineData = groupData
          .filter((d) => {
            const xVal = d[xEncoding.field];
            const yVal = d[yEncoding.field];
            return xVal != null && yVal != null && !isNaN(Number(yVal));
          })
          .sort((a, b) => sortByEncodingType(a, b, xEncoding.type, xEncoding.field, xScale));

        // For categorical (ordinal/nominal) x-axis, add zero points for missing categories
        if ((xEncoding.type === 'ordinal' || xEncoding.type === 'nominal') && (xScale as any).domain) {
          const allCategories = (xScale as any).domain();
          const existingCategories = new Set(lineData.map(d => String(d[xEncoding.field])));
          const missingCategories = allCategories.filter((cat: string) => !existingCategories.has(cat));
          
          // Add zero points for missing categories
          if (missingCategories.length > 0) {
            const zeroPoints = missingCategories.map((cat: string) => {
              const zeroPoint: any = {};
              zeroPoint[xEncoding.field] = cat;
              zeroPoint[yEncoding.field] = 0;
              // Include color field if it exists
              if (colorField && groupKey !== 'single' && groupKey !== 'all') {
                zeroPoint[colorField] = groupKey;
              }
              return zeroPoint;
            });
            
            // Combine existing data with zero points
            lineData = [...lineData, ...zeroPoints];
            
            // Re-sort to maintain category order
            lineData.sort((a, b) => {
              const aIndex = allCategories.indexOf(String(a[xEncoding.field]));
              const bIndex = allCategories.indexOf(String(b[xEncoding.field]));
              return aIndex - bIndex;
            });
          }
        }

        if (lineData.length === 0) return;

        // Determine color
        let color: string;
        if (typeof config.mark?.stroke === 'string') {
          color = config.mark.stroke.startsWith('#') ? config.mark.stroke : resolveColor(config.mark.stroke);
        } else if (colorField && colorScale) {
          const scaleColor = colorScale(groupKey);
          color = scaleColor || themeColors[0];
        } else if (yEncodings.length > 1) {
          color = themeColors[yIndex % themeColors.length];
        } else if (seriesIndex > 0) {
          color = themeColors[seriesIndex % themeColors.length];
        } else {
          // Single line, use first theme color
          color = themeColors[0];
        }

        // Draw line - stroke is always enabled for line charts
        const strokeWidth = config.mark?.strokeWidth !== undefined ? Math.max(config.mark.strokeWidth, 1) : 1; // Default to 1px, minimum of 1
        {
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = strokeWidth;
          ctx.globalAlpha = config.mark?.opacity || 1;
          ctx.beginPath();

        // Create line with curve interpolation
        if ((config.mark?.interpolate || 'linear') !== 'monotone' || lineData.length < 2) {
          // Linear interpolation or single point
          let firstPoint = true;
          lineData.forEach((d, i) => {
            const x = getXPosition(d, xEncoding);
            const yValue = Number(d[yEncoding.field]) || 0;
            const yResult = yScale(yValue);
            const y = (yResult !== undefined && !isNaN(yResult)) ? yResult : NaN;
            
            // Skip points with NaN coordinates
            if (isNaN(x) || isNaN(y)) {
              return;
            }
            
            if (firstPoint) {
              ctx.moveTo(x, y);
              firstPoint = false;
            } else {
              ctx.lineTo(x, y);
            }
          });
        } else {
          // Monotone curve interpolation for multiple points
          const points = lineData
            .map(d => {
              const x = getXPosition(d, xEncoding);
              const yValue = Number(d[yEncoding.field]) || 0;
              const yResult = yScale(yValue);
              const y = (yResult !== undefined && !isNaN(yResult)) ? yResult : NaN;
              return { x, y };
            })
            .filter(p => !isNaN(p.x) && !isNaN(p.y)); // Filter out invalid points
          
          // Draw smooth curve using quadratic bezier curves
          if (points.length === 2) {
            // For two points, just draw a straight line
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
          } else if (points.length > 2) {
            ctx.moveTo(points[0].x, points[0].y);
            
            // Use monotone cubic interpolation for smoother curves
            for (let i = 0; i < points.length - 1; i++) {
              const p0 = points[Math.max(0, i - 1)];
              const p1 = points[i];
              const p2 = points[i + 1];
              const p3 = points[Math.min(points.length - 1, i + 2)];
              
              // Calculate control points for cubic bezier
              const cp1x = p1.x + (p2.x - p0.x) / 6;
              const cp1y = p1.y + (p2.y - p0.y) / 6;
              const cp2x = p2.x - (p3.x - p1.x) / 6;
              const cp2y = p2.y - (p3.y - p1.y) / 6;
              
              ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
            }
          }
        }

          // Only stroke if we have data points
          if (lineData.length > 0) {
            ctx.stroke();
          }
          ctx.restore();
        }

        // Draw points if enabled
        if ((config.mark as any)?.point?.show) {
          lineData.forEach((d) => {
            const x = getXPosition(d, xEncoding);
            const yValue = Number(d[yEncoding.field]) || 0;
            const yResult = yScale(yValue);
            const y = (yResult !== undefined && !isNaN(yResult)) ? yResult : NaN;
            
            // Skip points with NaN coordinates
            if (isNaN(x) || isNaN(y)) {
              return;
            }
            
            ctx.save();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, (config.mark as any)?.point?.size || 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
          });
        }

        // Draw data labels if enabled
        if (((config.mark as any)?.dataLabels?.show) && lineData.length < 50) {
          ctx.save();
          ctx.fillStyle = resolveColor((config.mark as any).dataLabels.color || 'var(--mk-ui-text-primary)');
          ctx.font = `500 ${(config.mark as any).dataLabels.fontSize || 10}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';

          lineData.forEach((d) => {
            const x = getXPosition(d, xEncoding);
            const value = Number(d[yEncoding.field]) || 0;
            const yResult = yScale(value);
            const y = (yResult !== undefined && !isNaN(yResult)) ? yResult : NaN;
            
            // Skip labels with NaN coordinates
            if (isNaN(x) || isNaN(y)) {
              return;
            }
            
            const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);
            ctx.fillText(formattedValue, x, y - 8);
          });
          ctx.restore();
        }

        seriesIndex++;
      });
    });
  }

  private static renderWithTransformedData(context: RenderContext, lineData: LineChartData): void {
    if (!isSVGContext(context)) return;
    
    const { g, svg, scales, config, graphArea, editMode, selectedElement, onElementSelect, showDataLabels } = context;
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    
    if (!xScale || !yScale || !lineData.data || lineData.data.length === 0) return;
    
    const themeColors = getPaletteColors(context.colorPaletteId, context.superstate);
    const colorScale = scales.get('color');
    
    // Create line generator
    const lineGenerator = d3Line<any>()
      .defined(d => {
        const xValue = xScale(d.x);
        const yValue = yScale(d.y);
        return xValue != null && !isNaN(xValue) && yValue != null && !isNaN(yValue);
      })
      .x(d => {
        // Handle band scales for categorical x-axis
        const scale = xScale as any;
        if (scale.bandwidth) {
          return scale(d.x) + scale.bandwidth() / 2;
        }
        return scale(d.x);
      })
      .y(d => yScale(d.y))
      .curve(config.mark?.interpolate === 'monotone' ? curveMonotoneX : curveLinear);
    
    // Group data by series
    const seriesGroups = new Map<string, typeof lineData.data>();
    lineData.data.forEach(point => {
      const series = point.series || 'default';
      if (!seriesGroups.has(series)) {
        seriesGroups.set(series, []);
      }
      seriesGroups.get(series)!.push(point);
    });
    
    // Draw lines for each series
    let seriesIndex = 0;
    seriesGroups.forEach((points, series) => {
      // Sort points by x value for proper line drawing
      // For ordinal scales, use the domain order
      const sortedPoints = [...points].sort((a, b) => {
        const scale = xScale as any;
        if (scale.domain && typeof scale.domain === 'function') {
          const domain = scale.domain();
          const aIndex = domain.indexOf(a.x);
          const bIndex = domain.indexOf(b.x);
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
        }
        // Fallback to regular comparison
        if (a.x < b.x) return -1;
        if (a.x > b.x) return 1;
        return 0;
      });
      
      // Determine color
      let color: string;
      if (colorScale && config.encoding?.color?.field) {
        color = colorScale(series) || themeColors[seriesIndex % themeColors.length];
      } else {
        color = themeColors[seriesIndex % themeColors.length];
      }
      
      // Draw the line
      const linePath = g.append('path')
        .datum(sortedPoints)
        .attr('class', 'line')
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', config.mark?.strokeWidth || 2)
        .attr('opacity', config.mark?.opacity || 1)
        .style('cursor', 'pointer');
      
      // Add points if configured
      if (config.mark?.point && (typeof config.mark.point === 'boolean' ? config.mark.point : config.mark.point?.show !== false)) {
        const pointSize = config.mark?.size || 4;
        
        g.selectAll(`.point-${series}`)
          .data(sortedPoints)
          .enter()
          .append('circle')
          .attr('class', `point-${series}`)
          .attr('cx', d => {
            const scale = xScale as any;
            if (scale.bandwidth) {
              return scale(d.x) + scale.bandwidth() / 2;
            }
            return scale(d.x);
          })
          .attr('cy', d => yScale(d.y))
          .attr('r', pointSize)
          .attr('fill', color)
          .attr('opacity', config.mark?.opacity || 1)
          .style('cursor', 'pointer');
      }
      
      // Add data labels if configured
      if (showDataLabels) {
        g.selectAll(`.label-${series}`)
          .data(sortedPoints)
          .enter()
          .append('text')
          .attr('class', `label-${series}`)
          .attr('x', d => {
            const scale = xScale as any;
            if (scale.bandwidth) {
              return scale(d.x) + scale.bandwidth() / 2;
            }
            return scale(d.x);
          })
          .attr('y', d => yScale(d.y) - 5)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('fill', color)
          .text(d => d.y.toFixed(1));
      }
      
      seriesIndex++;
    });
  }
}