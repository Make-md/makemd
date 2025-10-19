import { area as d3Area, line as d3Line, curveMonotoneX, curveLinear, curveCatmullRom, stack as d3Stack, max, select, timeFormat, utcFormat } from 'core/utils/d3-imports';
import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';
import { getPaletteColors, getSolidPaletteColors, createTooltip } from '../utils';
import { GradientUtility, GradientConfig } from './GradientUtility';
import { formatNumber } from '../formatNumber';
import { ensureCorrectEncodingType } from '../../utils/inferEncodingType';
import { AreaChartData } from '../../types/ChartDataSchemas';
import { displayTextForType } from 'core/utils/displayTextForType';

export class AreaChartUtility {
  /**
   * Format a date for tooltip display based on time granularity
   */
  private static formatDateForTooltip(date: Date, xEncoding: any): string {
    // Check if we have hour-level precision
    const hasHourPrecision = date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || date.getUTCSeconds() !== 0;
    
    // If hour grouping or has hour precision, show date and time
    if (xEncoding?.timeUnit === 'hour' || hasHourPrecision) {
      return utcFormat('%b %d, %I:%M %p')(date);
    }
    
    // Otherwise just show date
    return utcFormat('%b %d')(date);
  }

  static render(context: RenderContext): void {
    if (isSVGContext(context)) {
      this.renderSVG(context);
    } else if (isCanvasContext(context)) {
      this.renderCanvas(context);
    }
  }

