import { FrameTreeProp } from "shared/types/mframe";

/**
 * State prefix regex for parsing state-specific style properties
 * Matches patterns like "hover:backgroundColor", "press:transform", etc.
 */
export const STATE_PREFIX_REGEX = /^(hover|press|focus|active|disabled|selected|loading|error):(.+)$/;

/**
 * Supported interaction states
 */
export type InteractionState = {
  hover?: boolean;
  press?: boolean;
  focus?: boolean;
  active?: boolean;
  disabled?: boolean;
  selected?: boolean;
  loading?: boolean;
  error?: boolean;
};

/**
 * Parsed state styles structure for caching
 */
export type ParsedStateStyles = {
  baseStyles: FrameTreeProp;
  stateStyles: { [state: string]: FrameTreeProp };
};

/**
 * WeakMap cache for parsed state styles to avoid re-parsing
 */
const stateStyleCache = new WeakMap<FrameTreeProp, ParsedStateStyles>();

/**
 * Parse styles object into base styles and state-specific styles
 * @param styles - The styles object potentially containing state prefixes
 * @returns Parsed styles separated by state
 */
export const parseStateStyles = (styles: FrameTreeProp): ParsedStateStyles => {
  // Check cache first
  const cached = stateStyleCache.get(styles);
  if (cached) {
    return cached;
  }

  const baseStyles: FrameTreeProp = {};
  const stateStyles: { [state: string]: FrameTreeProp } = {};

  for (const [key, value] of Object.entries(styles)) {
    const match = key.match(STATE_PREFIX_REGEX);

    if (match) {
      const [, stateType, propertyName] = match;
      if (!stateStyles[stateType]) {
        stateStyles[stateType] = {};
      }
      stateStyles[stateType][propertyName] = value;
    } else {
      baseStyles[key] = value;
    }
  }

  const result = { baseStyles, stateStyles };
  
  // Cache the result
  stateStyleCache.set(styles, result);
  
  return result;
};

/**
 * Resolve styles based on current interaction state
 * @param styles - The styles object potentially containing state prefixes
 * @param currentState - Current interaction state
 * @returns Resolved styles with state-specific styles applied
 */
export const parseStylesForState = (
  styles: FrameTreeProp,
  currentState: InteractionState
): FrameTreeProp => {
  if (!styles || Object.keys(styles).length === 0) {
    return styles;
  }

  const { baseStyles, stateStyles } = parseStateStyles(styles);
  
  // Start with base styles
  const resolvedStyles = { ...baseStyles };

  // Apply state-specific styles in priority order
  // Later states override earlier ones if multiple are active
  const statePriority = ['disabled', 'loading', 'error', 'selected', 'focus', 'hover', 'press', 'active'];
  
  for (const stateType of statePriority) {
    if (currentState[stateType as keyof InteractionState] && stateStyles[stateType]) {
      Object.assign(resolvedStyles, stateStyles[stateType]);
    }
  }

  return resolvedStyles;
};

/**
 * Check if a styles object contains any state-prefixed properties
 * @param styles - The styles object to check
 * @returns True if any state prefixes are found
 */
export const hasStatePrefixes = (styles: FrameTreeProp): boolean => {
  if (!styles) return false;
  
  return Object.keys(styles).some(key => STATE_PREFIX_REGEX.test(key));
};

/**
 * Extract all unique state types from a styles object
 * @param styles - The styles object to analyze
 * @returns Array of state types found in the styles
 */
export const extractStateTypes = (styles: FrameTreeProp): string[] => {
  if (!styles) return [];
  
  const stateTypes = new Set<string>();
  
  for (const key of Object.keys(styles)) {
    const match = key.match(STATE_PREFIX_REGEX);
    if (match) {
      stateTypes.add(match[1]);
    }
  }
  
  return Array.from(stateTypes);
};

/**
 * Generate CSS for state-specific styles (for performance optimization)
 * @param styles - The styles object containing state prefixes
 * @param className - CSS class name to apply styles to
 * @returns CSS string with pseudo-selectors for supported states
 */
export const generateStatefulCSS = (styles: FrameTreeProp, className: string): string => {
  const { baseStyles, stateStyles } = parseStateStyles(styles);
  
  let css = '';
  
  // Base styles
  if (Object.keys(baseStyles).length > 0) {
    css += `.${className} { ${convertToCSS(baseStyles)} }\n`;
  }
  
  // State-specific CSS with pseudo-selectors (web only)
  const pseudoSelectorMap: { [state: string]: string } = {
    hover: ':hover',
    focus: ':focus',
    active: ':active',
    disabled: ':disabled',
  };
  
  for (const [stateType, stateStyleObj] of Object.entries(stateStyles)) {
    const pseudoSelector = pseudoSelectorMap[stateType];
    if (pseudoSelector && Object.keys(stateStyleObj).length > 0) {
      css += `.${className}${pseudoSelector} { ${convertToCSS(stateStyleObj)} }\n`;
    }
  }
  
  return css;
};

/**
 * Convert style object to CSS string
 * @param styles - Style object to convert
 * @returns CSS property string
 */
const convertToCSS = (styles: FrameTreeProp): string => {
  return Object.entries(styles)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssProperty}: ${value};`;
    })
    .join(' ');
};

/**
 * Check if state styles contain only simple CSS properties that can be handled with CSS pseudo-selectors
 * @param stateStyles - State styles to check
 * @returns True if styles are simple enough for CSS-only handling
 */
export const isSimpleStateStyles = (stateStyles: { [state: string]: FrameTreeProp }): boolean => {
  const simpleProperties = new Set([
    'backgroundColor', 'color', 'opacity', 'transform', 'boxShadow', 
    'borderColor', 'borderWidth', 'borderRadius', 'fontSize', 'fontWeight',
    'padding', 'margin', 'width', 'height', 'scale'
  ]);
  
  for (const stateStyleObj of Object.values(stateStyles)) {
    for (const property of Object.keys(stateStyleObj)) {
      if (!simpleProperties.has(property)) {
        return false;
      }
    }
  }
  
  return true;
};