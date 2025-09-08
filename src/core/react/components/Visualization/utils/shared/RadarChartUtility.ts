import { max, min, scaleLinear, line as d3Line, curveLinearClosed, select, selectAll } from 'core/utils/d3-imports';
import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';
import { getPaletteColors } from '../utils';
import { displayTextForType } from 'core/utils/displayTextForType';
import { RadarChartData } from '../../transformers';

export class RadarChartUtility {
  static render(context: RenderContext): void {
    if (isSVGContext(context)) {
      this.renderSVG(context);
    } else if (isCanvasContext(context)) {
      this.renderCanvas(context);
    }
  }

  private static renderSVG(context: RenderContext): void {
    if (!isSVGContext(context)) return;

    const { g, svg, processedData, transformedData, config, graphArea, editMode, selectedElement, onElementSelect, showDataLabels, showLegend, resolveColor, superstate, tableProperties } = context;
    
    // Use transformed data if available
    if (transformedData?.type === 'radar' && transformedData.data) {
      this.renderWithTransformedData(context, transformedData.data as RadarChartData);
      return;
    }

    if (!processedData || processedData.length === 0) {
      return;
    }

    // Get encodings
    const xEncoding = Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x;
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : (config.encoding.y ? [config.encoding.y] : []);
    const colorEncoding = config.encoding.color;

    if (!xEncoding?.field || yEncodings.length === 0 || !yEncodings[0]?.field) {
      return;
    }

    // Calculate center and radius
    const centerX = graphArea.left + (graphArea.right - graphArea.left) / 2;
    const centerY = graphArea.top + (graphArea.bottom - graphArea.top) / 2;
    const radius = Math.min((graphArea.right - graphArea.left), (graphArea.bottom - graphArea.top)) / 2 * 0.8;

    // Get unique categories for axes
    const categories = Array.from(new Set(processedData.map(d => String(d[xEncoding.field]))));
    const angleStep = (2 * Math.PI) / categories.length;

    // Calculate value domain across all Y fields
    const allValues: number[] = [];
    yEncodings.forEach(yEncoding => {
      if (yEncoding.field) {
        const values = processedData.map(d => Number(d[yEncoding.field])).filter(v => !isNaN(v));
        allValues.push(...values);
      }
    });
    
    const maxValue = max(allValues) || 1;
    const minValue = min(allValues) || 0;
    const valueRange = maxValue - minValue;

    // Create scales
    const radiusScale = scaleLinear()
      .domain([minValue, maxValue])
      .range([0, radius]);

    // Create layer groups for proper z-ordering
    const gridLayer = g.append('g').attr('class', 'radar-grid-layer');
    const dataLayer = g.append('g').attr('class', 'radar-data-layer');
    
    // Draw background grid as polygons (spider web style)
    const gridLevels = 5;
    for (let i = 1; i <= gridLevels; i++) {
      const gridRadius = (radius / gridLevels) * i;
      const gridPoints: { x: number; y: number }[] = [];
      
      categories.forEach((_, idx) => {
        const angle = idx * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * gridRadius;
        const y = centerY + Math.sin(angle) * gridRadius;
        gridPoints.push({ x, y });
      });
      
      // Create polygon path
      const gridLine = d3Line<{ x: number; y: number }>()
        .x(d => d.x)
        .y(d => d.y)
        .curve(curveLinearClosed);
      
      gridLayer.append('path')
        .datum(gridPoints)
        .attr('d', gridLine)
        .attr('fill', 'none')
        .attr('stroke', resolveColor('var(--mk-ui-border)'))
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.5);
        
      // Add grid value labels on the first axis
      const gridValue = minValue + (valueRange * i / gridLevels);
      gridLayer.append('text')
        .attr('x', centerX + 5)
        .attr('y', centerY - gridRadius)
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '10px')
        .style('fill', resolveColor('var(--mk-ui-text-secondary)'))
        .style('opacity', 0.7)
        .text(gridValue.toFixed(1));
    }

    // Draw axis lines and labels
    categories.forEach((category, i) => {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      const x2 = centerX + Math.cos(angle) * radius;
      const y2 = centerY + Math.sin(angle) * radius;

      // Draw axis line from center to edge
      gridLayer.append('line')
        .attr('class', 'radar-axis-line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', resolveColor('var(--mk-ui-border)'))
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2')
        .attr('opacity', 0.3);

      // Draw axis label
      const labelRadius = radius + 20;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;

      // Format category label using displayTextForType
      const xProp = tableProperties?.find(p => p.name === xEncoding.field);
      const formattedCategory = xProp && superstate 
        ? displayTextForType(xProp, category, superstate)
        : category;
        
      gridLayer.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '12px')
        .style('fill', resolveColor('var(--mk-ui-text-primary)'))
        .text(formattedCategory);
    });

    // For radar charts with multiple Y fields, each Y field represents a different series
    // The x-axis represents different metrics/dimensions
    // Each Y field creates a separate polygon overlay

    // Get color palette
    const colors = getPaletteColors(context.colorPaletteId, context.superstate);

    // Remove any existing tooltip
    select('body').selectAll('.radar-tooltip').remove();
    
    // Create tooltip
    const tooltip = select('body').append('div')
      .attr('class', 'radar-tooltip')
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

    // Draw radar areas for each Y field (series)
    yEncodings.forEach((yEncoding, yIndex) => {
      if (!yEncoding.field) return;
      
      const color = colors[yIndex % colors.length];
      const seriesName = yEncoding.field;

      // Create data points for this series - one point per category
      const seriesPoints: { category: string; value: number; angle: number; x: number; y: number }[] = [];
      
      // For a proper radar chart, we need one value per category
      categories.forEach((category, i) => {
        const angle = i * angleStep - Math.PI / 2;
        // Find the data point for this category
        const dataPoint = processedData.find(d => String(d[xEncoding.field]) === category);
        const value = dataPoint ? Number(dataPoint[yEncoding.field]) || 0 : 0;
        const scaledRadius = radiusScale(value);
        const x = centerX + Math.cos(angle) * scaledRadius;
        const y = centerY + Math.sin(angle) * scaledRadius;
        
        seriesPoints.push({ category, value, angle, x, y });
      });

      // Create line generator for radar area
      const line = d3Line<{ x: number; y: number }>()
        .x(d => d.x)
        .y(d => d.y)
        .curve(curveLinearClosed);

      // Draw filled area - the polygon connecting all points
      const pathData = line(seriesPoints);
      
      // Calculate opacity based on number of series
      const fillOpacity = yEncodings.length > 1 ? 0.15 : 0.2;
      const strokeOpacity = yEncodings.length > 1 ? 0.8 : 1;
      
      // First draw the stroke (outline) of the polygon if enabled
      if (config.mark?.strokeWidth === undefined || config.mark.strokeWidth > 0) {
        dataLayer.append('path')
          .datum(seriesPoints)
          .attr('class', `radar-outline series-${yIndex}`)
          .attr('d', pathData)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', config.mark?.strokeWidth || 2)
          .attr('stroke-opacity', strokeOpacity)
          .attr('stroke-linejoin', 'round')
          .style('cursor', editMode ? 'pointer' : 'default');
      }
        
      // Then draw the filled area with transparency
      dataLayer.append('path')
        .datum(seriesPoints)
        .attr('class', `radar-area series-${yIndex}`)
        .attr('d', pathData)
        .attr('fill', color)
        .attr('fill-opacity', fillOpacity)
        .attr('stroke', 'none')
        .style('cursor', editMode ? 'pointer' : 'default');

      // Draw data points
      seriesPoints.forEach((point) => {
        dataLayer.append('circle')
          .attr('class', `radar-point series-${yIndex}`)
          .attr('cx', point.x)
          .attr('cy', point.y)
          .attr('r', 4)
          .attr('fill', color)
          .style('cursor', 'pointer')
          .on('mouseover', function(event) {
            // Show tooltip
            tooltip
              .style('display', 'block')
              .transition()
              .duration(200)
              .style('opacity', 0.9);
            
            // Format the value using displayTextForType
            const xProp = tableProperties?.find(p => p.name === xEncoding.field);
            const yProp = tableProperties?.find(p => p.name === yEncoding.field);
            
            const formattedCategory = xProp && superstate 
              ? displayTextForType(xProp, point.category, superstate)
              : point.category;
            const formattedValue = yProp && superstate 
              ? displayTextForType(yProp, point.value, superstate)
              : point.value.toString();
              
            // Build tooltip content
            let tooltipContent = '';
            
            // Category (not indented)
            tooltipContent += `<div>${formattedCategory}</div>`;
            
            // Value with color square
            tooltipContent += `<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">`;
            tooltipContent += `<div style="width: 12px; height: 12px; background-color: ${color}; border-radius: 2px; flex-shrink: 0;"></div>`;
            
            tooltipContent += `<div>`;
            // Include series name when multiple Y fields
            if (yEncodings.length > 1) {
              tooltipContent += `${seriesName} • `;
            }
            tooltipContent += `${formattedValue}`;
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
            tooltip.transition()
              .duration(200)
              .style('opacity', 0)
              .on('end', function() {
                tooltip.style('display', 'none');
              });
          });

        // Add data labels if enabled
        if (showDataLabels) {
          // Find the y-axis property for formatting
          const yProp = tableProperties?.find(p => p.name === yEncoding.field);
          const formattedValue = yProp && superstate 
            ? displayTextForType(yProp, point.value, superstate)
            : point.value.toString();
            
          dataLayer.append('text')
            .attr('x', point.x)
            .attr('y', point.y - 8)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', resolveColor('var(--mk-ui-text-primary)'))
            .style('font-weight', '500')
            .text(formattedValue);
        }
      });
    });

    // Create legend items for multiple series
    if (yEncodings.length > 1 && showLegend) {
      const legendItems: Array<{ label: string; color: string }> = [];
      yEncodings.forEach((yEncoding, yIndex) => {
        if (yEncoding.field) {
          const color = colors[yIndex % colors.length];
          legendItems.push({ 
            label: yEncoding.field, 
            color 
          });
        }
      });
      (svg as any)._legendItems = legendItems;
    }

    // Store tooltip reference for cleanup
    (svg.node() as any).__radarTooltip = tooltip;
  }

  private static renderCanvas(context: RenderContext): void {
    if (!isCanvasContext(context)) return;

    const { ctx, processedData, config, graphArea, resolveColor } = context;

    if (!processedData || processedData.length === 0) {
      return;
    }

    // Get encodings
    const xEncoding = Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x;
    const yEncodings = Array.isArray(config.encoding.y) ? config.encoding.y : (config.encoding.y ? [config.encoding.y] : []);
    const colorEncoding = config.encoding.color;

    if (!xEncoding?.field || yEncodings.length === 0 || !yEncodings[0]?.field) {
      return;
    }

    // Calculate center and radius
    const centerX = graphArea.left + (graphArea.right - graphArea.left) / 2;
    const centerY = graphArea.top + (graphArea.bottom - graphArea.top) / 2;
    const radius = Math.min((graphArea.right - graphArea.left), (graphArea.bottom - graphArea.top)) / 2 * 0.8;

    // Get unique categories
    const categories = Array.from(new Set(processedData.map(d => String(d[xEncoding.field]))));
    const angleStep = (2 * Math.PI) / categories.length;

    // Calculate value domain across all Y fields
    const allValues: number[] = [];
    yEncodings.forEach(yEncoding => {
      if (yEncoding.field) {
        const values = processedData.map(d => Number(d[yEncoding.field])).filter(v => !isNaN(v));
        allValues.push(...values);
      }
    });
    
    const maxValue = max(allValues) || 1;
    const minValue = min(allValues) || 0;

    // Create scale
    const radiusScale = scaleLinear()
      .domain([minValue, maxValue])
      .range([0, radius]);

    ctx.save();

    // Draw background grid as polygons
    const gridLevels = 5;
    ctx.strokeStyle = resolveColor('var(--mk-ui-border)');
    ctx.setLineDash([3, 3]);
    ctx.globalAlpha = 0.5;
    
    for (let i = 1; i <= gridLevels; i++) {
      const gridRadius = (radius / gridLevels) * i;
      ctx.beginPath();
      
      categories.forEach((_, idx) => {
        const angle = idx * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * gridRadius;
        const y = centerY + Math.sin(angle) * gridRadius;
        
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axis lines
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.7;
    categories.forEach((category, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x2 = centerX + Math.cos(angle) * radius;
      const y2 = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Draw axis labels
    ctx.globalAlpha = 1;
    ctx.fillStyle = resolveColor('var(--mk-ui-text-primary)');
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    categories.forEach((category, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const labelRadius = radius + 20;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;
      ctx.fillText(category, labelX, labelY);
    });

    // Draw radar areas for each Y field (series)
    const colors = getPaletteColors(context.colorPaletteId, context.superstate);
    
    yEncodings.forEach((yEncoding, yIndex) => {
      if (!yEncoding.field) return;
      
      const color = colors[yIndex % colors.length];

      // Create data points
      const seriesPoints: { x: number; y: number; value: number }[] = [];
      
      categories.forEach((category, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const dataPoint = processedData.find(d => String(d[xEncoding.field]) === category);
        const value = dataPoint ? Number(dataPoint[yEncoding.field]) || 0 : 0;
        const scaledRadius = radiusScale(value);
        const x = centerX + Math.cos(angle) * scaledRadius;
        const y = centerY + Math.sin(angle) * scaledRadius;
        
        seriesPoints.push({ x, y, value });
      });

      // Draw filled area with appropriate opacity for multiple series
      ctx.globalAlpha = yEncodings.length > 1 ? 0.15 : 0.2;
      ctx.fillStyle = color;
      ctx.beginPath();
      seriesPoints.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.closePath();
      ctx.fill();

      // Draw stroke if enabled
      if (config.mark?.strokeWidth === undefined || config.mark.strokeWidth > 0) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.lineWidth = config.mark?.strokeWidth || 2;
        ctx.stroke();
      }

      // Draw points
      ctx.fillStyle = color;
      seriesPoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    ctx.restore();
  }

  private static renderWithTransformedData(context: RenderContext, radarData: RadarChartData): void {
    if (!isSVGContext(context)) return;
    
    const { g, svg, config, graphArea, showDataLabels, colorPaletteId, superstate } = context;
    
    if (!radarData.data || radarData.data.length === 0) return;
    
    
    const centerX = graphArea.left + graphArea.width / 2;
    const centerY = graphArea.top + graphArea.height / 2;
    const maxRadius = Math.min(graphArea.width, graphArea.height) / 2 - 40; // Leave padding for labels
    
    const themeColors = getPaletteColors(colorPaletteId, superstate);
    
    // Create scales
    const angleSlice = (Math.PI * 2) / radarData.axes.length;
    const rScale = scaleLinear()
      .domain([0, radarData.maxValue])
      .range([0, maxRadius]);
    
    
    // Create a line function for the radar areas
    const radarLine = d3Line<any>()
      .x((d, i) => {
        const axisIndex = radarData.axes.indexOf(d.axis);
        const angle = angleSlice * axisIndex - Math.PI / 2;
        const x = rScale(d.value) * Math.cos(angle);
        return x;
      })
      .y((d, i) => {
        const axisIndex = radarData.axes.indexOf(d.axis);
        const angle = angleSlice * axisIndex - Math.PI / 2;
        const y = rScale(d.value) * Math.sin(angle);
        return y;
      })
      .curve(curveLinearClosed);
    
    // Draw grid circles
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const levelRadius = (maxRadius / levels) * level;
      g.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', levelRadius)
        .attr('fill', 'none')
        .attr('stroke', 'var(--mk-ui-border)')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.5);
    }
    
    // Draw axes
    radarData.axes.forEach((axis, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = centerX + maxRadius * Math.cos(angle);
      const y = centerY + maxRadius * Math.sin(angle);
      
      // Draw axis line
      g.append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', 'var(--mk-ui-border)')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.5);
      
      // Draw axis label
      const labelX = centerX + (maxRadius + 20) * Math.cos(angle);
      const labelY = centerY + (maxRadius + 20) * Math.sin(angle);
      
      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '11px')
        .attr('fill', 'var(--mk-ui-text-secondary)')
        .text(axis);
    });
    
    // Group data by series
    const seriesGroups = new Map<string, typeof radarData.data>();
    radarData.data.forEach(point => {
      if (!seriesGroups.has(point.series)) {
        seriesGroups.set(point.series, []);
      }
      seriesGroups.get(point.series)!.push(point);
    });
    
    
    // Create tooltip
    const tooltip = select('body').append('div')
      .attr('class', 'radar-tooltip')
      .style('position', 'absolute')
      .style('padding', '8px 12px')
      .style('background', 'var(--mk-ui-background-contrast)')
      .style('color', 'var(--mk-ui-text-primary)')
      .style('border', '1px solid var(--mk-ui-border)')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.15)')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 10000);
    
    // Draw areas for each series
    let seriesIndex = 0;
    seriesGroups.forEach((points, series) => {
      // Sort points by axis order
      const sortedPoints = radarData.axes.map(axis => {
        const point = points.find(p => p.axis === axis);
        return point || { axis, value: 0, series };
      });
      
      
      const color = themeColors[seriesIndex % themeColors.length];
      
      // Draw the area
      const areaGroup = g.append('g')
        .attr('transform', `translate(${centerX}, ${centerY})`);
      
      // Draw filled area
      areaGroup.append('path')
        .datum(sortedPoints)
        .attr('d', radarLine)
        .attr('fill', color)
        .attr('fill-opacity', 0.3)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
          select(this)
            .transition()
            .duration(150)
            .attr('fill-opacity', 0.5);
          
          tooltip.transition()
            .duration(200)
            .style('opacity', 0.9);
          
          const tooltipContent = `
            <div><strong>${series}</strong></div>
            ${sortedPoints.map(p => `<div>${p.axis}: ${p.value.toFixed(1)}</div>`).join('')}
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
            .attr('fill-opacity', 0.3);
          
          tooltip.transition()
            .duration(500)
            .style('opacity', 0);
        });
      
      // Draw points
      sortedPoints.forEach((d, pointIndex) => {
        const axisIndex = radarData.axes.indexOf(d.axis);
        const angle = angleSlice * axisIndex - Math.PI / 2;
        const x = rScale(d.value) * Math.cos(angle);
        const y = rScale(d.value) * Math.sin(angle);
        
        
        areaGroup.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 4)
          .attr('fill', color)
          .attr('stroke', 'white')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer');
        
        // Add data labels if configured
        if (showDataLabels) {
          areaGroup.append('text')
            .attr('x', x)
            .attr('y', y - 8)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', 'var(--mk-ui-text-primary)')
            .text(d.value.toFixed(1));
        }
      });
      
      seriesIndex++;
    });
    
    // Store tooltip reference for cleanup
    (svg.node() as any).__radarTooltip = tooltip;
  }
}