  private static renderSVG(context: RenderContext): void {
    if (!isSVGContext(context)) return;

    const { g, svg, processedData, transformedData, scales, config, graphArea, editMode, selectedElement, onElementSelect, showDataLabels, resolveColor, colorPaletteId, tableProperties } = context;
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    
    if (!xScale || !yScale) return;

    // Use transformed data if available (contains aggregated/grouped data)
    if (transformedData?.type === 'area' && transformedData.data) {
      this.renderWithTransformedData(context, transformedData.data as AreaChartData);
      return;
    }

    let xEncodings = Array.isArray(config.encoding.x) ? config.encoding.x : [config.encoding.x];
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : [config.encoding.y];
    
    // Ensure correct encoding type for x-axis (must match the scale type that was created)
    if (xEncodings[0] && tableProperties) {
      const xProperty = tableProperties.find(p => p.name === xEncodings[0].field);
      const xValues = processedData.map(d => d[xEncodings[0].field]);
      xEncodings[0] = ensureCorrectEncodingType(xEncodings[0], xProperty, xValues);
    }

    // Store legend items
    const legendItems: Array<{ label: string; color: string }> = [];

    // Create tooltip
    const tooltip = createTooltip('area-tooltip');

    // Check if we should render stacked
    const hasMultipleYFields = yEncodings.length > 1;
    const shouldStack = hasMultipleYFields && config.stacked;
    

    // Helper to get x position handling both linear and band scales
    const getXPosition = (d: any, xEncoding: any) => {
      if (!xEncoding || !xEncoding.field) {
        return NaN;
      }
      
      const value = d[xEncoding.field];
      if (value == null) {
        return NaN;
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
        // Band scale - use center of band for area charts
        const bandScale = xScale as any;
        const bandWidth = bandScale.bandwidth ? bandScale.bandwidth() : 0;
        const bandStart = bandScale(String(value));
        if (bandStart === undefined || isNaN(bandStart)) {
          return NaN;
        }
        return bandStart + bandWidth / 2;
      }
    };

    if (shouldStack) {
      this.renderStackedAreas(context, xScale, yScale, xEncodings, yEncodings, getXPosition, legendItems);
    } else {
      // Handle multiple series
      yEncodings.forEach((yEncoding, seriesIndex) => {
      const xEncoding = xEncodings[Math.min(seriesIndex, xEncodings.length - 1)];
      
      if (!xEncoding?.field || !yEncoding?.field) return;

      // Filter and sort data
      // First, filter and map to include x positions
      const dataWithPositions = processedData
        .map((d) => ({
          data: d,
          xPos: getXPosition(d, xEncoding),
          yValue: d[yEncoding.field],
          xValue: d[xEncoding.field]
        }))
        .filter((item) => item.yValue != null && !isNaN(Number(item.yValue)) && !isNaN(item.xPos));

      // Sort by x position
      dataWithPositions.sort((a, b) => a.xPos - b.xPos);

      // Extract the sorted data
      const areaData = dataWithPositions.map((item) => item.data);
      

      // Create area generator
      const area = d3Area<any>()
        .x((d) => getXPosition(d, xEncoding))
        .y0((d) => {
          // For negative values, use the zero line as baseline
          const value = Number(d[yEncoding.field]);
          return value >= 0 ? yScale(0) : yScale(value);
        })
        .y1((d) => {
          // For positive values, extend from zero to value; for negative values, extend from value to zero  
          const value = Number(d[yEncoding.field]);
          return value >= 0 ? yScale(value) : yScale(0);
        })
        .defined((d) => {
          const xPos = getXPosition(d, xEncoding);
          return d[yEncoding.field] != null && !isNaN(d[yEncoding.field]) && !isNaN(xPos);
        })
        .curve((config.mark?.interpolate || 'linear') === 'monotone' ? curveCatmullRom : curveLinear);

      // Create line generator for the top edge
      const line = d3Line<any>()
        .x((d) => getXPosition(d, xEncoding))
        .y((d) => yScale(d[yEncoding.field]))
        .defined((d) => {
          const xPos = getXPosition(d, xEncoding);
          return d[yEncoding.field] != null && !isNaN(d[yEncoding.field]) && !isNaN(xPos);
        })
        .curve((config.mark?.interpolate || 'linear') === 'monotone' ? curveCatmullRom : curveLinear);

      // Determine colors using palette
      const paletteColors = getPaletteColors(context.colorPaletteId, context.superstate);
      const solidColors = getSolidPaletteColors(context.colorPaletteId, context.superstate);
      
      let fillColor: string;
      let strokeColor: string;
      
      // Check if gradient is configured for area fill
      const markConfig = config.mark as any;
      let areaFill: string;
      
      // Check if color palette has gradients to use
      const palettes = context.superstate?.assets?.getColorPalettes();
      
      const palette = palettes?.find((p: any) => p.id === context.colorPaletteId);
      
      // Look for CSS gradients in the colors array first
      if (palette?.colors) {
        const gradientColors = palette.colors.filter(c => c.value && (
          c.value.includes('linear-gradient') || 
          c.value.includes('radial-gradient') || 
          c.value.includes('conic-gradient')
        )) || [];
        
        
        if (gradientColors.length > 0) {
          // Parse CSS gradient and create SVG gradient
          const gradientColor = gradientColors[seriesIndex % gradientColors.length];
          
          const parsedGradient = GradientUtility.parseCSSGradient(gradientColor.value);
          if (parsedGradient) {
            // Override angle to vertical (180 degrees = top to bottom)
            parsedGradient.angle = 180;
            parsedGradient.direction = 'vertical';
            const svgGradientId = GradientUtility.createSVGGradient(svg, parsedGradient);
            areaFill = svgGradientId;
            // Extract first color from gradient for legend
            fillColor = parsedGradient.colors[0] || paletteColors[seriesIndex % paletteColors.length]; // For legend
          } else {
            fillColor = paletteColors[seriesIndex % paletteColors.length];
            areaFill = fillColor;
          }
        } else {
          // Use solid colors
          fillColor = paletteColors[seriesIndex % paletteColors.length];
          areaFill = fillColor;
        }
      } else if (palette?.gradients && palette.gradients.length > 0) {
        // Use gradient from palette (cycle through available gradients for multiple series)
        const paletteGradient = palette.gradients[seriesIndex % palette.gradients.length];
        
        const gradientConfig: GradientConfig = {
          type: paletteGradient.type,
          colors: paletteGradient.stops.map((stop: any) => stop.color),
          positions: paletteGradient.stops.map((stop: any) => stop.position),
          angle: paletteGradient.direction,
          centerX: paletteGradient.center?.x || 0.5,
          centerY: paletteGradient.center?.y || 0.5
        };
        
        areaFill = GradientUtility.applyGradient(context, gradientConfig) as string;
        fillColor = paletteColors[seriesIndex % paletteColors.length]; // For legend
      } else {
        // Always use palette colors for area fill
        fillColor = paletteColors[seriesIndex % paletteColors.length];
        areaFill = fillColor;
      }
      
      if (config.mark?.stroke) {
        strokeColor = resolveColor(config.mark.stroke);
      } else {
        // Use solid color for stroke when gradient is used for fill
        strokeColor = solidColors[seriesIndex % solidColors.length];
      }

      // Add to legend
      if (yEncodings.length > 1) {
        legendItems.push({
          label: yEncoding.field,
          color: fillColor
        });
      }

      // Draw area
      const areaPath = g.append('path')
        .datum(areaData)
        .attr('class', `area area-series-${seriesIndex}`)
        .attr('fill', areaFill)
        .attr('fill-opacity', config.mark?.fillOpacity || 0.3)
        .attr('d', area);

      // Draw line on top
      const linePath = g.append('path')
        .datum(areaData)
        .attr('class', `area-line area-line-series-${seriesIndex}`)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', config.mark?.strokeWidth || 2)
        .attr('d', line);

      // Add invisible circles for tooltip interaction
      const tooltipGroup = g.append('g')
        .attr('class', `area-tooltip-points-${seriesIndex}`);

      tooltipGroup.selectAll('circle')
        .data(areaData)
        .enter()
        .append('circle')
        .attr('cx', (d) => getXPosition(d, xEncoding))
        .attr('cy', (d) => yScale(d[yEncoding.field]))
        .attr('r', 4)
        .attr('fill', 'transparent')
        .attr('stroke', 'transparent')
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          // Highlight the point
          const circle = select(this);
          circle
            .attr('fill', strokeColor)
            .attr('stroke', strokeColor)
            .attr('r', 6);

          // Show tooltip
          const xValue = d[xEncoding.field];
          const yValue = Number(d[yEncoding.field]);
          
          let xDisplay: string;
          // Check if temporal either by explicit type or by checking if value is a Date
          // Exclude numeric-only strings (timestamps) from auto-detection
          const isNumericString = typeof xValue === 'string' && /^\d+$/.test(xValue);
          const isTemporalValue = xEncoding.type === 'temporal' || xValue instanceof Date || 
            (typeof xValue === 'string' && !isNumericString && !isNaN(Date.parse(xValue)));
          
          if (isTemporalValue) {
            const date = xValue instanceof Date ? xValue : new Date(String(xValue));
            if (!isNaN(date.getTime())) {
              // Match axis formatting: use same format as x-axis
              xDisplay = AreaChartUtility.formatDateForTooltip(date, xEncoding);
            } else {
              xDisplay = String(xValue);
            }
          } else if (xEncoding.type === 'quantitative') {
            xDisplay = formatNumber(Number(xValue));
          } else {
            // Use displayTextForType for proper formatting (handles paths, links, etc.)
            const xProperty = tableProperties?.find(p => p.name === xEncoding.field);
            xDisplay = xProperty && context.superstate 
              ? displayTextForType(xProperty, xValue as any, context.superstate) 
              : String(xValue);
          }
          
          const yDisplay = formatNumber(yValue);
          
          tooltip.transition()
            .duration(200)
            .style('opacity', 0.9);
          
          tooltip.html(`
            <div style="font-weight: 600; margin-bottom: 4px;">${xDisplay}</div>
            <div><strong>${yEncoding.field}:</strong> ${yDisplay}</div>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
          // Hide the point
          select(this)
            .attr('fill', 'transparent')
            .attr('stroke', 'transparent')
            .attr('r', 4);

          // Hide tooltip
          tooltip.transition()
            .duration(500)
            .style('opacity', 0);
        });

      // Add interactivity
      if (editMode) {
        const interactionGroup = g.append('g')
          .attr('class', `area-interaction-${seriesIndex}`);

        // Create invisible thick line for better click detection
        interactionGroup.append('path')
          .datum(areaData)
          .attr('fill', 'none')
          .attr('stroke', 'transparent')
          .attr('stroke-width', 10)
          .attr('d', line)
          .style('cursor', 'pointer')
          .on('click', function() {
            if (onElementSelect) {
              onElementSelect({
                type: 'series',
                id: `area-${seriesIndex}`,
              });
            }
          });

        // Add selection indicator
        if (selectedElement?.type === 'series' && selectedElement.id === `area-${seriesIndex}`) {
          linePath
            .style('stroke-width', (config.mark?.strokeWidth || 2) + 2)
            .style('filter', 'drop-shadow(0 0 4px var(--mk-ui-accent))');
          
          areaPath
            .style('fill-opacity', (config.mark?.fillOpacity || 0.3) + 0.1);
        }
      }

      // Draw points if enabled
      if (config.mark?.point?.show) {
        const points = g.selectAll(`.area-point-series-${seriesIndex}`)
          .data(areaData)
          .enter()
          .append('circle')
          .attr('class', `area-point area-point-series-${seriesIndex}`)
          .attr('cx', (d) => getXPosition(d, xEncoding))
          .attr('cy', (d) => yScale(d[yEncoding.field]))
          .attr('r', config.mark.point.size || 3)
          .attr('fill', resolveColor('var(--mk-ui-background)'))
          .attr('stroke', strokeColor)
          .attr('stroke-width', 2);

        if (editMode) {
          points.style('cursor', 'pointer');
        }
      }

      // Draw data labels if enabled
      if ((showDataLabels || config.mark?.dataLabels?.show) && areaData.length < 50) {
        g.selectAll(`.area-label-series-${seriesIndex}`)
          .data(areaData)
          .enter()
          .append('text')
          .attr('class', `area-label area-label-series-${seriesIndex}`)
          .attr('x', (d) => getXPosition(d, xEncoding))
          .attr('y', (d) => yScale(d[yEncoding.field]) - 5)
          .attr('text-anchor', 'middle')
          .style('font-size', `${config.mark?.dataLabels?.fontSize || 10}px`)
          .style('fill', resolveColor(config.mark?.dataLabels?.color || 'var(--mk-ui-text-primary)'))
          .text((d) => String(d[yEncoding.field]));
      }
      });
    }

    // Store legend items for later rendering
    if (legendItems.length > 0) {
      (svg as any)._legendItems = legendItems;
    }
    
    // Add category/temporal hit areas for easier tooltip access
    const xEncoding = xEncodings[0];
    if (xEncoding && (xEncoding.type === 'temporal' || xEncoding.type === 'nominal' || xEncoding.type === 'ordinal')) {
      // Group data by x-value to create hit areas
      const xValueGroups = new Map<string, any[]>();
      processedData.forEach(d => {
        const xVal = d[xEncoding.field];
        const key = xVal instanceof Date ? xVal.getTime().toString() : String(xVal);
        if (!xValueGroups.has(key)) {
          xValueGroups.set(key, []);
        }
        xValueGroups.get(key)!.push(d);
      });
      
      // Calculate bandwidth for hit areas
      const xValues = Array.from(xValueGroups.keys()).sort();
      const bandwidth = xValues.length > 1 
        ? Math.abs(xScale(processedData[1][xEncoding.field]) - xScale(processedData[0][xEncoding.field]))
        : 50;
      
      xValueGroups.forEach((dataPoints, xKey) => {
        const xVal = dataPoints[0][xEncoding.field];
        const xPos = getXPosition(dataPoints[0], xEncoding);
        
        if (isNaN(xPos)) return;
        
        g.append('rect')
          .attr('class', 'x-value-hit-area')
          .attr('x', xPos - bandwidth / 2)
          .attr('y', 0)
          .attr('width', bandwidth)
          .attr('height', graphArea.bottom - graphArea.top)
          .attr('fill', 'transparent')
          .attr('pointer-events', 'all')
          .style('cursor', 'crosshair')
          .on('mouseover', function(event) {
            // Show tooltip with all series data at this x-value
            tooltip.transition()
              .duration(200)
              .style('opacity', 0.9);
            
            // Format x-value
            let formattedX: string;
            if (xEncoding.type === 'temporal' && (xVal instanceof Date || !isNaN(Date.parse(String(xVal))))) {
              const date = xVal instanceof Date ? xVal : new Date(String(xVal));
              formattedX = AreaChartUtility.formatDateForTooltip(date, xEncoding);
            } else {
              const xProp = tableProperties?.find(p => p.name === xEncoding.field);
              formattedX = xProp ? displayTextForType(xProp, xVal, context.superstate) : String(xVal);
            }
            
            let tooltipContent = `<div style="font-weight: 600; margin-bottom: 4px;">${formattedX}</div>`;
            
            // Add all y-values at this x position
            yEncodings.forEach(yEncoding => {
              dataPoints.forEach(d => {
                const yVal = d[yEncoding.field];
                if (yVal != null) {
                  const formattedY = formatNumber(Number(yVal));
                  tooltipContent += `<div><strong>${yEncoding.field}:</strong> ${formattedY}</div>`;
                }
              });
            });
            
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
            tooltip.transition()
              .duration(500)
              .style('opacity', 0);
          });
      });
    }
  }

  /**
   * Render area chart using pre-transformed data (aggregated/grouped)
   */
  private static renderWithTransformedData(context: RenderContext, areaData: AreaChartData): void {
    if (!isSVGContext(context)) return;

    const { g, svg, scales, config, graphArea, editMode, selectedElement, onElementSelect, showDataLabels, resolveColor, colorPaletteId, tableProperties } = context;
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    
    if (!xScale || !yScale) return;

    let xEncodings = Array.isArray(config.encoding.x) ? config.encoding.x : [config.encoding.x];
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : [config.encoding.y];
    
    // Ensure correct encoding type
    if (xEncodings[0] && tableProperties) {
      const xProperty = tableProperties.find(p => p.name === xEncodings[0].field);
      const xValues = areaData.xDomain;
      xEncodings[0] = ensureCorrectEncodingType(xEncodings[0], xProperty, xValues);
    }

    const xEncoding = xEncodings[0];
    const yEncoding = yEncodings[0];

    // Store legend items
    const legendItems: Array<{ label: string; color: string }> = [];

    // Create tooltip
    const tooltip = createTooltip('area-tooltip');

    // Helper to get x position
    const getXPosition = (xValue: string | number | Date) => {
      if (xEncoding.type === 'quantitative' || xEncoding.type === 'temporal') {
        const scaledValue = xEncoding.type === 'temporal' 
          ? (xValue instanceof Date ? xValue : new Date(String(xValue)))
          : Number(xValue);
        const result = xScale(scaledValue as any);
        return result;
      } else {
        const bandScale = xScale as any;
        const bandWidth = bandScale.bandwidth ? bandScale.bandwidth() : 0;
        const bandStart = bandScale(String(xValue));
        return bandStart + bandWidth / 2;
      }
    };

    const paletteColors = getPaletteColors(colorPaletteId, context.superstate);
    const solidColors = getSolidPaletteColors(colorPaletteId, context.superstate);

    // Group data by series
    const seriesGroups = new Map<string, typeof areaData.data>();
    areaData.data.forEach(point => {
      if (!seriesGroups.has(point.series)) {
        seriesGroups.set(point.series, []);
      }
      seriesGroups.get(point.series)!.push(point);
    });

    // Render each series
    areaData.series.forEach((seriesName, seriesIndex) => {
      const seriesData = seriesGroups.get(seriesName) || [];
      
      // Sort by x value
      seriesData.sort((a, b) => {
        if (a.x instanceof Date && b.x instanceof Date) {
          return a.x.getTime() - b.x.getTime();
        }
        if (typeof a.x === 'number' && typeof b.x === 'number') {
          return a.x - b.x;
        }
        return String(a.x).localeCompare(String(b.x));
      });

      const fillColor = paletteColors[seriesIndex % paletteColors.length];
      const strokeColor = solidColors[seriesIndex % solidColors.length];

      // Add to legend
      legendItems.push({
        label: seriesName,
        color: fillColor
      });

      // Create area generator
      const area = d3Area<any>()
        .x((d) => getXPosition(d.x))
        .y0((d) => yScale(d.y0 || 0))
        .y1((d) => yScale(d.y))
        .curve((config.mark?.interpolate || 'linear') === 'monotone' ? curveCatmullRom : curveLinear);

      // Create line generator
      const line = d3Line<any>()
        .x((d) => getXPosition(d.x))
        .y((d) => yScale(d.y))
        .curve((config.mark?.interpolate || 'linear') === 'monotone' ? curveCatmullRom : curveLinear);

      // Draw area
      g.append('path')
        .datum(seriesData)
        .attr('class', `area area-series-${seriesIndex}`)
        .attr('fill', fillColor)
        .attr('fill-opacity', config.mark?.fillOpacity || 0.3)
        .attr('d', area);

      // Draw line on top
      g.append('path')
        .datum(seriesData)
        .attr('class', `area-line area-line-series-${seriesIndex}`)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', config.mark?.strokeWidth || 2)
        .attr('d', line);

      // Add tooltip circles
      const tooltipGroup = g.append('g')
        .attr('class', `area-tooltip-points-${seriesIndex}`);

      tooltipGroup.selectAll('circle')
        .data(seriesData)
        .enter()
        .append('circle')
        .attr('cx', (d) => getXPosition(d.x))
        .attr('cy', (d) => yScale(d.y))
        .attr('r', 4)
        .attr('fill', 'transparent')
        .attr('stroke', 'transparent')
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          select(this).attr('fill', strokeColor).attr('stroke', strokeColor).attr('r', 6);
          
          let xDisplay: string;
          if (d.x instanceof Date) {
            // Match axis formatting
            const xEncoding = Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x;
            xDisplay = AreaChartUtility.formatDateForTooltip(d.x, xEncoding);
          } else if (typeof d.x === 'number') {
            xDisplay = formatNumber(d.x);
          } else {
            // Use displayTextForType for proper formatting (handles paths, links, etc.)
            const xProperty = tableProperties?.find(p => p.name === xEncoding.field);
            xDisplay = xProperty && context.superstate 
              ? displayTextForType(xProperty, d.x as any, context.superstate) 
              : String(d.x);
          }
          
          tooltip.transition().duration(200).style('opacity', 0.9);
          tooltip.html(`
            <div style="font-weight: 600; margin-bottom: 4px;">${xDisplay}</div>
            <div><strong>${seriesName}:</strong> ${formatNumber(d.y)}</div>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
          select(this).attr('fill', 'transparent').attr('stroke', 'transparent').attr('r', 4);
          tooltip.transition().duration(500).style('opacity', 0);
        });
    });

    // Store legend items
    if (legendItems.length > 0) {
      (svg as any)._legendItems = legendItems;
    }
  }

