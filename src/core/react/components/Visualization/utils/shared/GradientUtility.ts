import type { Selection } from 'core/utils/d3-imports';
import { RenderContext, isSVGContext, isCanvasContext } from '../RenderContext';

export interface GradientConfig {
  type: 'linear' | 'radial';
  direction?: 'horizontal' | 'vertical' | 'diagonal';
  colors: string[];
  positions?: number[]; // 0-1, should match colors length
  angle?: number; // degrees for linear gradients
  centerX?: number; // 0-1 for radial gradients
  centerY?: number; // 0-1 for radial gradients
}

export class GradientUtility {
  private static gradientIdCounter = 0;

  /**
   * Creates an SVG gradient definition and returns the gradient ID
   */
  static createSVGGradient(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    config: GradientConfig,
    bounds?: { width: number; height: number; x?: number; y?: number }
  ): string {
    const gradientId = `gradient-${++this.gradientIdCounter}`;
    
    // Ensure defs exists
    let defs = svg.select('defs');
    if (defs.empty()) {
      defs = svg.append('defs');
    }

    if (config.type === 'linear') {
      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('gradientUnits', 'objectBoundingBox');

      // Set gradient direction
      const angle = config.angle || 0;
      const radians = (angle * Math.PI) / 180;
      
      let x1 = 0, y1 = 0, x2 = 1, y2 = 0;
      
      if (config.direction === 'vertical') {
        x1 = 0; y1 = 0; x2 = 0; y2 = 1;
      } else if (config.direction === 'diagonal') {
        x1 = 0; y1 = 0; x2 = 1; y2 = 1;
      } else if (config.angle !== undefined) {
        // Calculate direction based on angle
        x1 = 0.5 - Math.cos(radians) / 2;
        y1 = 0.5 - Math.sin(radians) / 2;
        x2 = 0.5 + Math.cos(radians) / 2;
        y2 = 0.5 + Math.sin(radians) / 2;
      }

      gradient
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2);

      // Add color stops
      const positions = config.positions || config.colors.map((_, i) => i / (config.colors.length - 1));
      config.colors.forEach((color, i) => {
        gradient.append('stop')
          .attr('offset', `${positions[i] * 100}%`)
          .attr('stop-color', color);
      });

    } else if (config.type === 'radial') {
      const gradient = defs.append('radialGradient')
        .attr('id', gradientId)
        .attr('gradientUnits', 'objectBoundingBox')
        .attr('cx', config.centerX || 0.5)
        .attr('cy', config.centerY || 0.5)
        .attr('r', 0.5);

      // Add color stops
      const positions = config.positions || config.colors.map((_, i) => i / (config.colors.length - 1));
      config.colors.forEach((color, i) => {
        gradient.append('stop')
          .attr('offset', `${positions[i] * 100}%`)
          .attr('stop-color', color);
      });
    }

