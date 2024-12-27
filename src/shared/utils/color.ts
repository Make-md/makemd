
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

export const colors = [
  ["Red", "var(--mk-color-red)"],
  ["Pink", "var(--mk-color-pink)"],
  ["Orange", "var(--mk-color-orange)"],
  ["Yellow", "var(--mk-color-yellow)"],
  ["Green", "var(--mk-color-green)"],
  ["Turquoise", "var(--mk-color-turquoise)"],
  ["Teal", "var(--mk-color-teal)"],
  ["Blue", "var(--mk-color-blue)"],
  ["Purple", "var(--mk-color-purple)"],
  ["Brown", "var(--mk-color-brown)"],
  ["Charcoal", "var(--mk-color-charcoal)"],
  ["Gray", "var(--mk-color-gray)"],
];

export const colorsBase = [
    ["Base 0", "var(--mk-color-base-0)"],
    ["Base 10", "var(--mk-color-base-10)"],
    ["Base 20", "var(--mk-color-base-20)"],
    ["Base 30", "var(--mk-color-base-30)"],
    ["Base 40", "var(--mk-color-base-40)"],
    ["Base 50", "var(--mk-color-base-50)"],
    ["Base 60", "var(--mk-color-base-60)"],
    ["Base 70", "var(--mk-color-base-70)"],
    ["Base 100", "var(--mk-color-base-100)"],
  ];
export const backgroundColors = [
    ["Background", "var(--mk-ui-background)"],
    ["Background Variant", "var(--mk-ui-background-variant)"],
    ["Background Contrast", "var(--mk-ui-background-contrast)"],
    ["Background Active", "var(--mk-ui-background-active)"],
    ["Background Selected", "var(--mk-ui-background-selected)"],
]
export const textColors = [
    ["Text Primary", "var(--mk-ui-text-primary)"],
    ["Text Secondary", "var(--mk-ui-text-secondary)"],
    ["Text Tertiary", "var(--mk-ui-text-tertiary)"],
]


export const shiftColor = (color: string, s: number, l: number) => {
  const hsl = hexToHsl(color);
  return hslToHex({ ...hsl, s: hsl.s +s, l: hsl.l +l});
}