  private static renderStackedAreas(
    context: RenderContext, 
    xScale: any, 
    yScale: any, 
    xEncodings: any[], 
    yEncodings: any[], 
    getXPosition: (d: any, xEncoding: any) => number,
    legendItems: Array<{ label: string; color: string }>
  ): void {
    if (!isSVGContext(context)) return;

    const { g, svg, processedData, config, resolveColor } = context;
    const paletteColors = getPaletteColors(context.colorPaletteId, context.superstate);

    // Use the first x encoding for stacking
    const xEncoding = xEncodings[0];
    if (!xEncoding?.field) return;

    // Filter and sort data
    const dataWithPositions = processedData
      .map((d) => ({
        data: d,
        xPos: getXPosition(d, xEncoding)
      }))
      .filter((item) => {
        // Check that all y values are valid and x position is valid
        return yEncodings.every(yEnc => item.data[yEnc.field] != null && !isNaN(Number(item.data[yEnc.field]))) && !isNaN(item.xPos);
      });

    // Sort by x position
    dataWithPositions.sort((a, b) => a.xPos - b.xPos);

    // Extract the sorted data
    const stackData = dataWithPositions.map((item) => item.data);

    // Create stack generator
    const stack = d3Stack()
      .keys(yEncodings.map(enc => enc.field))
      .value((d: any, key) => Number(d[key]) || 0);

    const stackedData = stack(stackData as any);

    // Update y scale domain to account for stacked values
    const maxStackValue = max(stackedData[stackedData.length - 1], d => d[1]) || 0;
    yScale.domain([0, maxStackValue]);

    // Create area generator
    const area = d3Area<any>()
      .x((d) => getXPosition(d.data, xEncoding))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .defined((d) => {
        const xPos = getXPosition(d.data, xEncoding);
        return !isNaN(xPos);
      })
      .curve((config.mark?.interpolate || 'linear') === 'monotone' ? curveMonotoneX : curveLinear);

    // Create line generator for the top edge
    const line = d3Line<any>()
      .x((d) => getXPosition(d.data, xEncoding))
      .y((d) => yScale(d[1]))
      .defined((d) => {
        const xPos = getXPosition(d.data, xEncoding);
        return !isNaN(xPos);
      })
      .curve((config.mark?.interpolate || 'linear') === 'monotone' ? curveMonotoneX : curveLinear);

    // Draw each stacked series
    stackedData.forEach((series, seriesIndex) => {
      const fillColor = paletteColors[seriesIndex % paletteColors.length];
      const strokeColor = config.mark?.stroke ? resolveColor(config.mark.stroke) : fillColor;

      // Add to legend
      legendItems.push({
        label: series.key,
        color: fillColor
      });

      // Draw area
      g.append('path')
        .datum(series)
        .attr('class', `stacked-area stacked-area-series-${seriesIndex}`)
        .attr('fill', fillColor)
        .attr('fill-opacity', config.mark?.fillOpacity || 0.7)
        .attr('d', area);

      // Draw line on top
      g.append('path')
        .datum(series)
        .attr('class', `stacked-area-line stacked-area-line-series-${seriesIndex}`)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', config.mark?.strokeWidth || 2)
        .attr('d', line);

      // Draw points if enabled
      if (config.mark?.point?.show) {
        g.selectAll(`.stacked-area-point-series-${seriesIndex}`)
          .data(series)
          .enter()
          .append('circle')
          .attr('class', `stacked-area-point stacked-area-point-series-${seriesIndex}`)
          .attr('cx', (d) => getXPosition(d.data, xEncoding))
          .attr('cy', (d) => yScale(d[1]))
          .attr('r', config.mark.point.size || 3)
          .attr('fill', resolveColor('var(--mk-ui-background)'))
          .attr('stroke', strokeColor)
          .attr('stroke-width', 2);
      }
    });
  }

