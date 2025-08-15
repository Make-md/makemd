import { Superstate } from "makemd-core";
import { ColorPaletteAsset } from "shared/types/assets";

export interface ColorPaletteColor {
  name: string;
  value: string;
  category?: string;
}


export const getColorPalettes = (superstate: Superstate): ColorPaletteAsset[] => {
  // Check both possible asset manager references
  const assetManager = (superstate as any).assetManager || (superstate as any).assets;
  
  if (!assetManager) {
    console.warn('[ColorPalette] AssetManager not available in superstate');
    return [];
  }
  
  // Asset manager will ensure defaults exist if none are found
  const palettes = assetManager.getColorPalettes() || [];
  
  return palettes;
};

export const getColorPaletteById = (superstate: Superstate, paletteId: string): ColorPaletteAsset | undefined => {
  const palettes = getColorPalettes(superstate);
  return palettes.find(p => p.id === paletteId);
};

export const getDefaultPalette = (superstate: Superstate): ColorPaletteAsset | undefined => {
  return getColorPaletteById(superstate, 'default-palette');
};

export const getMonochromePalette = (superstate: Superstate): ColorPaletteAsset | undefined => {
  return getColorPaletteById(superstate, 'monochrome-palette');
};

export const getThemeColors = (superstate: Superstate): ColorPaletteColor[] => {
  const defaultPalette = getDefaultPalette(superstate);
  return defaultPalette?.colors || [];
};

export const getMonochromeColors = (superstate: Superstate): ColorPaletteColor[] => {
  const monochromePalette = getMonochromePalette(superstate);
  return monochromePalette?.colors || [];
};

export const getAllColors = (superstate: Superstate): ColorPaletteColor[] => {
  const palettes = getColorPalettes(superstate);
  return palettes.flatMap(p => p.colors);
};

export const getColorByName = (superstate: Superstate, name: string): string | undefined => {
  const colors = getAllColors(superstate);
  const color = colors.find(c => c.name.toLowerCase() === name.toLowerCase());
  return color?.value;
};

// Legacy compatibility arrays for easier migration
export const getColors = (superstate: Superstate): [string, string][] => {
  return getThemeColors(superstate).map(c => [c.name, c.value] as [string, string]);
};

export const getColorsBase = (superstate: Superstate): [string, string][] => {
  return getMonochromeColors(superstate).map(c => [c.name, c.value] as [string, string]);
};

// UI color arrays that combine CSS variables with palette colors
export const getBackgroundColors = (): [string, string][] => [
  ["Background", "var(--mk-ui-background)"],
  ["Background Variant", "var(--mk-ui-background-variant)"],
  ["Background Contrast", "var(--mk-ui-background-contrast)"],
  ["Background Active", "var(--mk-ui-background-active)"],
  ["Background Selected", "var(--mk-ui-background-selected)"],
];

export const getTextColors = (): [string, string][] => [
  ["Text Primary", "var(--mk-ui-text-primary)"],
  ["Text Secondary", "var(--mk-ui-text-secondary)"],
  ["Text Tertiary", "var(--mk-ui-text-tertiary)"],
];

// Keep the original color utility functions from shared/utils/color.ts
export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : {r: 0, g: 0, b: 0}
}

export function hexToHsl(color: string)  {
    const red = parseInt(color.slice(1, 3) ?? '0', 16) / 255;
    const green = parseInt(color.slice(3, 5)  ?? '0', 16) / 255;
    const blue = parseInt(color.slice(5, 7) ?? '0', 16) / 255;

    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);

    const delta = max - min;

    let hue = 0;
    if (delta === 0) {
        hue = 0;
    }
    else if (max === red) {
        hue = 60 * (((green - blue) / delta) % 6);
    }
    else if (max === green) {
        hue = 60 * (((green - blue) / delta) + 2);        
    }
    else if (max === blue) {
        hue = 60 * (((green - blue) / delta) + 4);
    }

    hue = Math.round(hue);
    if (hue < 0) {
        hue += 360;
    }
    const luminance = (max + min) / 2;
    const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * luminance - 1));

    return {h: hue, s: saturation,l: luminance};
}

function hslToHex(color: { h: number, s: number, l: number }) {
  const c = (1 - Math.abs(2 * color.l - 1)) * color.s;
  const x = c * (1 - Math.abs((color.h / 60) % 2 - 1));
  const m = color.l - c / 2;

  let rgbValue: {r: number, g: number, b: number} = {r: 0, g: 0, b: 0};
  if (color.h >= 0 && color.h < 60) {
      rgbValue = {r: c, g: x, b: 0};
  }
  else if (color.h >= 60 && color.h < 120) {
      rgbValue = {r: x, g: c, b: 0};
  }
  else if (color.h >= 120 && color.h < 180) {
      rgbValue = {r: 0, g: c, b: x};
  }
  else if (color.h >= 180 && color.h < 240) {
      rgbValue = {r: 0, g: x, b: c};
  }
  else if (color.h >= 240 && color.h < 300) {
      rgbValue = {r: x, g: 0, b: c};
  }
  else if (color.h >= 300 && color.h < 360) {
      rgbValue = {r: c, g: 0, b: x};
  }

  const red = Math.round((rgbValue.r + m) * 255);
  const green = Math.round((rgbValue.g + m) * 255);
  const blue = Math.round((rgbValue.b + m) * 255);

  return '#' + red.toString(16) + green.toString(16) + blue.toString(16);
}

