/**
 * State-of-the-art emoji bounding box utilities
 * Ensures emojis fit exactly within their designated space
 */

/**
 * Creates an emoji element that fits exactly in its bounding box
 * @param emoji - The emoji character or unified code
 * @param size - CSS size value (e.g., '20px', '1em', 'var(--icon-size)')
 * @param options - Additional styling options
 */
export const createExactEmojiBox = (
  emoji: string,
  size: string = 'var(--icon-size)',
  options?: {
    fontless?: boolean;
    className?: string;
    method?: 'svg' | 'css-grid' | 'css-flex';
  }
): string => {
  const method = options?.method || 'svg';
  const fontFamily = options?.fontless 
    ? '' 
    : 'font-family: \'Apple Color Emoji\', \'Segoe UI Emoji\', \'Noto Color Emoji\', \'Android Emoji\', \'EmojiOne Color\', \'Twemoji Mozilla\', system-ui, sans-serif;';
  
  switch (method) {
    case 'svg':
      // SVG foreignObject method - Most reliable for exact sizing
      return `
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="xMidYMid meet" 
          class="${options?.className || ''}"
          style="
            width: ${size}; 
            height: ${size}; 
            display: inline-block; 
            vertical-align: middle;
            pointer-events: none;
          "
        >
          <foreignObject width="100" height="100">
            <div xmlns="http://www.w3.org/1999/xhtml" style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
              font-size: 85px;
              line-height: 1;
              text-align: center;
              ${fontFamily}
              user-select: none;
              -webkit-user-select: none;
              pointer-events: auto;
            ">
              ${emoji}
            </div>
          </foreignObject>
        </svg>
      `;
      
    case 'css-grid':
      // CSS Grid method - Good browser support, simpler DOM
      return `
        <span 
          class="${options?.className || ''}"
          style="
            display: inline-grid;
            place-items: center;
            width: ${size};
            height: ${size};
            font-size: calc(${size} * 0.85);
            line-height: 1;
            overflow: hidden;
            text-align: center;
            vertical-align: middle;
            ${fontFamily}
            user-select: none;
            -webkit-user-select: none;
            contain: layout size style;
          "
        >
          ${emoji}
        </span>
      `;
      
    case 'css-flex':
      // CSS Flexbox method - Maximum compatibility
      return `
        <span 
          class="${options?.className || ''}"
          style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: ${size};
            height: ${size};
            font-size: calc(${size} * 0.85);
            line-height: 1;
            overflow: hidden;
            text-align: center;
            vertical-align: middle;
            box-sizing: border-box;
            ${fontFamily}
            user-select: none;
            -webkit-user-select: none;
            contain: layout size style;
          "
        >
          ${emoji}
        </span>
      `;
      
    default:
      return createExactEmojiBox(emoji, size, { ...options, method: 'svg' });
  }
};

/**
 * CSS class definitions for emoji containers
 * Can be added to a stylesheet for reusable styling
 */
export const emojiBoxStyles = `
  .mk-emoji-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--icon-size, 1em);
    height: var(--icon-size, 1em);
    font-size: calc(var(--icon-size, 1em) * 0.85);
    line-height: 1;
    overflow: hidden;
    text-align: center;
    vertical-align: middle;
    font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Android Emoji', 'EmojiOne Color', 'Twemoji Mozilla', system-ui, sans-serif;
    user-select: none;
    -webkit-user-select: none;
    contain: layout size style;
  }
  
  .mk-emoji-box-svg {
    width: var(--icon-size, 1em);
    height: var(--icon-size, 1em);
    display: inline-block;
    vertical-align: middle;
  }
  
  .mk-emoji-box-svg > svg {
    width: 100%;
    height: 100%;
  }
  
  /* Ensure consistent rendering across different contexts */
  .mk-emoji-box-exact {
    position: relative;
    display: inline-block;
    width: var(--icon-size, 1em);
    height: var(--icon-size, 1em);
    vertical-align: middle;
  }
  
  .mk-emoji-box-exact::before {
    content: attr(data-emoji);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.85em;
    line-height: 1;
    font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Android Emoji', 'EmojiOne Color', 'Twemoji Mozilla', system-ui, sans-serif;
  }
`;

/**
 * Calculates the optimal font-size for an emoji to fit in a given container
 * @param containerSize - The container size in pixels
 * @returns The optimal font-size as a CSS value
 */
export const calculateOptimalEmojiFontSize = (containerSize: number): string => {
  // Most emojis render optimally at 85% of container size
  // This accounts for internal padding in emoji fonts
  const optimalSize = containerSize * 0.85;
  return `${Math.round(optimalSize)}px`;
};

/**
 * Tests if the browser supports color emojis
 */
export const supportsColorEmoji = (): boolean => {
  if (typeof document === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  
  ctx.textBaseline = 'top';
  ctx.font = '32px Arial';
  ctx.fillText('😃', 0, 0);
  
  // Check if any pixel is not black/white/transparent
  const imageData = ctx.getImageData(16, 16, 1, 1).data;
  const [r, g, b, a] = imageData;
  
  // If alpha is 0, no emoji was drawn
  if (a === 0) return false;
  
  // Check for color (not grayscale)
  return !(r === g && g === b);
};