    return `url(#${gradientId})`;
  }

  /**
   * Creates a Canvas gradient and returns the CanvasGradient object
   */
  static createCanvasGradient(
    ctx: CanvasRenderingContext2D,
    config: GradientConfig,
    bounds: { x: number; y: number; width: number; height: number }
  ): CanvasGradient {
    let gradient: CanvasGradient;

    if (config.type === 'linear') {
      let x1 = bounds.x, y1 = bounds.y;
      let x2 = bounds.x + bounds.width, y2 = bounds.y;

      if (config.direction === 'vertical') {
        x2 = bounds.x;
        y2 = bounds.y + bounds.height;
      } else if (config.direction === 'diagonal') {
        y2 = bounds.y + bounds.height;
      } else if (config.angle !== undefined) {
        // Calculate direction based on angle
        const radians = (config.angle * Math.PI) / 180;
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const length = Math.max(bounds.width, bounds.height) / 2;
        
        x1 = centerX - Math.cos(radians) * length;
        y1 = centerY - Math.sin(radians) * length;
        x2 = centerX + Math.cos(radians) * length;
        y2 = centerY + Math.sin(radians) * length;
      }

      gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    } else {
      const centerX = bounds.x + bounds.width * (config.centerX || 0.5);
      const centerY = bounds.y + bounds.height * (config.centerY || 0.5);
      const radius = Math.max(bounds.width, bounds.height) / 2;
      
      gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    }

    // Add color stops
    const positions = config.positions || config.colors.map((_, i) => i / (config.colors.length - 1));
    config.colors.forEach((color, i) => {
      gradient.addColorStop(positions[i], color);
    });

    return gradient;
  }

  /**
   * Parse CSS gradient string to GradientConfig
   */
  static parseCSSGradient(cssGradient: string): GradientConfig | null {
    
    // Match linear-gradient pattern
    const linearMatch = cssGradient.match(/linear-gradient\(\s*([^,]+),\s*(.+)\)/);
    if (linearMatch) {
      const [, direction, stops] = linearMatch;
      
      // Parse direction (angle in degrees)
      let angle = 0;
      if (direction.includes('deg')) {
        angle = parseInt(direction.replace('deg', '').trim()) || 0;
      } else if (direction === 'to right') {
        angle = 90;
      } else if (direction === 'to left') {
        angle = 270;
      } else if (direction === 'to bottom') {
        angle = 180;
      } // default is 0 (to top)
      
      // Parse color stops
      const stopMatches = stops.match(/(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\([^)]+\))\s*(\d+%?)?/g) || [];
      const colors: string[] = [];
      const positions: number[] = [];
      
      stopMatches.forEach((stop, index) => {
        const match = stop.match(/(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\([^)]+\))\s*(\d+)%?/);
        if (match) {
          colors.push(match[1]);
          if (match[2]) {
            positions.push(parseInt(match[2]) / 100);
          } else {
            // Distribute evenly if no position specified
            positions.push(index / (stopMatches.length - 1));
          }
        }
      });
      
      const config: GradientConfig = {
        type: 'linear',
        colors,
        positions: positions.length === colors.length ? positions : undefined,
        angle
      };
      
      return config;
    }
    
    // Match radial-gradient pattern
    const radialMatch = cssGradient.match(/radial-gradient\(\s*(.+)\)/);
    if (radialMatch) {
      const [, content] = radialMatch;
      
      // Simple radial gradient parsing - extract colors
      const stopMatches = content.match(/(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\([^)]+\))\s*(\d+%?)?/g) || [];
      const colors: string[] = [];
      const positions: number[] = [];
      
      stopMatches.forEach((stop, index) => {
        const match = stop.match(/(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\([^)]+\))\s*(\d+)%?/);
        if (match) {
          colors.push(match[1]);
          if (match[2]) {
            positions.push(parseInt(match[2]) / 100);
          } else {
            positions.push(index / (stopMatches.length - 1));
          }
        }
      });
      
      const config: GradientConfig = {
        type: 'radial',
        colors,
        positions: positions.length === colors.length ? positions : undefined,
        centerX: 0.5,
        centerY: 0.5
      };
      
      return config;
    }
    
    return null;
  }

  /**
   * Helper to create common gradient presets
   */
  static createPresetGradient(
    preset: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'rainbow',
    direction: 'horizontal' | 'vertical' | 'radial' = 'vertical'
  ): GradientConfig {
    const presets = {
      blue: ['#3b82f6', '#1d4ed8'],
      green: ['#10b981', '#059669'],
      red: ['#ef4444', '#dc2626'],
      purple: ['#8b5cf6', '#7c3aed'],
      orange: ['#f59e0b', '#d97706'],
      rainbow: ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']
    };

    return {
      type: direction === 'radial' ? 'radial' : 'linear',
      direction: direction === 'radial' ? undefined : direction,
      colors: presets[preset]
    };
  }

  /**
   * Applies gradient to SVG or Canvas context based on render context
   */
  static applyGradient(
    context: RenderContext,
    config: GradientConfig,
    bounds?: { x: number; y: number; width: number; height: number }
  ): string | CanvasGradient {
    
    if (isSVGContext(context)) {
      const result = this.createSVGGradient(context.svg, config, bounds ? { width: bounds.width, height: bounds.height } : undefined);
      return result;
    } else if (isCanvasContext(context) && bounds) {
      const result = this.createCanvasGradient(context.ctx, config, bounds);
      return result;
    }
    return '';
  }
}