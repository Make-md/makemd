import { select, schemeCategory10 } from 'core/utils/d3-imports';
import type { Selection } from 'core/utils/d3-imports';

export const resolveColor = (color: string): string => {
  if (color.startsWith('var(')) {
    // Extract CSS variable name from var(--variable-name)
    const varName = color.match(/var\((--[^)]+)\)/)?.[1];
    if (varName) {
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      return value || color;
    }
  }
  return color;
};

export const getThemeColors = (): string[] => [
  resolveColor('var(--mk-color-blue)'),
  resolveColor('var(--mk-color-green)'),
  resolveColor('var(--mk-color-orange)'),
  resolveColor('var(--mk-color-purple)'),
  resolveColor('var(--mk-color-red)'),
  resolveColor('var(--mk-color-teal)'),
  resolveColor('var(--mk-color-yellow)'),
  resolveColor('var(--mk-color-pink)'),
  resolveColor('var(--mk-color-turquoise)'),
  resolveColor('var(--mk-color-brown)')
];

export const createTooltip = (className: string = 'd3-viz-tooltip') => {
  // Remove any existing tooltips with this class name to prevent duplicates
  select('body').selectAll(`.${className}`).remove();
  
  return select('body').append('div')
    .attr('class', className)
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
};

export const showTooltip = (
  tooltip: Selection<HTMLDivElement, unknown, HTMLElement, any>,
  content: string,
  event: MouseEvent
) => {
  // Hide all other tooltips before showing this one
  select('body').selectAll('[class*="-tooltip"]')
    .filter(function() { return this !== tooltip.node(); })
    .style('opacity', 0);
  
  tooltip.transition()
    .duration(200)
    .style('opacity', 1);
  
  tooltip.html(content)
    .style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 28) + 'px');
};

export const hideTooltip = (
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>
) => {
  tooltip.transition()
    .duration(200)
    .style('opacity', 0)
    .on('end', () => tooltip.remove());
};

export const getSolidPaletteColors = (colorPaletteId?: string, superstate?: any): string[] => {
  // Try to get color palette from AssetManager first
  if (colorPaletteId && superstate?.assets) {
    try {
      const palettes = superstate.assets.getColorPalettes();
      const palette = palettes.find((p: any) => p.id === colorPaletteId);
      
      if (palette && palette.colors && palette.colors.length > 0) {
        // Filter out gradient colors, keep only solid colors
        const solidColors = palette.colors
          .filter((c: any) => c.value && !(
            c.value.includes('linear-gradient') || 
            c.value.includes('radial-gradient') || 
            c.value.includes('conic-gradient')
          ))
          .map((c: any) => resolveColor(c.value));
        
        if (solidColors.length > 0) {
          return solidColors;
        }
      }
    } catch (error) {
    }
  }
  
  // Fall back to getPaletteColors
  return getPaletteColors(colorPaletteId, superstate);
};

export const getPaletteColors = (colorPaletteId?: string, superstate?: any): string[] => {
  
  // Try to get color palette from AssetManager first
  if (colorPaletteId && superstate?.assets) {
    try {
      const palettes = superstate.assets.getColorPalettes();
      
      const palette = palettes.find((p: any) => p.id === colorPaletteId);
      
      if (palette && palette.colors && palette.colors.length > 0) {
        const colors = palette.colors.map((c: any) => resolveColor(c.value));
        return colors;
      }
    } catch (error) {
    }
  }
  
  // Fall back to localStorage (for backward compatibility)
  if (colorPaletteId) {
    const storedPalettes = localStorage.getItem('mk-color-palettes');
    if (storedPalettes) {
      const palettes = JSON.parse(storedPalettes);
      const palette = palettes.find((p: any) => p.id === colorPaletteId);
      if (palette && palette.colors && palette.colors.length > 0) {
        return palette.colors.map((c: any) => c.value);
      }
    }
  }
  
  // Fall back to default theme colors
  // Try to get theme colors first
  const themeColors = getThemeColors();
  if (themeColors && themeColors.length > 0) {
    return themeColors;
  }
  
  // If theme colors not available, use default palette values
  return [
    '#ef4444', // Red
    '#ec4899', // Pink
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Turquoise
    '#14b8a6', // Teal
    '#3b82f6', // Blue
    '#a855f7', // Purple
    '#a16207', // Brown
  ];
};