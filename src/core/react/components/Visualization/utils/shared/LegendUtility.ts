import type { Selection } from 'core/utils/d3-imports';
import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';

export interface LegendItem {
  label: string;
  color: string;
}

export interface LegendConfig {
  position: 'left' | 'right' | 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
  titleHeight?: number;
  layoutPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class LegendUtility {
  static render(
    context: RenderContext,
    legendItems: LegendItem[],
    config?: LegendConfig
  ): void {
    if (legendItems.length === 0) return;

    const position = config?.position || context.config.layout?.legend?.position || 'top';
    const align = config?.align || context.config.layout?.legend?.align || 'start';
    const titleHeight = config?.titleHeight || 0;

    if (isSVGContext(context)) {
      this.renderSVG(context, legendItems, position, align, titleHeight, config?.layoutPosition);
    } else if (isCanvasContext(context)) {
      this.renderCanvas(context, legendItems, position, align, titleHeight, config?.layoutPosition);
    }
  }

  private static renderSVG(
    context: RenderContext,
    legendItems: LegendItem[],
    position: 'left' | 'right' | 'top' | 'bottom',
    align: 'start' | 'center' | 'end',
    titleHeight: number,
    layoutPosition?: { x: number; y: number; width: number; height: number }
  ): void {
    if (!isSVGContext(context)) return;

    const { svg, actualDimensions, resolveColor, editMode, selectedElement, onElementSelect } = context;

    if (position === 'left' || position === 'right') {
      this.renderVerticalSVG(
        svg,
        legendItems,
        position,
        align,
        actualDimensions,
        resolveColor,
        editMode,
        selectedElement,
        onElementSelect,
        layoutPosition
      );
    } else {
      this.renderHorizontalSVG(
        svg,
        legendItems,
        position,
        align,
        actualDimensions,
        titleHeight,
        resolveColor,
        editMode,
        selectedElement,
        onElementSelect,
        layoutPosition
      );
    }
  }

  private static renderCanvas(
    context: RenderContext,
    legendItems: LegendItem[],
    position: 'left' | 'right' | 'top' | 'bottom',
    align: 'start' | 'center' | 'end',
    titleHeight: number,
    layoutPosition?: { x: number; y: number; width: number; height: number }
  ): void {
    if (!isCanvasContext(context)) return;

    const { ctx, width, height, resolveColor } = context;
    const squareSize = 12;
    const itemSpacing = 20;
    const padding = 10;

    ctx.save();
    ctx.font = '12px sans-serif';

    // Add clipping for canvas legends
    if (layoutPosition) {
      ctx.rect(layoutPosition.x, layoutPosition.y, layoutPosition.width, layoutPosition.height);
      ctx.clip();
    }

    if (position === 'top' || position === 'bottom') {
      // Horizontal legend with wrapping support
      const rowHeight = 20;
      const verticalSpacing = 5;
      const itemWidths: number[] = [];
      
      // Measure items
      legendItems.forEach(item => {
        const metrics = ctx.measureText(item.label);
        const width = squareSize + 5 + metrics.width;
        itemWidths.push(width);
      });

      // Calculate available width and layout items in rows
      const availableWidth = layoutPosition?.width || width - 2 * padding;
      const rows: { items: number[]; width: number }[] = [];
      let currentRow: number[] = [];
      let currentRowWidth = 0;

      itemWidths.forEach((itemWidth, index) => {
        const widthWithSpacing = currentRow.length > 0 ? itemWidth + itemSpacing : itemWidth;
        
        if (currentRowWidth + widthWithSpacing <= availableWidth || currentRow.length === 0) {
          // Item fits in current row
          currentRow.push(index);
          currentRowWidth += widthWithSpacing;
        } else {
          // Start new row
          rows.push({ items: currentRow, width: currentRowWidth });
          currentRow = [index];
          currentRowWidth = itemWidth;
        }
      });
      
      // Add last row
      if (currentRow.length > 0) {
        rows.push({ items: currentRow, width: currentRowWidth });
      }

      const totalHeight = rows.length * rowHeight + (rows.length - 1) * verticalSpacing;
      
      // Calculate starting position
      const startX = layoutPosition ? layoutPosition.x + padding : padding;
      const startY = layoutPosition ? layoutPosition.y + padding : (position === 'top' ? (titleHeight > 0 ? titleHeight : padding) : height - padding - totalHeight);

      // Render items in rows
      rows.forEach((row, rowIndex) => {
        const y = startY + rowIndex * (rowHeight + verticalSpacing);
        
        // Calculate row alignment
        let rowXOffset = 0;
        const legendContentWidth = availableWidth - 2 * padding;
        
        switch (align) {
          case 'end':
            rowXOffset = legendContentWidth - row.width;
            break;
          case 'center':
            rowXOffset = (legendContentWidth - row.width) / 2;
            break;
          case 'start':
          default:
            rowXOffset = 0;
            break;
        }

        let currentX = startX + rowXOffset;
        row.items.forEach((itemIndex, i) => {
          const item = legendItems[itemIndex];
          
          // Color square
          ctx.fillStyle = item.color;
          ctx.fillRect(currentX, y, squareSize, squareSize);
          
          // Label with clipping
          ctx.fillStyle = resolveColor('var(--mk-ui-text-secondary)');
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          
          // Clip text if it's too long for the available space
          const maxTextWidth = itemWidths[itemIndex] - squareSize - 10;
          let displayText = item.label;
          const textMetrics = ctx.measureText(displayText);
          
          if (textMetrics.width > maxTextWidth) {
            // Find the right length to fit
            let i = displayText.length;
            while (i > 0 && ctx.measureText(displayText.substring(0, i) + '...').width > maxTextWidth) {
              i--;
            }
            displayText = displayText.substring(0, i) + '...';
          }
          
          ctx.fillText(displayText, currentX + squareSize + 5, y + squareSize / 2);
          
          currentX += itemWidths[itemIndex] + (i < row.items.length - 1 ? itemSpacing : 0);
        });
      });
    } else {
      // Vertical legend
      const itemHeight = 20;
      const itemSpacing = 5;
      const totalHeight = legendItems.length * itemHeight + (legendItems.length - 1) * itemSpacing;
      
      // Calculate x position
      const xPos = layoutPosition ? layoutPosition.x + padding : (position === 'left' ? 10 : width - 120);
      
      // Calculate vertical alignment
      let startY: number;
      if (layoutPosition) {
        const availableHeight = layoutPosition.height - 2 * padding;
        switch (align) {
          case 'start':
            startY = layoutPosition.y + padding;
            break;
          case 'end':
            startY = layoutPosition.y + layoutPosition.height - totalHeight - padding;
            break;
          case 'center':
          default:
            startY = layoutPosition.y + (layoutPosition.height - totalHeight) / 2;
            break;
        }
      } else {
        switch (align) {
          case 'start':
            startY = padding;
            break;
          case 'end':
            startY = height - totalHeight - padding;
            break;
          case 'center':
          default:
            startY = height / 2 - totalHeight / 2;
            break;
        }
      }

      legendItems.forEach((item, i) => {
        const y = startY + i * (itemHeight + itemSpacing);
        
        // Color square
        ctx.fillStyle = item.color;
        ctx.fillRect(xPos, y, squareSize, squareSize);
        
        // Label with clipping
        ctx.fillStyle = resolveColor('var(--mk-ui-text-secondary)');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Clip text if it's too long for the available space
        const maxTextWidth = layoutPosition ? layoutPosition.width - squareSize - 15 : 100;
        let displayText = item.label;
        const textMetrics = ctx.measureText(displayText);
        
        if (textMetrics.width > maxTextWidth) {
          // Find the right length to fit
          let i = displayText.length;
          while (i > 0 && ctx.measureText(displayText.substring(0, i) + '...').width > maxTextWidth) {
            i--;
          }
          displayText = displayText.substring(0, i) + '...';
        }
        
        ctx.fillText(displayText, xPos + squareSize + 5, y + squareSize / 2);
      });
    }

    ctx.restore();
  }

  private static renderVerticalSVG(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    legendItems: LegendItem[],
    position: 'left' | 'right',
    align: 'start' | 'center' | 'end',
    dimensions: { width: number; height: number },
    resolveColor: (color: string) => string,
    editMode?: boolean,
    selectedElement?: any,
    onElementSelect?: (element: { type: string }) => void,
    layoutPosition?: { x: number; y: number; width: number; height: number }
  ): void {
    const itemHeight = 20;
    const itemSpacing = 5;
    const padding = 10;
    const squareSize = 12;
    const totalHeight = legendItems.length * itemHeight + (legendItems.length - 1) * itemSpacing;

    // Validate dimensions
    if (!dimensions || isNaN(dimensions.width) || isNaN(dimensions.height)) {
      return;
    }
    
    const xPos = layoutPosition ? layoutPosition.x + padding : (position === 'left' ? 10 : dimensions.width - 120);
    
    // Calculate vertical alignment
    let yPos: number;
    if (layoutPosition) {
      const availableHeight = layoutPosition.height - 2 * padding;
      switch (align) {
        case 'start':
          yPos = layoutPosition.y + padding;
          break;
        case 'end':
          yPos = layoutPosition.y + layoutPosition.height - totalHeight - padding;
          break;
        case 'center':
        default:
          yPos = layoutPosition.y + (layoutPosition.height - totalHeight) / 2;
          break;
      }
    } else {
      switch (align) {
        case 'start':
          yPos = padding;
          break;
        case 'end':
          yPos = dimensions.height - totalHeight - padding;
          break;
        case 'center':
        default:
          yPos = Math.max(padding, dimensions.height / 2 - totalHeight / 2);
          break;
      }
    }
    
    // Ensure positions are valid numbers
    if (isNaN(xPos) || isNaN(yPos)) {
      return;
    }

    // Create clipping path for vertical legend to prevent overflow
    const clipId = `legend-clip-${Math.random().toString(36).substring(2, 9)}`;
    const legendWidth = layoutPosition ? layoutPosition.width - 2 * padding : 110;
    const legendHeight = layoutPosition ? layoutPosition.height - 2 * padding : totalHeight;
    
    svg.append('defs')
      .append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', legendWidth)
      .attr('height', legendHeight);

    const legendGroup = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${xPos}, ${yPos})`)
      .attr('clip-path', `url(#${clipId})`);

    if (editMode) {
      legendGroup
        .append('rect')
        .attr('x', -padding)
        .attr('y', -padding)
        .attr('width', 120)
        .attr('height', totalHeight + 2 * padding)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
        .on('click', () => {
          if (onElementSelect) {
            onElementSelect({ type: 'legend' });
          }
        });
    }

    legendItems.forEach((item, i) => {
      const itemGroup = legendGroup
        .append('g')
        .attr('transform', `translate(0, ${i * (itemHeight + itemSpacing)})`);

      itemGroup
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', squareSize)
        .attr('height', squareSize)
        .attr('fill', item.color)
        .attr('rx', 2)
        .attr('ry', 2);

      const text = itemGroup
        .append('text')
        .attr('x', squareSize + 5)
        .attr('y', squareSize / 2)
        .attr('dominant-baseline', 'middle')
        .style('font-size', '12px')
        .style('fill', resolveColor('var(--mk-ui-text-secondary)'));

      // Clip text if it's too long for the available space
      const maxTextWidth = legendWidth - squareSize - 10; // Leave some padding
      const textContent = item.label;
      text.text(textContent);
      
      // Check if text needs clipping
      const textNode = text.node();
      if (textNode) {
        const textWidth = textNode.getBBox().width;
        if (textWidth > maxTextWidth) {
          // Binary search to find the right length
          let low = 0;
          let high = textContent.length;
          
          while (low < high) {
            const mid = Math.floor((low + high + 1) / 2);
            text.text(textContent.substring(0, mid) + '...');
            
            if ((text.node()?.getBBox().width || 0) <= maxTextWidth) {
              low = mid;
            } else {
              high = mid - 1;
            }
          }
          
          text.text(textContent.substring(0, low) + '...');
          
          // Add title for full text on hover
          text.append('title').text(textContent);
        }
      }
    });

    if (editMode && selectedElement?.type === 'legend') {
      legendGroup
        .append('rect')
        .attr('x', -padding)
        .attr('y', -padding)
        .attr('width', 120)
        .attr('height', totalHeight + 2 * padding)
        .attr('fill', 'none')
        .attr('stroke', 'var(--mk-ui-accent)')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,2')
        .attr('pointer-events', 'none');
    }

    if (editMode) {
      legendGroup.style('cursor', 'pointer');
    }
  }

  private static renderHorizontalSVG(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    legendItems: LegendItem[],
    position: 'top' | 'bottom',
    align: 'start' | 'center' | 'end',
    dimensions: { width: number; height: number },
    titleHeight: number,
    resolveColor: (color: string) => string,
    editMode?: boolean,
    selectedElement?: any,
    onElementSelect?: (element: { type: string }) => void,
    layoutPosition?: { x: number; y: number; width: number; height: number }
  ): void {
    const itemSpacing = 20;
    const squareSize = 12;
    const padding = 10;
    const rowHeight = 20; // Height for each row of legend items
    const verticalSpacing = 5; // Spacing between rows

    // Measure item widths
    const itemWidths: number[] = [];
    const tempGroup = svg.append('g').style('visibility', 'hidden');
    legendItems.forEach((item) => {
      const text = tempGroup
        .append('text')
        .style('font-size', '12px')
        .text(item.label);
      const width = (text.node()?.getBBox().width || 0) + squareSize + 5;
      itemWidths.push(width);
    });
    tempGroup.remove();

    // Calculate available width and layout items in rows
    const availableWidth = layoutPosition?.width || dimensions.width - 2 * padding;
    const rows: { items: number[]; width: number }[] = [];
    let currentRow: number[] = [];
    let currentRowWidth = 0;

    itemWidths.forEach((width, index) => {
      const widthWithSpacing = currentRow.length > 0 ? width + itemSpacing : width;
      
      if (currentRowWidth + widthWithSpacing <= availableWidth || currentRow.length === 0) {
        // Item fits in current row
        currentRow.push(index);
        currentRowWidth += widthWithSpacing;
      } else {
        // Start new row
        rows.push({ items: currentRow, width: currentRowWidth });
        currentRow = [index];
        currentRowWidth = width;
      }
    });
    
    // Add last row
    if (currentRow.length > 0) {
      rows.push({ items: currentRow, width: currentRowWidth });
    }

    const totalHeight = rows.length * rowHeight + (rows.length - 1) * verticalSpacing;

    // Validate dimensions
    if (!dimensions || isNaN(dimensions.width) || isNaN(dimensions.height)) {
      return;
    }
    
    // Use layout position if provided, otherwise calculate
    const legendWidth = layoutPosition?.width || dimensions.width;
    
    // Calculate starting position
    let xPos: number;
    if (layoutPosition) {
      xPos = layoutPosition.x + padding;
    } else {
      xPos = padding;
    }
    
    const yPos = layoutPosition ? layoutPosition.y + padding : (position === 'top'
      ? titleHeight > 0 ? titleHeight + padding : padding
      : dimensions.height - padding - totalHeight);
    
    // Ensure positions are valid numbers
    if (isNaN(xPos) || isNaN(yPos)) {
      return;
    }

    // Create clipping path for horizontal legend to prevent overflow
    const clipId = `legend-clip-${Math.random().toString(36).substring(2, 9)}`;
    const clipWidth = layoutPosition ? layoutPosition.width - 2 * padding : dimensions.width - 2 * padding;
    const clipHeight = layoutPosition ? layoutPosition.height - 2 * padding : totalHeight;
    
    svg.append('defs')
      .append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', clipWidth)
      .attr('height', clipHeight);

    const legendGroup = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${xPos}, ${yPos})`)
      .attr('clip-path', `url(#${clipId})`);

    if (editMode) {
      // Calculate bounding box for all rows
      const maxRowWidth = Math.max(...rows.map(row => row.width));
      legendGroup
        .append('rect')
        .attr('x', -padding)
        .attr('y', -padding / 2)
        .attr('width', maxRowWidth + 2 * padding)
        .attr('height', totalHeight + padding)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
        .on('click', () => {
          if (onElementSelect) {
            onElementSelect({ type: 'legend' });
          }
        });
    }

    // Render items in rows
    rows.forEach((row, rowIndex) => {
      const rowY = rowIndex * (rowHeight + verticalSpacing);
      
      // Calculate row alignment
      let rowXOffset = 0;
      const legendContentWidth = availableWidth - 2 * padding;
      
      switch (align) {
        case 'end':
          rowXOffset = legendContentWidth - row.width;
          break;
        case 'center':
          rowXOffset = (legendContentWidth - row.width) / 2;
          break;
        case 'start':
        default:
          rowXOffset = 0;
          break;
      }

      let currentX = rowXOffset;
      row.items.forEach((itemIndex, i) => {
        const item = legendItems[itemIndex];
        const itemGroup = legendGroup
          .append('g')
          .attr('transform', `translate(${currentX}, ${rowY})`);

        itemGroup
          .append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', squareSize)
          .attr('height', squareSize)
          .attr('fill', item.color)
          .attr('rx', 2)
          .attr('ry', 2);

        itemGroup
          .append('text')
          .attr('x', squareSize + 5)
          .attr('y', squareSize / 2)
          .attr('dominant-baseline', 'middle')
          .style('font-size', '12px')
          .style('fill', resolveColor('var(--mk-ui-text-secondary)'))
          .text(item.label);

        currentX += itemWidths[itemIndex] + (i < row.items.length - 1 ? itemSpacing : 0);
      });
    });

    if (editMode && selectedElement?.type === 'legend') {
      const maxRowWidth = Math.max(...rows.map(row => row.width));
      legendGroup
        .append('rect')
        .attr('x', -padding)
        .attr('y', -padding / 2)
        .attr('width', maxRowWidth + 2 * padding)
        .attr('height', totalHeight + padding)
        .attr('fill', 'none')
        .attr('stroke', 'var(--mk-ui-accent)')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,2')
        .attr('pointer-events', 'none');
    }

    if (editMode) {
      legendGroup.style('cursor', 'pointer');
    }
  }
}