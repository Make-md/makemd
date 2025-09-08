import { select, schemeCategory10, scaleBand, stack, max } from 'core/utils/d3-imports';
import { RenderContext, isCanvasContext, isSVGContext } from '../RenderContext';
import { getPaletteColors } from '../utils';
import { displayTextForType } from 'core/utils/displayTextForType';
import { GradientUtility, GradientConfig } from './GradientUtility';
import { BarChartData } from '../../transformers';

export class BarChartUtility {
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
    if (transformedData?.type === 'bar' && transformedData.data) {
      this.renderWithTransformedData(context, transformedData.data as BarChartData);
      return;
    }
    
    // Fall back to legacy rendering
    this.renderLegacy(context);
  }

  private static renderWithTransformedData(context: RenderContext, barData: BarChartData): void {
    if (!isSVGContext(context)) return;
    
    const { g, svg, scales, config, graphArea, editMode, selectedElement, onElementSelect, showDataLabels, resolveColor } = context;
    
    const xScale = scales.get('x');
    const yScale = scales.get('y');
    
    if (!xScale || !yScale || !barData.data || barData.data.length === 0) return;
    
    const themeColors = getPaletteColors(context.colorPaletteId, context.superstate);
    
    // Create tooltip
    const tooltip = select('body').append('div')
      .attr('class', 'bar-tooltip')
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
    
    // Calculate bar dimensions
    const bandwidth = xScale.bandwidth ? xScale.bandwidth() : 40;
    const barPadding = bandwidth * 0.1;
    
    // Group bars by category for grouped/stacked rendering
    const categoryGroups = new Map<string, BarChartData['data']>();
    barData.data.forEach(d => {
      const key = String(d.category);
      if (!categoryGroups.has(key)) {
        categoryGroups.set(key, []);
      }
      categoryGroups.get(key)!.push(d);
    });
    
    // Determine bar width based on grouping
    const hasMultipleSeries = barData.series && barData.series.length > 1;
    const barWidth = hasMultipleSeries && !barData.stacks
      ? (bandwidth - barPadding * 2) / (barData.series?.length || 1)
      : bandwidth - barPadding * 2;
    
    // Render bars
    const bars = g.selectAll('.bar')
      .data(barData.data)
      .enter()
      .append('rect')
      .attr('class', d => `bar ${d.series ? `series-${d.series}` : ''}`)
      .attr('x', d => {
        const baseX = xScale(String(d.category));
        if (!hasMultipleSeries || barData.stacks) {
          return baseX + barPadding;
        }
        // For grouped bars, offset by series index
        const seriesIndex = barData.series?.indexOf(d.series || '') || 0;
        return baseX + barPadding + seriesIndex * barWidth;
      })
      .attr('y', d => {
        if ((d as any).y1 !== undefined) {
          // Stacked bar
          return yScale((d as any).y1);
        }
        return yScale(Math.max(0, d.value));
      })
      .attr('width', barWidth)
      .attr('height', d => {
        if ((d as any).y0 !== undefined && (d as any).y1 !== undefined) {
          // Stacked bar
          return Math.abs(yScale((d as any).y0) - yScale((d as any).y1));
        }
        const zeroY = yScale(0);
        const valueY = yScale(d.value);
        return Math.abs(valueY - zeroY);
      })
      .attr('fill', (d, i) => {
        if (d.color) return d.color;
        
        // Use color scale if available (for grouped bars with color encoding)
        const colorScale = scales.get('color');
        if (d.series && colorScale) {
          return colorScale(d.series);
        }
        
        // Fall back to theme colors indexed by series
        if (d.series && barData.series) {
          const seriesIndex = barData.series.indexOf(d.series);
          return themeColors[seriesIndex % themeColors.length];
        }
        return themeColors[0];
      })
      .attr('opacity', config.mark?.opacity || 0.8)
      .style('cursor', 'pointer');
    
    // Add interactivity
    bars
      .on('mouseover', function(event, d) {
        select(this)
          .transition()
          .duration(150)
          .attr('opacity', 1);
        
        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        
        const tooltipContent = `
          <div><strong>${d.category}</strong></div>
          ${d.series ? `<div>${d.series}</div>` : ''}
          <div>Value: ${d.value.toFixed(2)}</div>
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
      .on('mouseout', function() {
        select(this)
          .transition()
          .duration(150)
          .attr('opacity', config.mark?.opacity || 0.8);
        
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
    
    // Store tooltip reference for cleanup
    (svg.node() as any).__barTooltip = tooltip;
  }

  private static renderLegacy(context: RenderContext): void {
    if (!isSVGContext(context)) return;
    
    const { g, svg, processedData, scales, config, graphArea, editMode, selectedElement, onElementSelect, showDataLabels, showLegend, resolveColor } = context;

    const xScale = scales.get('x');
    const yScale = scales.get('y');

    if (!xScale || !yScale) return;

    // Helper to get x value(s) from data
    const getXValue = (d: any): string => {
      if (Array.isArray(config.encoding.x)) {
        // Multiple fields - create composite key
        return config.encoding.x.map(enc => String(d[enc.field] || '')).join(' | ');
      } else if (config.encoding.x) {
        // Single field
        return String(d[(config.encoding.x && !Array.isArray(config.encoding.x) ? config.encoding.x.field : '') || '']);
      }
      return '';
    };

    // Update scale domain for multiple fields
    if (Array.isArray(config.encoding.x) && xScale.domain) {
      const uniqueCompositeValues = Array.from(new Set(processedData.map(d => getXValue(d))));
      xScale.domain(uniqueCompositeValues);
    }

    // Check if we have multiple Y fields or color grouping
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : (config.encoding.y ? [config.encoding.y] : []);
    const hasMultipleYFields = yEncodings.length > 1;
    const hasColorGrouping = !!config.encoding.color?.field;
    
    // Default to stacked when there are multiple Y fields or color grouping
    const shouldStack = hasMultipleYFields || hasColorGrouping ? (config.stacked !== false) : false;

    if (shouldStack && (hasMultipleYFields || hasColorGrouping)) {
      this.renderStackedBars(context, xScale, yScale, yEncodings, getXValue);
    } else if (hasMultipleYFields || hasColorGrouping) {
      // Render grouped bars when not stacked
      this.renderGroupedBars(context, xScale, yScale, yEncodings, getXValue);
    } else {
      this.renderSingleBarsLegacy(context, xScale, yScale, yEncodings, getXValue);
    }
  }

  private static renderSingleBarsLegacy(context: RenderContext, xScale: any, yScale: any, yEncodings: any[], getXValue: (d: any) => string): void {
    if (!isSVGContext(context)) return;

    const { g, svg, processedData, scales, config, graphArea, editMode, selectedElement, onElementSelect, showDataLabels, showLegend, resolveColor } = context;
    const colorScale = scales.get('color');
    const colorField = config.encoding.color?.field;
    const yField = yEncodings[0]?.field;
    const themeColors = getPaletteColors(context.colorPaletteId, context.superstate);


    if (!yField) return;

    // Calculate bar width based on scale type
    let bandwidth: number;
    let barWidth: number;
    let barPadding: number;
    
    if (xScale.bandwidth) {
      // Band scale (categorical)
      bandwidth = xScale.bandwidth();
      barPadding = bandwidth * 0.1;
      barWidth = bandwidth - barPadding * 2;
    } else {
      // Time or linear scale - calculate width based on data points
      const dataCount = processedData.length;
      const availableWidth = graphArea.right - graphArea.left;
      bandwidth = availableWidth / (dataCount + 1);
      barWidth = Math.min(bandwidth * 0.8, 40); // Max width of 40px for time series bars
      barPadding = (bandwidth - barWidth) / 2;
    }

    const bars = g
      .selectAll('.bar')
      .data(processedData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d: any) => {
        const xValue = getXValue(d);
        let xPos: number;
        
        // Handle different scale types
        if (xScale.bandwidth) {
          // Band scale
          xPos = xScale(xValue);
        } else if (config.encoding.x && !Array.isArray(config.encoding.x) && config.encoding.x.type === 'temporal') {
          // Time scale
          const fieldValue = d[config.encoding.x.field];
          const dateValue = fieldValue instanceof Date ? fieldValue : new Date(fieldValue);
          xPos = xScale(dateValue);
        } else {
          // Linear scale
          xPos = xScale(Number(xValue));
        }
        
        // Center the bar for non-band scales
        if (!xScale.bandwidth && xPos !== undefined) {
          xPos = xPos - barWidth / 2;
        }
        
        return xPos !== undefined ? xPos + (xScale.bandwidth ? barPadding : 0) : 0;
      })
      .attr('y', (d: any) => {
        const value = Number(d[yField]) || 0;
        // For negative values, y should be at zero line
        return value >= 0 ? yScale(value) : yScale(0);
      })
      .attr('width', barWidth)
      .attr('height', (d: any) => {
        const value = Number(d[yField]) || 0;
        // For negative values, height is from zero down to the value
        return Math.abs(yScale(0) - yScale(value));
      })
      .attr('fill', (d: any, i: number) => {
        // Check if gradient is configured
        const markConfig = config.mark as any;
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
            const gradientColor = gradientColors[i % gradientColors.length];
            
            const parsedGradient = GradientUtility.parseCSSGradient(gradientColor.value);
            if (parsedGradient) {
              // Override angle to vertical (180 degrees = top to bottom)
              parsedGradient.angle = 180;
              parsedGradient.direction = 'vertical';
              const svgGradientId = GradientUtility.createSVGGradient(svg, parsedGradient);
              return svgGradientId;
            } else {
            }
          }
        }
        
        if (palette?.gradients && palette.gradients.length > 0) {
          // Use gradient from palette (cycle through available gradients for different bars)
          const paletteGradient = palette.gradients[i % palette.gradients.length];
          
          const gradientConfig: GradientConfig = {
            type: paletteGradient.type,
            colors: paletteGradient.stops.map((stop: any) => stop.color),
            positions: paletteGradient.stops.map((stop: any) => stop.position),
            angle: paletteGradient.direction,
            centerX: paletteGradient.center?.x || 0.5,
            centerY: paletteGradient.center?.y || 0.5
          };
          
          const result = GradientUtility.applyGradient(context, gradientConfig) as string;
          return result;
        }
        
        // Default color logic
        let color: string;
        if (colorField && colorScale) {
          try {
            color = colorScale(d[colorField]) || themeColors[0];
          } catch (e) {
            color = themeColors[0];
          }
        } else {
          // Use color palette - use index for different bars
          color = themeColors[i % themeColors.length];
        }
        return color;
      })
      .attr('opacity', config.mark?.opacity || 1)
      .attr('cursor', editMode ? 'pointer' : 'default')
      .attr('rx', 4)
      .attr('ry', 4);

    // Create tooltip
    const tooltip = select('body').append('div')
      .attr('class', 'bar-tooltip')
      .style('position', 'absolute')
      .style('padding', '8px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Add hover effects and tooltips
    bars
      .on('mouseover', function(event, d: any) {
        // Get the bar color
        const barElement = select(this);
        const barColor = barElement.attr('fill');
        
        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);

        // Build tooltip content
        let tooltipContent = '';
        
        // X field(s) (not indented)
        if (Array.isArray(config.encoding.x)) {
          config.encoding.x.forEach((enc) => {
            if (enc.field) {
              const xValue = d[enc.field];
              const xProp = context.tableProperties?.find(p => p.name === enc.field);
              const formattedX = xProp ? displayTextForType(xProp, xValue, context.superstate) : xValue;
              tooltipContent += `<div>${formattedX}</div>`;
            }
          });
        } else if (config.encoding.x && !Array.isArray(config.encoding.x) && config.encoding.x.field) {
          const xEncoding = config.encoding.x as { field: string };
          const xValue = d[xEncoding.field];
          const xProp = context.tableProperties?.find(p => p.name === xEncoding.field);
          const formattedX = xProp ? displayTextForType(xProp, xValue, context.superstate) : xValue;
          tooltipContent += `<div>${formattedX}</div>`;
        }
        
        // Y value with color square
        tooltipContent += `<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">`;
        tooltipContent += `<div style="width: 12px; height: 12px; background-color: ${barColor}; border-radius: 2px; flex-shrink: 0;"></div>`;
        
        tooltipContent += `<div>`;
        const yValue = d[yField];
        const yProp = context.tableProperties?.find(p => p.name === yField);
        const formattedY = yProp ? displayTextForType(yProp, yValue, context.superstate) : yValue;
        tooltipContent += `${formattedY}`;
        
        // Add color field if present
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

        // Highlight the bar
        select(this)
          .transition()
          .duration(100)
          .attr('opacity', (config.mark?.opacity || 1) * 0.8);
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

        select(this)
          .transition()
          .duration(100)
          .attr('opacity', config.mark?.opacity || 1);
      });

    // Add interactivity for edit mode
    if (editMode) {
      bars.on('click', function(event, d: any) {
        if (onElementSelect) {
          onElementSelect({
            type: 'series',
            id: `bar-${getXValue(d)}`,
          });
        }
      });

      // Add selection indicator
      if (selectedElement?.type === 'series') {
        g.append('rect')
          .attr('x', graphArea.left)
          .attr('y', graphArea.top)
          .attr('width', graphArea.width)
          .attr('height', graphArea.height)
          .attr('fill', 'none')
          .attr('stroke', 'var(--mk-ui-accent)')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,2')
          .attr('pointer-events', 'none');
      }
    }

    // Add data labels
    if (showDataLabels || config.mark?.dataLabels?.show) {
      g.selectAll('.bar-label')
        .data(processedData)
        .enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('x', (d: any) => {
          const xValue = getXValue(d);
          const xPos = xScale(xValue);
          return xPos !== undefined ? xPos + bandwidth / 2 : 0;
        })
        .attr('y', (d: any) => yScale(Number(d[yField]) || 0) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', `${config.mark?.dataLabels?.fontSize || 11}px`)
        .style('fill', config.mark?.dataLabels?.color || '#374151')
        .style('font-weight', '500')
        .text((d: any) => {
          const value = Number(d[yField]) || 0;
          return Number.isInteger(value) ? value.toString() : value.toFixed(1);
        });
    }

    // Add legend for color encoding
    if (showLegend) {
      if (colorField && colorScale) {
        const categories = Array.from(new Set(processedData.map(d => String(d[colorField]))));
        colorScale.domain(categories);

        const legendItems = categories.map(category => ({
          label: category,
          color: colorScale(category)
        }));

        (svg as any)._legendItems = legendItems;
      } else if (config.encoding.color) {
        // Even without a color scale, if color encoding is defined, create a default legend
        const colors = schemeCategory10;
        const categories = Array.from(new Set(processedData.map(d => String(d[config.encoding.color!.field]))));
        
        const legendItems = categories.map((category, i) => ({
          label: category,
          color: colors[i % colors.length]
        }));

        (svg as any)._legendItems = legendItems;
      }
    }

    // Store tooltip reference for cleanup
    (svg.node() as any).__barTooltip = tooltip;
  }

  private static renderGroupedBars(context: RenderContext, xScale: any, yScale: any, yEncodings: any[], getXValue: (d: any) => string): void {
    if (!isSVGContext(context)) return;

    const { g, svg, processedData, config, graphArea, editMode, selectedElement, onElementSelect, showDataLabels, showLegend, resolveColor } = context;
    const themeColors = getPaletteColors(context.colorPaletteId, context.superstate);

    const hasMultipleYFields = yEncodings.length > 1;
    const colorField = config.encoding.color?.field;
    const hasColorGrouping = !!colorField;

    // Calculate group width based on scale type
    let groupWidth: number;
    if (xScale.bandwidth) {
      groupWidth = xScale.bandwidth();
    } else {
      // For time/linear scales, calculate appropriate group width
      const dataCount = processedData.length;
      const availableWidth = graphArea.right - graphArea.left;
      groupWidth = Math.min(availableWidth / (dataCount + 1), 100); // Max group width of 100px
    }

    let x1Scale: any;
    let groupCategories: string[];

    if (hasMultipleYFields) {
      // Multiple Y fields - group by Y field
      groupCategories = yEncodings.map((_, i) => String(i));
      x1Scale = scaleBand()
        .domain(groupCategories)
        .range([0, groupWidth])
        .padding(0.05);
    } else if (hasColorGrouping) {
      // Single Y field with color grouping - group by color values
      groupCategories = Array.from(new Set(processedData.map(d => String(d[colorField] || 'Unknown'))));
      x1Scale = scaleBand()
        .domain(groupCategories)
        .range([0, groupWidth])
        .padding(0.05);
    } else {
      // Fallback - shouldn't happen with current logic
      groupCategories = ['0'];
      x1Scale = scaleBand()
        .domain(groupCategories)
        .range([0, groupWidth])
        .padding(0.05);
    }

    // Create tooltip
    const tooltip = select('body').append('div')
      .attr('class', 'bar-tooltip')
      .style('position', 'absolute')
      .style('padding', '8px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    if (hasMultipleYFields) {
      // Handle multiple Y fields - group by X value, then create bars for each Y field
      const xValues = Array.from(new Set(processedData.map(d => getXValue(d))));
      
      xValues.forEach(xValue => {
        const dataForX = processedData.filter(d => getXValue(d) === xValue);
        if (dataForX.length === 0) return;
        
        const xPos = xScale.bandwidth ? xScale(xValue) : 
          (config.encoding.x && !Array.isArray(config.encoding.x) && config.encoding.x.type === 'temporal' 
            ? xScale(new Date(dataForX[0][config.encoding.x.field] as string | number)) - groupWidth / 2
            : xScale(Number(xValue)) - groupWidth / 2);
        
        yEncodings.forEach((yEncoding, i) => {
          const value = Number(dataForX[0][yEncoding.field]);
          if (isNaN(value)) return;
          
          g.append('rect')
            .attr('class', `bar bar-${i}`)
            .attr('x', (xPos || 0) + (x1Scale(String(i)) || 0))
            .attr('y', value >= 0 ? yScale(value) : yScale(0))
            .attr('width', x1Scale.bandwidth())
            .attr('height', Math.abs(yScale(0) - yScale(value)))
            .attr('fill', themeColors[i % themeColors.length] || '#3b82f6')
            .attr('opacity', config.mark?.opacity || 1)
            .attr('cursor', editMode ? 'pointer' : 'default')
            .attr('rx', 4)
            .attr('ry', 4)
            .on('mouseover', function(event) {
              const barColor = select(this).attr('fill');
              tooltip.transition().duration(200).style('opacity', 0.9);
              
              let tooltipContent = `<div>${xValue}</div>`;
              tooltipContent += `<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">`;
              tooltipContent += `<div style="width: 12px; height: 12px; background-color: ${barColor}; border-radius: 2px;"></div>`;
              tooltipContent += `<div>${value} • ${yEncoding.field}</div></div>`;
              
              tooltip.html(tooltipContent)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
              
              select(this).transition().duration(100).attr('opacity', (config.mark?.opacity || 1) * 0.8);
            })
            .on('mousemove', function(event: any) {
              tooltip.style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
              tooltip.transition().duration(500).style('opacity', 0);
              select(this).transition().duration(100).attr('opacity', config.mark?.opacity || 1);
            });
        });
      });
    } else if (hasColorGrouping) {
      // Handle single Y field with color grouping - group by X value, then create bars for each color category
      const yField = yEncodings[0]?.field;
      if (!yField) return;
      
      const xValues = Array.from(new Set(processedData.map(d => getXValue(d))));
      
      xValues.forEach(xValue => {
        const dataForX = processedData.filter(d => getXValue(d) === xValue);
        if (dataForX.length === 0) return;
        
        const xPos = xScale.bandwidth ? xScale(xValue) : 
          (config.encoding.x && !Array.isArray(config.encoding.x) && config.encoding.x.type === 'temporal' 
            ? xScale(new Date(dataForX[0][config.encoding.x.field] as string | number)) - groupWidth / 2
            : xScale(Number(xValue)) - groupWidth / 2);
        
        // Group data by color value
        const colorGroups = new Map<string, any[]>();
        dataForX.forEach(d => {
          const colorValue = String(d[colorField] || 'Unknown');
          if (!colorGroups.has(colorValue)) {
            colorGroups.set(colorValue, []);
          }
          colorGroups.get(colorValue)!.push(d);
        });
        
        groupCategories.forEach((colorValue, i) => {
          const dataForColor = colorGroups.get(colorValue) || [];
          if (dataForColor.length === 0) return;
          
          // Sum values for this color group
          const totalValue = dataForColor.reduce((sum, d) => sum + (Number(d[yField]) || 0), 0);
          
          g.append('rect')
            .attr('class', `bar bar-color-${i}`)
            .attr('x', (xPos || 0) + (x1Scale(colorValue) || 0))
            .attr('y', totalValue >= 0 ? yScale(totalValue) : yScale(0))
            .attr('width', x1Scale.bandwidth())
            .attr('height', Math.abs(yScale(0) - yScale(totalValue)))
            .attr('fill', themeColors[i % themeColors.length] || '#3b82f6')
            .attr('opacity', config.mark?.opacity || 1)
            .attr('cursor', editMode ? 'pointer' : 'default')
            .attr('rx', 4)
            .attr('ry', 4)
            .on('mouseover', function(event) {
              const barColor = select(this).attr('fill');
              tooltip.transition().duration(200).style('opacity', 0.9);
              
              let tooltipContent = `<div>${xValue}</div>`;
              tooltipContent += `<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">`;
              tooltipContent += `<div style="width: 12px; height: 12px; background-color: ${barColor}; border-radius: 2px;"></div>`;
              tooltipContent += `<div>${totalValue} • ${colorValue}</div></div>`;
              
              tooltip.html(tooltipContent)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
              
              select(this).transition().duration(100).attr('opacity', (config.mark?.opacity || 1) * 0.8);
            })
            .on('mousemove', function(event: any) {
              tooltip.style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
              tooltip.transition().duration(500).style('opacity', 0);
              select(this).transition().duration(100).attr('opacity', config.mark?.opacity || 1);
            });
        });
      });
    }


    // Add click handler in edit mode
    if (editMode) {
      g.selectAll('.bar-group').on('click', () => {
        if (onElementSelect) {
          onElementSelect({ type: 'series' });
        }
      });

      if (selectedElement?.type === 'series') {
        g.append('rect')
          .attr('x', graphArea.left)
          .attr('y', graphArea.top)
          .attr('width', graphArea.width)
          .attr('height', graphArea.height)
          .attr('fill', 'none')
          .attr('stroke', 'var(--mk-ui-accent)')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,2')
          .attr('pointer-events', 'none');
      }
    }

    // Store legend data
    if (showLegend && yEncodings.length > 1) {
      const legendItems = yEncodings.map((enc, i) => ({
        label: enc.field,
        color: themeColors[i % themeColors.length]
      }));
      (svg as any)._legendItems = legendItems;
    }

    // Store tooltip reference for cleanup
    (svg.node() as any).__barTooltip = tooltip;
  }

  private static renderStackedBars(context: RenderContext, xScale: any, yScale: any, yEncodings: any[], getXValue: (d: any) => string): void {
    if (!isSVGContext(context)) return;

    const { g, svg, processedData, config, graphArea, editMode, selectedElement, onElementSelect, showDataLabels, showLegend, resolveColor } = context;
    const themeColors = getPaletteColors(context.colorPaletteId, context.superstate);
    
    const colorField = config.encoding.color?.field;
    const hasMultipleYFields = yEncodings.length > 1;
    const hasColorGrouping = !!colorField;
    
    let stackedData: any[];
    let stackKeys: string[];

    if (hasMultipleYFields) {
      // Multiple Y fields - stack by Y field
      stackKeys = yEncodings.map(enc => enc.field);
      stackedData = stack()
        .keys(stackKeys)
        .value((d: any, key) => Number(d[key]) || 0)(processedData as any);
    } else if (hasColorGrouping) {
      // Single Y field with color grouping - reshape data and stack by color groups
      const yField = yEncodings[0]?.field;
      if (!yField) return;
      
      // Get unique color values and x values
      const colorValues = Array.from(new Set(processedData.map(d => String(d[colorField] || 'Unknown'))));
      const xValues = Array.from(new Set(processedData.map(d => getXValue(d))));
      
      // Reshape data - create one object per x value with properties for each color group
      const reshapedData: any[] = xValues.map(xVal => {
        const xFieldName = Array.isArray(config.encoding.x) ? config.encoding.x[0]?.field : config.encoding.x?.field;
        const baseObj: any = { [xFieldName || 'x']: xVal };
        
        colorValues.forEach(colorVal => {
          const matchingRows = processedData.filter(d => 
            getXValue(d) === xVal && String(d[colorField] || 'Unknown') === colorVal
          );
          
          // Sum all values for this x,color combination
          const sum = matchingRows.reduce((acc, row) => acc + (Number(row[yField]) || 0), 0);
          baseObj[colorVal] = sum;
        });
        
        return baseObj;
      });
      
      stackKeys = colorValues;
      stackedData = stack()
        .keys(stackKeys)
        .value((d: any, key) => Number(d[key]) || 0)(reshapedData as any);
    } else {
      return; // No stacking scenario
    }

    // Update y scale domain to account for stacked values
    const maxStackValue = max(stackedData[stackedData.length - 1], (d: any) => d[1]) || 0;
    yScale.domain([0, maxStackValue]);

    // Create tooltip
    const tooltip = select('body').append('div')
      .attr('class', 'bar-tooltip')
      .style('position', 'absolute')
      .style('padding', '8px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Create groups for each series
    const series = g.selectAll('.series')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('class', 'series')
      .attr('fill', (d, i) => {
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
            const gradientColor = gradientColors[i % gradientColors.length];
            
            const parsedGradient = GradientUtility.parseCSSGradient(gradientColor.value);
            if (parsedGradient) {
              // Override angle to vertical (180 degrees = top to bottom)
              parsedGradient.angle = 180;
              parsedGradient.direction = 'vertical';
              const svgGradientId = GradientUtility.createSVGGradient(svg, parsedGradient);
              return svgGradientId;
            }
          }
        }
        
        // Default to theme colors
        return themeColors[i % themeColors.length] || '#3b82f6';
      });

    // Create bars for each series
    series.selectAll('rect')
      .data((d, i) => d.map((v: any) => ({ ...v, key: d.key, seriesIndex: i, totalSeries: stackedData.length })))
      .enter()
      .append('rect')
      .attr('class', 'stacked-bar')
      .attr('x', (d: any) => {
        const xValue = getXValue(d.data);
        const xPos = xScale(xValue);
        return xPos !== undefined ? xPos : 0;
      })
      .attr('y', (d: any) => yScale(d[1]))
      .attr('height', (d: any) => yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth())
      .attr('opacity', config.mark?.opacity || 1)
      .attr('cursor', editMode ? 'pointer' : 'default')
      // Only apply rounded corners to top of top segment and bottom of bottom segment
      .each(function(d: any) {
        const rect = select(this);
        const isBottomSegment = d.seriesIndex === 0;
        const isTopSegment = d.seriesIndex === d.totalSeries - 1;
        
        if (isBottomSegment && isTopSegment) {
          // Single segment - round all corners
          rect.attr('rx', 4).attr('ry', 4);
        } else if (isBottomSegment) {
          // Bottom segment - only round bottom corners
          // We'll use a clipPath for this since SVG doesn't support individual corner rounding
          const clipId = `bottom-clip-${Math.random().toString(36).substring(2, 9)}`;
          const clipPath = svg.append('defs').append('clipPath').attr('id', clipId);
          const x = parseFloat(rect.attr('x'));
          const y = parseFloat(rect.attr('y'));
          const width = parseFloat(rect.attr('width'));
          const height = parseFloat(rect.attr('height'));
          
          // Create a path that rounds only bottom corners
          clipPath.append('path')
            .attr('d', `
              M ${x} ${y}
              L ${x + width} ${y}
              L ${x + width} ${y + height - 4}
              Q ${x + width} ${y + height} ${x + width - 4} ${y + height}
              L ${x + 4} ${y + height}
              Q ${x} ${y + height} ${x} ${y + height - 4}
              Z
            `);
          rect.attr('clip-path', `url(#${clipId})`);
        } else if (isTopSegment) {
          // Top segment - only round top corners
          const clipId = `top-clip-${Math.random().toString(36).substring(2, 9)}`;
          const clipPath = svg.append('defs').append('clipPath').attr('id', clipId);
          const x = parseFloat(rect.attr('x'));
          const y = parseFloat(rect.attr('y'));
          const width = parseFloat(rect.attr('width'));
          const height = parseFloat(rect.attr('height'));
          
          // Create a path that rounds only top corners
          clipPath.append('path')
            .attr('d', `
              M ${x} ${y + 4}
              Q ${x} ${y} ${x + 4} ${y}
              L ${x + width - 4} ${y}
              Q ${x + width} ${y} ${x + width} ${y + 4}
              L ${x + width} ${y + height}
              L ${x} ${y + height}
              Z
            `);
          rect.attr('clip-path', `url(#${clipId})`);
        }
        // Middle segments - no rounding
      })
      .on('mouseover', function(event, d: any) {
        // Get the bar color
        const barElement = select(this);
        const barColor = barElement.attr('fill');
        
        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);

        // Build tooltip content
        let tooltipContent = '';
        
        // X value (not indented)
        if (Array.isArray(config.encoding.x)) {
          config.encoding.x.forEach((enc) => {
            if (enc.field) {
              const xValue = d.data[enc.field];
              const xProp = context.tableProperties?.find(p => p.name === enc.field);
              const formattedX = xProp ? displayTextForType(xProp, xValue, context.superstate) : xValue;
              tooltipContent += `<div>${formattedX}</div>`;
            }
          });
        } else if (config.encoding.x && !Array.isArray(config.encoding.x) && config.encoding.x.field) {
          const xEncoding = config.encoding.x as { field: string };
          const xValue = d.data[xEncoding.field];
          const xProp = context.tableProperties?.find(p => p.name === xEncoding.field);
          const formattedX = xProp ? displayTextForType(xProp, xValue, context.superstate) : xValue;
          tooltipContent += `<div>${formattedX}</div>`;
        }
        
        // Y value with color square
        tooltipContent += `<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">`;
        tooltipContent += `<div style="width: 12px; height: 12px; background-color: ${barColor}; border-radius: 2px; flex-shrink: 0;"></div>`;
        
        tooltipContent += `<div>`;
        // Y value for this series
        const value = d[1] - d[0];
        const yProp = context.tableProperties?.find(p => p.name === d.key);
        const formattedY = yProp ? displayTextForType(yProp, value, context.superstate) : 
                          (Number.isInteger(value) ? value.toString() : value.toFixed(2));
        tooltipContent += `${formattedY}`;
        
        // Add series name
        tooltipContent += ` • ${d.key}`;
        
        tooltipContent += `<br/><span style="color: ${resolveColor('var(--mk-ui-text-secondary)')};">Total: ${d[1].toFixed(2)}</span>`;
        tooltipContent += `</div>`;
        tooltipContent += `</div>`;

        tooltip.html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');

        // Highlight the bar
        select(this)
          .transition()
          .duration(100)
          .attr('opacity', (config.mark?.opacity || 1) * 0.8);
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

        select(this)
          .transition()
          .duration(100)
          .attr('opacity', config.mark?.opacity || 1);
      });

    // Add data labels on top of stacked bars
    if (showDataLabels || config.mark?.dataLabels?.show) {
      series.selectAll('.stacked-bar-label')
        .data(d => d.map((v: any) => ({ ...v, key: d.key })))
        .enter()
        .append('text')
        .attr('class', 'stacked-bar-label')
        .attr('x', (d: any) => {
          const xValue = getXValue(d.data);
          const xPos = xScale(xValue);
          return xPos !== undefined ? xPos + xScale.bandwidth() / 2 : 0;
        })
        .attr('y', (d: any) => {
          const midpoint = (d[0] + d[1]) / 2;
          return yScale(midpoint);
        })
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', `${config.mark?.dataLabels?.fontSize || 11}px`)
        .style('fill', 'white')
        .style('font-weight', '500')
        .text((d: any) => {
          const value = d[1] - d[0];
          if (value === 0) return '';
          return Number.isInteger(value) ? value.toString() : value.toFixed(1);
        })
        .style('opacity', (d: any) => {
          // Hide label if segment is too small
          const segmentHeight = yScale(d[0]) - yScale(d[1]);
          return segmentHeight < 20 ? 0 : 1;
        });
    }

    // Add legend for stacked bar chart
    if (showLegend) {
      const legendItems = yEncodings.map((enc, i) => ({
        label: enc.field,
        color: themeColors[i % themeColors.length]
      }));
      (svg as any)._legendItems = legendItems;
    }

    // Store tooltip reference for cleanup
    (svg.node() as any).__barTooltip = tooltip;
  }

  private static renderCanvas(context: RenderContext): void {
    if (!isCanvasContext(context)) return;

    const { ctx, processedData, scales, config, graphArea, resolveColor } = context;

    const xScale = scales.get('x');
    const yScale = scales.get('y');

    if (!xScale || !yScale) {
      return;
    }

    // Helper to get x value(s) from data
    const getXValue = (d: any): string => {
      if (Array.isArray(config.encoding.x)) {
        return config.encoding.x.map(enc => String(d[enc.field] || '')).join(' | ');
      } else if (config.encoding.x) {
        return String(d[(config.encoding.x && !Array.isArray(config.encoding.x) ? config.encoding.x.field : '') || '']);
      }
      return '';
    };

    // Check if we have multiple Y fields or color grouping
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : (config.encoding.y ? [config.encoding.y] : []);
    const hasMultipleYFields = yEncodings.length > 1;
    const hasColorGrouping = !!config.encoding.color?.field;
    
    // Default to stacked when there are multiple Y fields or color grouping
    const shouldStack = hasMultipleYFields || hasColorGrouping ? (config.stacked !== false) : false;

    if (shouldStack && (hasMultipleYFields || hasColorGrouping)) {
      this.renderStackedBarsCanvas(context, xScale, yScale, yEncodings, getXValue);
    } else if (hasMultipleYFields || hasColorGrouping) {
      // Render grouped bars when not stacked
      this.renderGroupedBarsCanvas(context, xScale, yScale, yEncodings, getXValue);
    } else {
      this.renderSingleBarsCanvas(context, xScale, yScale, yEncodings, getXValue);
    }
  }

  private static renderSingleBarsCanvas(context: RenderContext, xScale: any, yScale: any, yEncodings: any[], getXValue: (d: any) => string): void {
    if (!isCanvasContext(context)) return;

    const { ctx, processedData, scales, config, graphArea, resolveColor } = context;
    const colorScale = scales.get('color');
    const colorField = config.encoding.color?.field;
    const yField = yEncodings[0]?.field;
    const themeColors = getPaletteColors(context.colorPaletteId, context.superstate);



    if (!yField) {
      return;
    }

    const bandwidth = xScale.bandwidth ? xScale.bandwidth() : 20;
    const barPadding = bandwidth * 0.1;
    const barWidth = bandwidth - barPadding * 2;
    const cornerRadius = 4;




    processedData.forEach((d: any, index: number) => {
      const xValue = getXValue(d);
      const yValue = Number(d[yField]) || 0;

      const xPos = xScale(xValue);

      if (xPos === undefined) {
        return;
      }

      const x = xPos + barPadding;
      const y = yScale(yValue);
      const barBottom = yScale(0);
      const height = Math.abs(barBottom - y);
      const barY = Math.min(y, barBottom);



      // Check if gradient is configured
      const markConfig = config.mark as any;
      let fillStyle: string | CanvasGradient = themeColors[index % themeColors.length];
      
      // Check if color palette has gradients to use
      const palettes = context.superstate?.assets?.getColorPalettes();
      const palette = palettes?.find((p: any) => p.id === context.colorPaletteId);
      
      // Look for CSS gradients in colors array first
      if (palette?.colors) {
        const gradientColors = palette.colors.filter(c => c.value && (
          c.value.includes('linear-gradient') || 
          c.value.includes('radial-gradient') || 
          c.value.includes('conic-gradient')
        )) || [];
        
        
        if (gradientColors.length > 0) {
          // For Canvas, use solid colors for compatibility
          fillStyle = themeColors[index % themeColors.length];
        } else {
          // Use solid colors
          fillStyle = themeColors[index % themeColors.length];
        }
      } else if (palette?.gradients && palette.gradients.length > 0) {
        // Use gradient from palette (cycle through available gradients for different bars)
        const paletteGradient = palette.gradients[index % palette.gradients.length];
        
        const gradientConfig: GradientConfig = {
          type: paletteGradient.type,
          colors: paletteGradient.stops.map((stop: any) => stop.color),
          positions: paletteGradient.stops.map((stop: any) => stop.position),
          angle: paletteGradient.direction,
          centerX: paletteGradient.center?.x || 0.5,
          centerY: paletteGradient.center?.y || 0.5
        };
        
        const bounds = { x, y: barY, width: barWidth, height };
        fillStyle = GradientUtility.applyGradient(context, gradientConfig, bounds) as CanvasGradient;
      } else {
        // Use color from palette
        let color = themeColors[index % themeColors.length];
        if (typeof config.mark?.fill === 'string') {
          // Check if it's a CSS variable that needs resolving
          color = config.mark.fill.startsWith('var(') ? resolveColor(config.mark.fill) : config.mark.fill;
        } else if (colorField && colorScale) {
          try {
            color = colorScale(d[colorField]) || themeColors[0];
          } catch (e) {
            color = themeColors[0];
          }
        }
        fillStyle = color;
      }

      // Draw bar with rounded corners
      ctx.save();
      ctx.globalAlpha = config.mark?.opacity || 1;
      ctx.fillStyle = fillStyle;



      if (height > 0) {
        // Draw rounded rectangle
        const radius = Math.min(cornerRadius, barWidth / 2, height / 2);

        ctx.beginPath();
        ctx.moveTo(x + radius, barY);
        ctx.lineTo(x + barWidth - radius, barY);
        ctx.quadraticCurveTo(x + barWidth, barY, x + barWidth, barY + radius);
        ctx.lineTo(x + barWidth, barY + height - radius);
        ctx.quadraticCurveTo(x + barWidth, barY + height, x + barWidth - radius, barY + height);
        ctx.lineTo(x + radius, barY + height);
        ctx.quadraticCurveTo(x, barY + height, x, barY + height - radius);
        ctx.lineTo(x, barY + radius);
        ctx.quadraticCurveTo(x, barY, x + radius, barY);
        ctx.closePath();
        ctx.fill();
        
        // Draw debug outline if enabled
        if (context.debugMode) {
          ctx.save();
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(x - 1, barY - 1, barWidth + 2, height + 2);
          ctx.restore();
        }
      }

      ctx.restore();

      // Draw data label if enabled
      if (config.mark?.dataLabels?.show) {
        ctx.save();
        ctx.fillStyle = config.mark.dataLabels.color || '#374151';
        ctx.font = `500 ${config.mark.dataLabels.fontSize || 11}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const formattedValue = Number.isInteger(yValue) ? yValue.toString() : yValue.toFixed(1);
        ctx.fillText(formattedValue, x + barWidth / 2, y - 5);
        ctx.restore();
      }
    });
  }

  private static renderGroupedBarsCanvas(context: RenderContext, xScale: any, yScale: any, yEncodings: any[], getXValue: (d: any) => string): void {
    if (!isCanvasContext(context)) return;

    const { ctx, processedData, config, graphArea, resolveColor } = context;
    const themeColors = getPaletteColors(context.colorPaletteId, context.superstate);
    const bandwidth = xScale.bandwidth ? xScale.bandwidth() : 20;
    const groupPadding = 0.05;
    const barWidth = (bandwidth / yEncodings.length) * (1 - groupPadding);
    const cornerRadius = 4;

    processedData.forEach((d: any) => {
      const xValue = getXValue(d);
      const xPos = xScale(xValue);
      if (xPos === undefined) return;

      yEncodings.forEach((yEncoding, i) => {
        const value = d[yEncoding.field];
        if (value === undefined || value === null) return;

        const yValue = Number(value);
        const x = xPos + (barWidth + groupPadding * bandwidth / yEncodings.length) * i;
        const y = yScale(yValue);
        const barBottom = yScale(0);
        const height = Math.abs(barBottom - y);
        const barY = Math.min(y, barBottom);

        // Draw bar with rounded corners
        ctx.save();
        ctx.globalAlpha = config.mark?.opacity || 1;
        ctx.fillStyle = themeColors[i % themeColors.length] || '#3b82f6';

        // Create rounded rectangle path
        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, barY);
        ctx.lineTo(x + barWidth - cornerRadius, barY);
        ctx.quadraticCurveTo(x + barWidth, barY, x + barWidth, barY + cornerRadius);
        ctx.lineTo(x + barWidth, barY + height);
        ctx.lineTo(x, barY + height);
        ctx.lineTo(x, barY + cornerRadius);
        ctx.quadraticCurveTo(x, barY, x + cornerRadius, barY);
        ctx.closePath();
        ctx.fill();
        
        // Draw debug outline if enabled
        if (context.debugMode) {
          ctx.save();
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(x - 1, barY - 1, barWidth + 2, height + 2);
          ctx.restore();
        }
        
        ctx.restore();

        // Draw data label if enabled
        if (config.mark?.dataLabels?.show) {
          ctx.save();
          ctx.fillStyle = config.mark.dataLabels.color || '#374151';
          ctx.font = `500 ${config.mark.dataLabels.fontSize || 11}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const formattedValue = Number.isInteger(yValue) ? yValue.toString() : yValue.toFixed(1);
          ctx.fillText(formattedValue, x + barWidth / 2, y - 5);
          ctx.restore();
        }
      });
    });
  }

  private static renderStackedBarsCanvas(context: RenderContext, xScale: any, yScale: any, yEncodings: any[], getXValue: (d: any) => string): void {
    if (!isCanvasContext(context)) return;

    const { ctx, processedData, config, graphArea, resolveColor } = context;
    const themeColors = getPaletteColors(context.colorPaletteId, context.superstate);
    const bandwidth = xScale.bandwidth ? xScale.bandwidth() : 20;
    const cornerRadius = 4;

    // Calculate stacked data
    const stackedData = stack()
      .keys(yEncodings.map(enc => enc.field))
      .value((d: any, key) => Number(d[key]) || 0)(processedData as any);

    // Update y scale domain
    const maxStackValue = max(stackedData[stackedData.length - 1], (d: any) => d[1]) || 0;
    yScale.domain([0, maxStackValue]);

    // Draw stacked bars
    stackedData.forEach((series, seriesIndex) => {
      const color = themeColors[seriesIndex % themeColors.length] || '#3b82f6';

      series.forEach((d: any) => {
        const xValue = getXValue(d.data);
        const xPos = xScale(xValue);
        if (xPos === undefined) return;

        const x = xPos;
        const y = yScale(d[1]);
        const height = yScale(d[0]) - yScale(d[1]);

        if (height <= 0) return;

        // Draw bar segment with rounded corners (only for top segment)
        ctx.save();
        ctx.globalAlpha = config.mark?.opacity || 1;
        ctx.fillStyle = color;

        if (seriesIndex === stackedData.length - 1) {
          // Top segment with rounded corners
          ctx.beginPath();
          ctx.moveTo(x + cornerRadius, y);
          ctx.lineTo(x + bandwidth - cornerRadius, y);
          ctx.quadraticCurveTo(x + bandwidth, y, x + bandwidth, y + cornerRadius);
          ctx.lineTo(x + bandwidth, y + height);
          ctx.lineTo(x, y + height);
          ctx.lineTo(x, y + cornerRadius);
          ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
          ctx.closePath();
          ctx.fill();
        } else {
          // Regular rectangle for other segments
          ctx.fillRect(x, y, bandwidth, height);
        }
        
        // Draw debug outline if enabled
        if (context.debugMode) {
          ctx.save();
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(x, y, bandwidth, height);
          ctx.restore();
        }
        
        ctx.restore();

        // Draw data label if enabled and segment is large enough
        if ((config.mark?.dataLabels?.show) && height > 20) {
          ctx.save();
          ctx.fillStyle = 'white';
          ctx.font = `500 ${config.mark.dataLabels.fontSize || 11}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const value = d[1] - d[0];
          const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);
          ctx.fillText(formattedValue, x + bandwidth / 2, y + height / 2);
          ctx.restore();
        }
      });
    });
  }
}