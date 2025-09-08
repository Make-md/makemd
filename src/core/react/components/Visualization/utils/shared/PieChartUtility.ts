import * as d3 from 'd3';
import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';
import { getPaletteColors } from '../utils';
import { displayTextForType } from 'core/utils/displayTextForType';
import { GradientUtility, GradientConfig } from './GradientUtility';

export class PieChartUtility {
  static render(context: RenderContext): void {
    if (isSVGContext(context)) {
      this.renderSVG(context);
    } else if (isCanvasContext(context)) {
      this.renderCanvas(context);
    }
  }

  private static renderSVG(context: RenderContext): void {
    if (!isSVGContext(context)) return;

    const { g, svg, processedData, scales, config, graphArea, actualDimensions, editMode, selectedElement, onElementSelect, showDataLabels, resolveColor } = context;
    
    // For pie charts, use y-axis field for values, x-axis or color for categories
    const yEncoding = Array.isArray(config.encoding.y) ? config.encoding.y[0] : config.encoding.y;
    const xEncoding = Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x;
    const valueField = yEncoding?.field || (config.encoding as any).angle?.field || (config.encoding as any).theta?.field || 'value';
    const categoryField = config.encoding.color?.field || xEncoding?.field || 'category';
    
    if (!valueField) return;

    // Calculate center and radius
    const centerX = (graphArea.left + graphArea.right) / 2;
    const centerY = (graphArea.top + graphArea.bottom) / 2;
    const radius = Math.min(graphArea.width, graphArea.height) / 2 * 0.8;
    const innerRadiusRatio = (config.mark as any)?.innerRadius || 0;

    // Data should already be properly aggregated by the transformer
    // Just use it directly
    let pieData = processedData;
    
    // Check if the value field contains non-numerical data
    const hasNonNumericalValues = processedData.some(d => {
      const value = d[valueField];
      return value !== undefined && value !== null && isNaN(+value);
    });

    if (hasNonNumericalValues) {
      // Count occurrences of each category
      const categoryGroups = d3.group(processedData, d => String(d[categoryField] || 'Unknown'));
      pieData = Array.from(categoryGroups, ([category, items]) => ({
        [categoryField]: category,
        [valueField]: items.length, // Count of occurrences
        _originalItems: items // Keep reference to original items for tooltip
      }));
    }

    // Create pie generator
    const pie = d3.pie<any>()
      .value((d) => Math.abs(Number(d[valueField]) || 0))
      .sort(null);

    // Create arc generator
    const arc = d3.arc<any>()
      .innerRadius(innerRadiusRatio * radius)
      .outerRadius(radius);

    // Create arc for labels
    const labelArc = d3.arc<any>()
      .innerRadius(radius * 0.8)
      .outerRadius(radius * 0.8);

    // Get color scale
    const colorScale = scales.get('color');
    const colorField = categoryField;

    // Generate pie data
    const pieDataSlices = pie(pieData);

    // Store legend items
    const legendItems: Array<{ label: string; color: string }> = [];
    const colorMap = new Map<string, string>();

    // Determine colors for each slice
    pieDataSlices.forEach((d, i) => {
      let color: string;
      if (colorScale && colorField) {
        color = colorScale(d.data[colorField]);
      } else {
        const colors = getPaletteColors(context.colorPaletteId, context.superstate);
        color = colors[i % colors.length];
      }
      
      const label = String(d.data[colorField]);
      colorMap.set(label, color);
      
      if (!legendItems.find(item => item.label === label)) {
        legendItems.push({ label, color });
      }
    });

    // Create group for pie chart
    const pieGroup = g.append('g')
      .attr('class', 'pie-chart')
      .attr('transform', `translate(${centerX}, ${centerY})`);

    // Draw slices
    const slices = pieGroup.selectAll('.slice')
      .data(pieDataSlices)
      .enter()
      .append('g')
      .attr('class', 'slice');

    const paths = slices.append('path')
      .attr('d', arc)
      .attr('fill', (d: any, i: number) => {
        // Check if color palette has gradients to use
        const palettes = context.superstate?.assets?.getColorPalettes();
        
        const palette = palettes?.find((p: any) => p.id === context.colorPaletteId);
        
        // Look for CSS gradients in the colors array
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
              const svgGradientId = GradientUtility.createSVGGradient(svg, parsedGradient);
              return svgGradientId;
            } else {
            }
          }
        }
        