  private static renderCanvas(context: RenderContext): void {
    if (!isCanvasContext(context)) return;

    const { ctx, processedData, scales, config, graphArea, resolveColor, colorPaletteId, tableProperties } = context;
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    
    if (!xScale || !yScale) return;

    let xEncodings = Array.isArray(config.encoding.x) ? config.encoding.x : [config.encoding.x];
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : [config.encoding.y];
    
    // Ensure correct encoding type for x-axis (must match the scale type that was created)
    if (xEncodings[0] && tableProperties) {
      const xProperty = tableProperties.find(p => p.name === xEncodings[0].field);
      const xValues = processedData.map(d => d[xEncodings[0].field]);
      xEncodings[0] = ensureCorrectEncodingType(xEncodings[0], xProperty, xValues);
    }

    // Helper to get x position handling both linear and band scales (same as SVG version)
    const getXPosition = (d: any, xEncoding: any) => {
      if (!xEncoding || !xEncoding.field) {
        return NaN;
      }
      
      const value = d[xEncoding.field];
      if (value == null) {
        return NaN;
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
        // Band scale - use center of band for area charts
        const bandScale = xScale as any;
        const bandWidth = bandScale.bandwidth ? bandScale.bandwidth() : 0;
        const bandStart = bandScale(String(value));
        if (bandStart === undefined || isNaN(bandStart)) {
          return NaN;
        }
        return bandStart + bandWidth / 2;
      }
    };

    // Check if we should render stacked
    const hasMultipleYFields = yEncodings.length > 1;
    const shouldStack = hasMultipleYFields && config.stacked;

    if (shouldStack) {
      this.renderStackedAreasCanvas(context, xScale, yScale, xEncodings, yEncodings, getXPosition);
    } else {
      // Handle multiple series
      yEncodings.forEach((yEncoding, seriesIndex) => {
      const xEncoding = xEncodings[Math.min(seriesIndex, xEncodings.length - 1)];
      
      if (!xEncoding?.field || !yEncoding?.field) return;

      // Filter valid data points
      // First, filter and map to include x positions
      const dataWithPositions = processedData
        .map((d) => {
          const xPos = getXPosition(d, xEncoding);
          const yValue = d[yEncoding.field];
          return {
            data: d,
            xPos,
            yValue,
            xValue: d[xEncoding.field]
          };
        })
        .filter((item) => {
          const isValid = item.yValue != null && !isNaN(Number(item.yValue)) && !isNaN(item.xPos);
          return isValid;
        });

      // Sort by x position
      dataWithPositions.sort((a, b) => a.xPos - b.xPos);

      // Now map to final structure with y positions
      const validData = dataWithPositions.map((item) => ({
        data: item.data,
        x: item.xPos,
        y: yScale(Number(item.yValue)),
        xValue: item.xValue,
        yValue: item.yValue
      }));

      if (validData.length < 2) {
        return;
      }

      // Determine colors using palette
      const paletteColors = getPaletteColors(context.colorPaletteId, context.superstate);
      const solidColors = getSolidPaletteColors(context.colorPaletteId, context.superstate);
      
      let fillColor: string;
      let strokeColor: string;
      
      // Always use palette colors for area fill
      fillColor = paletteColors[seriesIndex % paletteColors.length];
      
      if (config.mark?.stroke) {
        strokeColor = resolveColor(config.mark.stroke);
      } else {
        // Use solid color for stroke when gradient is used for fill
        strokeColor = solidColors[seriesIndex % solidColors.length];
      }

      // Draw area
      ctx.save();
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = config.mark?.fillOpacity || 0.3;
      ctx.beginPath();
      
      // Start from bottom at first x position
      ctx.moveTo(validData[0].x, graphArea.bottom);
      
      // Draw to first point
      ctx.lineTo(validData[0].x, validData[0].y);
      
      // Draw top edge through all points
      for (let i = 1; i < validData.length; i++) {
        ctx.lineTo(validData[i].x, validData[i].y);
      }
      
      // Close path at bottom
      ctx.lineTo(validData[validData.length - 1].x, graphArea.bottom);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Draw line on top
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = config.mark?.strokeWidth || 2;
      ctx.beginPath();
      
      ctx.moveTo(validData[0].x, validData[0].y);
      for (let i = 1; i < validData.length; i++) {
        ctx.lineTo(validData[i].x, validData[i].y);
      }
      
      ctx.stroke();
      ctx.restore();

      // Draw points if enabled
      if (config.mark?.point?.show) {
        ctx.save();
        ctx.fillStyle = resolveColor('var(--mk-ui-background)');
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        
        validData.forEach(({x, y}) => {
          ctx.beginPath();
          ctx.arc(x, y, config.mark?.point?.size || 3, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        });
        
        ctx.restore();
      }

      // Draw data labels if enabled
      if (config.mark?.dataLabels?.show && validData.length < 50) {
        ctx.save();
        ctx.fillStyle = resolveColor(config.mark?.dataLabels?.color || 'var(--mk-ui-text-primary)');
        ctx.font = `${config.mark?.dataLabels?.fontSize || 10}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        validData.forEach(({x, y, data}) => {
          const value = data[yEncoding.field];
          ctx.fillText(String(value), x, y - 5);
        });
        
        ctx.restore();
      }
      });
    }
  }

  private static renderStackedAreasCanvas(
    context: RenderContext,
    xScale: any,
    yScale: any,
    xEncodings: any[],
    yEncodings: any[],
    getXPosition: (d: any, xEncoding: any) => number
  ): void {
    if (!isCanvasContext(context)) return;

    const { ctx, processedData, config, resolveColor } = context;
    const paletteColors = getPaletteColors(context.colorPaletteId, context.superstate);

    // Use the first x encoding for stacking
    const xEncoding = xEncodings[0];
    if (!xEncoding?.field) return;

    // Filter and sort data
    const dataWithPositions = processedData
      .map((d) => ({
        data: d,
        xPos: getXPosition(d, xEncoding)
      }))
      .filter((item) => {
        // Check that all y values are valid and x position is valid
        return yEncodings.every(yEnc => item.data[yEnc.field] != null && !isNaN(Number(item.data[yEnc.field]))) && !isNaN(item.xPos);
      });

    // Sort by x position
    dataWithPositions.sort((a, b) => a.xPos - b.xPos);

    // Extract the sorted data
    const stackData = dataWithPositions.map((item) => item.data);

    // Create stack generator
    const stack = d3Stack()
      .keys(yEncodings.map(enc => enc.field))
      .value((d: any, key) => Number(d[key]) || 0);

    const stackedData = stack(stackData as any);

    // Update y scale domain to account for stacked values
    const maxStackValue = max(stackedData[stackedData.length - 1], d => d[1]) || 0;
    yScale.domain([0, maxStackValue]);

    // Draw each stacked series
    stackedData.forEach((series, seriesIndex) => {
      const fillColor = paletteColors[seriesIndex % paletteColors.length];
      const strokeColor = config.mark?.stroke ? resolveColor(config.mark.stroke) : fillColor;

      // Draw area
      ctx.save();
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = config.mark?.fillOpacity || 0.7;
      ctx.beginPath();

      let firstPoint = true;
      series.forEach((d: any) => {
        const x = getXPosition(d.data, xEncoding);
        const y0 = yScale(d[0]);
        const y1 = yScale(d[1]);

        if (!isNaN(x) && !isNaN(y0) && !isNaN(y1)) {
          if (firstPoint) {
            ctx.moveTo(x, y1);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y1);
          }
        }
      });

      // Draw bottom edge in reverse
      for (let i = series.length - 1; i >= 0; i--) {
        const d = series[i];
        const x = getXPosition(d.data, xEncoding);
        const y0 = yScale(d[0]);

        if (!isNaN(x) && !isNaN(y0)) {
          ctx.lineTo(x, y0);
        }
      }

      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Draw line on top
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = config.mark?.strokeWidth || 2;
      ctx.beginPath();

      firstPoint = true;
      series.forEach((d: any) => {
        const x = getXPosition(d.data, xEncoding);
        const y = yScale(d[1]);

        if (!isNaN(x) && !isNaN(y)) {
          if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });

      ctx.stroke();
      ctx.restore();

      // Draw points if enabled
      if (config.mark?.point?.show) {
        ctx.save();
        ctx.fillStyle = resolveColor('var(--mk-ui-background)');
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;

        series.forEach((d: any) => {
          const x = getXPosition(d.data, xEncoding);
          const y = yScale(d[1]);

          if (!isNaN(x) && !isNaN(y)) {
            ctx.beginPath();
            ctx.arc(x, y, config.mark?.point?.size || 3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          }
        });

        ctx.restore();
      }
    });
  }
}