export const shiftColor = (color: string, s: number, l: number) => {
  const hsl = hexToHsl(color);
  return hslToHex({ ...hsl, s: hsl.s +s, l: hsl.l +l});
}

export const getGradientPalettes = (superstate: Superstate): ColorPaletteAsset[] => {
  const assetManager = (superstate as any).assetManager || (superstate as any).assets;
  
  if (!assetManager) {
    console.warn('[ColorPalette] AssetManager not available in superstate');
    return [];
  }
  
  return assetManager.getColorPalettes().filter((palette: ColorPaletteAsset) => 
    palette.gradients && palette.gradients.length > 0
  ) || [];
};

export const getGradientPaletteById = (superstate: Superstate, paletteId: string): ColorPaletteAsset | undefined => {
  const palettes = getGradientPalettes(superstate);
  return palettes.find(p => p.id === paletteId);
};

export const getDefaultGradientPalette = (superstate: Superstate): ColorPaletteAsset | undefined => {
  return getGradientPaletteById(superstate, 'default-gradient-palette');
};

export const getAllGradients = (superstate: Superstate): ColorPaletteColor[] => {
  const palettes = getGradientPalettes(superstate);
  
  // Get gradients from the gradients property
  const gradientsFromGradientsProp = palettes.flatMap(p => p.gradients?.map(g => ({
    name: g.name,
    value: createGradientCssValue(g),
    category: 'gradient'
  })) || []);
  
  // Get gradients from the colors array (for palettes that store gradients as colors)
  const gradientsFromColors = palettes.flatMap(p => 
    p.colors?.filter(c => c.value && (
      c.value.includes('linear-gradient') || 
      c.value.includes('radial-gradient') || 
      c.value.includes('conic-gradient')
    )).map(c => ({
      name: c.name,
      value: c.value,
      category: c.category || 'gradient'
    })) || []
  );
  
  // Combine both sources
  const allGradients = [...gradientsFromGradientsProp, ...gradientsFromColors];
  
  // If no gradients found from palettes, return defaults
  if (allGradients.length === 0) {
    return getDefaultGradients();
  }
  
  return allGradients;
};

export const getGradientByName = (superstate: Superstate, name: string): string | undefined => {
  const gradients = getAllGradients(superstate);
  const gradient = gradients.find(g => g.name.toLowerCase() === name.toLowerCase());
  return gradient?.value;
};

export const createGradientCssValue = (gradient: { type: 'linear' | 'radial', stops: Array<{color: string, position: number}>, direction?: number, center?: {x: number, y: number}, radius?: number }): string => {
  const stops = gradient.stops
    .sort((a, b) => a.position - b.position)
    .map(stop => `${stop.color} ${Math.round(stop.position * 100)}%`)
    .join(', ');

  if (gradient.type === 'linear') {
    const direction = gradient.direction || 0;
    return `linear-gradient(${direction}deg, ${stops})`;
  } else {
    const center = gradient.center || { x: 0.5, y: 0.5 };
    const radius = gradient.radius || 0.5;
    return `radial-gradient(circle ${Math.round(radius * 100)}% at ${Math.round(center.x * 100)}% ${Math.round(center.y * 100)}%, ${stops})`;
  }
};

export const getDefaultGradients = (): ColorPaletteColor[] => [
  {
    name: "Warm Sunset",
    value: "linear-gradient(135deg, rgba(255, 255, 196, 1.000) 0.000%, rgba(255, 97, 100, 1.000) 50.000%, rgba(176, 0, 18, 1.000) 100.000%)",
    category: "gradient"
  },
  {
    name: "Earth Tones",
    value: "linear-gradient(90deg, rgba(164, 116, 81, 1.000) 0.000%, rgba(156, 152, 129, 1.000) 16.667%, rgba(115, 160, 157, 1.000) 33.333%, rgba(59, 137, 154, 1.000) 50.000%, rgba(9, 91, 121, 1.000) 66.667%, rgba(0, 40, 71, 1.000) 83.333%, rgba(0, 1, 22, 1.000) 100.000%)",
    category: "gradient"
  },
  {
    name: "Golden Pink",
    value: "linear-gradient(45deg, rgba(250, 218, 97, 1.000) 0.000%, rgba(255, 145, 136, 1.000) 50.000%, rgba(255, 90, 205, 1.000) 100.000%)",
    category: "gradient"
  },
  {
    name: "Soft Pink",
    value: "linear-gradient(45deg, rgba(252, 142, 197, 1.000) 0.000%, rgba(255, 141, 211, 1.000) 25.000%, rgba(255, 161, 216, 1.000) 50.000%, rgba(255, 193, 210, 1.000) 75.000%, rgba(255, 224, 195, 1.000) 100.000%)",
    category: "gradient"
  },
  {
    name: "Purple Gold",
    value: "linear-gradient(45deg, rgba(65, 89, 208, 1.000) 0.000%, rgba(200, 79, 192, 1.000) 50.000%, rgba(255, 205, 112, 1.000) 100.000%)",
    category: "gradient"
  },
  {
    name: "Cyan Purple",
    value: "linear-gradient(45deg, rgba(35, 212, 253, 1.000) 0.000%, rgba(58, 152, 240, 1.000) 50.000%, rgba(183, 33, 255, 1.000) 100.000%)",
    category: "gradient"
  }
];