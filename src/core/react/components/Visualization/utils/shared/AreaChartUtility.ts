import { area as d3Area, line as d3Line, curveMonotoneX, curveLinear, stack as d3Stack, max } from 'core/utils/d3-imports';
import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';
import { getPaletteColors, getSolidPaletteColors } from '../utils';
import { GradientUtility, GradientConfig } from './GradientUtility';

export class AreaChartUtility {
  static render(context: RenderContext): void {
    if (isSVGContext(context)) {
      this.renderSVG(context);
    } else if (isCanvasContext(context)) {
      this.renderCanvas(context);
    }
  }

  private static renderSVG(context: RenderContext): void {
    if (!isSVGContext(context)) return;

    const { g, svg, processedData, scales, config, graphArea, editMode, selectedElement, onElementSelect, showDataLabels, resolveColor, colorPaletteId } = context;
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    
    if (!xScale || !yScale) return;

    const xEncodings = Array.isArray(config.encoding.x) ? config.encoding.x : [config.encoding.x];
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : [config.encoding.y];

    // Store legend items
    const legendItems: Array<{ label: string; color: string }> = [];

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
        .curve((config.mark?.interpolate || 'linear') === 'monotone' ? curveMonotoneX : curveLinear);

      // Create line generator for the top edge
      const line = d3Line<any>()
        .x((d) => getXPosition(d, xEncoding))
        .y((d) => yScale(d[yEncoding.field]))
        .defined((d) => {
          const xPos = getXPosition(d, xEncoding);
          return d[yEncoding.field] != null && !isNaN(d[yEncoding.field]) && !isNaN(xPos);
        })
        .curve((config.mark?.interpolate || 'linear') === 'monotone' ? curveMonotoneX : curveLinear);

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

    const { ctx, processedData, scales, config, graphArea, resolveColor, colorPaletteId } = context;
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    
    if (!xScale || !yScale) return;

    const xEncodings = Array.isArray(config.encoding.x) ? config.encoding.x : [config.encoding.x];
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : [config.encoding.y];

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