        // Default color logic - use solid colors from palette
        const label = String(d.data[colorField]);
        const defaultColors = getPaletteColors(context.colorPaletteId, context.superstate);
        return colorMap.get(label) || defaultColors[i % defaultColors.length];
      });

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'pie-tooltip')
      .style('position', 'absolute')
      .style('padding', '8px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Add hover effects
    paths
      .on('mouseenter', function(event, d: any) {
        // Expand slice
        d3.select(this)
          .transition()
          .duration(200)
          .attr('transform', function(d: any) {
            const [x, y] = arc.centroid(d);
            return `translate(${x * 0.1}, ${y * 0.1})`;
          });
        
        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        
        // Calculate percentage
        const total = d3.sum(pieDataSlices, pd => pd.value);
        const percentage = ((d.value / total) * 100).toFixed(1);
        
        // Get slice color
        const sliceElement = d3.select(this);
        const sliceColor = sliceElement.attr('fill');
        
        // Build tooltip content
        let tooltipContent = '';
        
        // Category (not indented)
        const categoryValue = d.data[categoryField];
        const categoryProp = context.tableProperties?.find(p => p.name === categoryField);
        const formattedCategory = categoryProp ? displayTextForType(categoryProp, categoryValue, context.superstate) : categoryValue;
        tooltipContent += `<div>${formattedCategory}</div>`;
        
        // Value with color square
        tooltipContent += `<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">`;
        tooltipContent += `<div style="width: 12px; height: 12px; background-color: ${sliceColor}; border-radius: 2px; flex-shrink: 0;"></div>`;
        
        tooltipContent += `<div>`;
        // Value
        const value = d.data[valueField];
        const valueProp = context.tableProperties?.find(p => p.name === valueField);
        const formattedValue = valueProp ? displayTextForType(valueProp, value, context.superstate) : value;
        
        // For non-numerical data, show count in tooltip
        if (hasNonNumericalValues) {
          tooltipContent += `${formattedValue} ${value === 1 ? 'occurrence' : 'occurrences'}`;
        } else {
          tooltipContent += `${formattedValue}`;
        }
        
        tooltipContent += ` • ${percentage}%`;
        
        tooltipContent += `</div>`;
        tooltipContent += `</div>`;
        
        tooltip.html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('transform', 'translate(0, 0)');
        
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Add interactivity for edit mode
    if (editMode) {
      paths
        .style('cursor', 'pointer')
        .on('click', function(event, d: any) {
          if (onElementSelect) {
            onElementSelect({
              type: 'series',
              id: `slice-${d.data[colorField]}`,
            });
          }
        });

      // Add selection indicator
      if (selectedElement?.type === 'series') {
        paths.each(function(d: any) {
          const id = `slice-${d.data[colorField]}`;
          if (selectedElement.id === id) {
            d3.select(this)
              .style('filter', 'drop-shadow(0 0 4px var(--mk-ui-accent))');
          }
        });
      }
    }

    // Add labels
    if (showDataLabels || (config.mark as any)?.dataLabels?.show) {
      const labels = slices.append('text')
        .attr('transform', (d: any) => `translate(${labelArc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .style('font-size', `${(config.mark as any)?.dataLabels?.fontSize || 12}px`)
        .style('fill', 'white')
        .style('font-weight', 'bold');

      // Add percentage or value
      labels.text((d: any) => {
        const percentage = ((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1);
        return (config.mark as any)?.dataLabels?.format === 'percentage' 
          ? `${percentage}%` 
          : d.data[valueField];
      });
    }

    // Store legend items for later rendering only if legend should be shown
    if (legendItems.length > 0 && context.showLegend !== false) {
      (svg as any)._legendItems = legendItems;
    }

    // Store tooltip cleanup function
    (svg.node() as any).__pieTooltip = tooltip;
  }

  private static renderCanvas(context: RenderContext): void {
    if (!isCanvasContext(context)) return;

    const { ctx, processedData, scales, config, graphArea, resolveColor } = context;
    
    // For pie charts, use y-axis field for values, x-axis or color for categories
    const yEncoding = Array.isArray(config.encoding.y) ? config.encoding.y[0] : config.encoding.y;
    const xEncoding = Array.isArray(config.encoding.x) ? config.encoding.x[0] : config.encoding.x;
    const valueField = yEncoding?.field || (config.encoding as any).angle?.field || (config.encoding as any).theta?.field || 'value';
    const categoryField = config.encoding.color?.field || xEncoding?.field || 'category';
    
    if (!valueField) return;

    // Calculate center and radius
    const centerX = (graphArea.left + graphArea.right) / 2;
    const centerY = (graphArea.top + graphArea.bottom) / 2;
    const radius = Math.min(graphArea.width, graphArea.height) / 2 * 0.8;
    const innerRadius = ((config.mark as any)?.innerRadius || 0) * radius;

    // Data should already be properly aggregated by the transformer
    // Just use it directly
    let pieData = processedData;
    
    // Check if the value field contains non-numerical data
    const hasNonNumericalValues = processedData.some(d => {
      const value = d[valueField];
      return value !== undefined && value !== null && isNaN(+value);
    });

    if (hasNonNumericalValues) {
      // Count occurrences of each category
      const categoryGroups = d3.group(processedData, d => String(d[categoryField] || 'Unknown'));
      pieData = Array.from(categoryGroups, ([category, items]) => ({
        [categoryField]: category,
        [valueField]: items.length,
        _originalItems: items
      }));
    }

    // Get color scale
    const colorScale = scales.get('color');
    const colorField = categoryField;

    // Calculate angles
    const total = pieData.reduce((sum, d) => sum + Math.abs(Number(d[valueField]) || 0), 0);
    let currentAngle = -Math.PI / 2; // Start at top

    ctx.save();

    pieData.forEach((d, i) => {
      const value = Math.abs(Number(d[valueField]) || 0);
      const angle = (value / total) * 2 * Math.PI;
      const endAngle = currentAngle + angle;

      // Check if color palette has gradients to use
      let fillStyle: string | CanvasGradient;
      
      const palettes = context.superstate?.assets?.getColorPalettes();
      const palette = palettes?.find((p: any) => p.id === context.colorPaletteId);
      
      // Look for CSS gradients in the colors array  
      if (palette?.colors) {
        const gradientColors = palette.colors.filter(c => c.value && (
          c.value.includes('linear-gradient') || 
          c.value.includes('radial-gradient') || 
          c.value.includes('conic-gradient')
        )) || [];
        
        
        if (gradientColors.length > 0) {
          // For Canvas, we need to use default solid colors since CSS gradients aren't directly supported
          // TODO: Could parse CSS gradient and convert to Canvas gradient in the future
          fillStyle = getPaletteColors(context.colorPaletteId, context.superstate)[i % getPaletteColors(context.colorPaletteId, context.superstate).length];
        } else {
          // Default color logic
          if (colorScale && colorField) {
            fillStyle = colorScale(d[colorField]);
          } else {
            const colors = getPaletteColors(context.colorPaletteId, context.superstate);
            fillStyle = colors[i % colors.length];
          }
        }
      } else {
        // Default color logic
        if (colorScale && colorField) {
          fillStyle = colorScale(d[colorField]);
        } else {
          const colors = getPaletteColors(context.colorPaletteId, context.superstate);
          fillStyle = colors[i % colors.length];
        }
      }

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, endAngle);
      if (innerRadius > 0) {
        ctx.arc(centerX, centerY, innerRadius, endAngle, currentAngle, true);
      }
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();

      // Draw label if enabled
      if ((config.mark as any)?.dataLabels?.show) {
        const labelAngle = currentAngle + angle / 2;
        const labelRadius = radius * 0.8;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;

        ctx.save();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${(config.mark as any)?.dataLabels?.fontSize || 12}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const percentage = (value / total * 100).toFixed(1);
        const label = (config.mark as any)?.dataLabels?.format === 'percentage' 
          ? `${percentage}%` 
          : String(value);
        
        ctx.fillText(label, labelX, labelY);
        ctx.restore();
      }

      currentAngle = endAngle;
    });

    ctx.restore();
  }
}