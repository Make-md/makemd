import i18n from "shared/i18n";

import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';

export interface TitleConfig {
  title?: {
    text: string;
    fontSize?: number;
    color?: string;
  };
  subtitle?: {
    text: string;
    fontSize?: number;
    color?: string;
  };
}

export class TitleUtility {
  static render(
    context: RenderContext,
    onTitleClick?: (event: MouseEvent) => void
  ): { titleHeight: number } {
    if (isSVGContext(context)) {
      return this.renderSVG(context, onTitleClick);
    } else if (isCanvasContext(context)) {
      return this.renderCanvas(context);
    }
    return { titleHeight: 0 };
  }

  private static renderSVG(
    context: RenderContext,
    onTitleClick?: (event: MouseEvent) => void
  ): { titleHeight: number } {
    if (!isSVGContext(context)) return { titleHeight: 0 };

    const { svg, config, actualDimensions, resolveColor, editMode, selectedElement, onElementSelect, onElementDoubleClick } = context;
    
    // In edit mode, always show a title (even if empty)
    if (!config.layout.title && !editMode) return { titleHeight: 0 };

    const titlePadding = 16;
    const titleGroup = svg.append('g').attr('class', 'title-group');

    // Add invisible background for better click detection
    if (editMode) {
      titleGroup
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', actualDimensions.width)
        .attr('height', (config.layout.title?.fontSize || 16) + titlePadding * 2)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
        .on('click', function(event) {
          if (onElementSelect) {
            onElementSelect({ type: 'title' });
          }
          if (onTitleClick) {
            onTitleClick(event as MouseEvent);
          }
        });
    }

    // Determine title position based on alignment
    const titleAlign = config.layout.title?.align || 'left';
    let titleX = 0;
    let textAnchor = 'start';
    
    switch (titleAlign) {
      case 'center':
        titleX = actualDimensions.width / 2;
        textAnchor = 'middle';
        break;
      case 'right':
        titleX = actualDimensions.width;
        textAnchor = 'end';
        break;
      case 'left':
      default:
        titleX = 0;
        textAnchor = 'start';
        break;
    }

    const titleText = titleGroup
      .append('text')
      .attr('x', titleX)
      .attr('y', config.layout.title?.fontSize || 16)
      .attr('text-anchor', textAnchor)
      .style('font-size', `${config.layout.title?.fontSize || 16}px`)
      .style('fill', resolveColor(config.layout.title?.color || 'var(--mk-ui-text-primary)') || '#333')
      .style('font-weight', 'bold')
      .style('cursor', editMode ? 'pointer' : 'default')
      .style('opacity', editMode ? 0 : 1) // Hide in edit mode
      .text(config.layout.title?.text || (editMode ? i18n.labels.title : ''));

    // Add selection indicator
    if (editMode && selectedElement?.type === 'title') {
      const bbox = titleText.node()?.getBBox();
      if (bbox) {
        titleGroup
          .append('rect')
          .attr('x', bbox.x - 4)
          .attr('y', bbox.y - 2)
          .attr('width', bbox.width + 8)
          .attr('height', bbox.height + 4)
          .attr('fill', 'none')
          .attr('stroke', 'var(--mk-ui-accent)')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,2')
          .attr('pointer-events', 'none');
      }
    }

    if (editMode) {
      titleText.on('click', function(event) {
        if (onElementSelect) {
          onElementSelect({ type: 'title' });
        }
        if (onTitleClick) {
          onTitleClick(event as MouseEvent);
        }
      })
      .on('dblclick', function(event) {
        if (onElementDoubleClick) {
          const node = this as SVGTextElement;
          const rect = node.getBoundingClientRect();
          const currentValue = config.layout.title?.text || 'Chart Title';
          onElementDoubleClick({ type: 'title' }, rect, currentValue);
        }
      });
    }

    // Add subtitle if exists
    if (config.layout.subtitle) {
      svg
        .append('text')
        .attr('x', actualDimensions.width / 2)
        .attr('y', (config.layout.title?.fontSize || 16) + (config.layout.subtitle.fontSize || 12) + 5)
        .attr('text-anchor', 'middle')
        .style('font-size', `${config.layout.subtitle.fontSize || 12}px`)
        .style('fill', resolveColor(config.layout.subtitle.color || 'var(--mk-ui-text-secondary)') || '#666')
        .text(config.layout.subtitle.text);
    }

    return { titleHeight: (config.layout.title?.fontSize || 16) + 10 };
  }

  private static renderCanvas(context: RenderContext): { titleHeight: number } {
    if (!isCanvasContext(context)) return { titleHeight: 0 };

    const { ctx, config, actualDimensions, resolveColor } = context;
    
    
    if (!config.layout.title) return { titleHeight: 0 };

    ctx.save();
    
    // Draw title
    const titlePadding = 10;
    ctx.fillStyle = resolveColor(config.layout.title.color || 'var(--mk-ui-text-primary)');
    ctx.font = `bold ${config.layout.title.fontSize || 16}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(config.layout.title.text, titlePadding, titlePadding);

    // Draw subtitle if exists
    if (config.layout.subtitle) {
      ctx.fillStyle = resolveColor(config.layout.subtitle.color || 'var(--mk-ui-text-secondary)');
      ctx.font = `${config.layout.subtitle.fontSize || 12}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(
        config.layout.subtitle.text,
        actualDimensions.width / 2,
        titlePadding + (config.layout.title.fontSize || 16) + 5
      );
    }

    ctx.restore();

    const totalTitleHeight = titlePadding + (config.layout.title.fontSize || 16) + 10;
    return { titleHeight: totalTitleHeight };
  }
}