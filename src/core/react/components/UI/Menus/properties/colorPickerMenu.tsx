import { Rect } from "shared/types/Pos";

import { Superstate } from "makemd-core";

import {
  Gradient,
  parseGradient,
  stringifyGradient,
} from "core/utils/color/gradient";
import { uniqueId, debounce } from "lodash";
import i18n from "shared/i18n";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  getColors,
  getColorsBase,
  getBackgroundColors,
  getTextColors,
  getColorPalettes,
  getAllGradients,
  createGradientCssValue,
} from "core/utils/colorPalette";

// Color mode types
type ColorMode = 'palettes' | 'solid' | 'gradient' | 'none';

// Constants
const ICON_BUTTON_SIZE = 28;

// Helper function to convert HSL to RGB
const hslToRgb = (h: number, s: number, l: number): number[] => {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

// Helper function to convert RGB to HSL
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h * 360, s * 100, l * 100];
};

// Helper function to parse hex color to RGB
const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
};

// GradientStop component
const GradientStop: React.FC<{
  stop: { id: string; color: string; position: number };
  isSelected: boolean;
  onSelect: () => void;
  onMove: (newPosition: number) => void;
}> = ({ stop, isSelected, onSelect, onMove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragDataRef = useRef({ startX: 0, startPosition: 0, container: null as HTMLElement | null });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    onSelect();
    setIsDragging(true);
    
    const container = (e.target as HTMLElement).closest('.mk-gradient-preview') as HTMLElement;
    dragDataRef.current = {
      startX: e.clientX,
      startPosition: stop.position,
      container
    };
    
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      
      const { startX, startPosition, container } = dragDataRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const deltaX = e.clientX - startX;
      const deltaPercent = (deltaX / rect.width) * 100;
      const newPosition = Math.max(0, Math.min(100, startPosition + deltaPercent));
      
      onMove(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onMove]);

  return (
    <div
      className="mk-gradient-stop"
      style={{
        position: 'absolute',
        left: `${stop.position}%`,
        top: '-10px',
        transform: 'translateX(-50%)',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isSelected ? 10 : 5,
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: stop.color,
          border: isSelected ? '2px solid #007acc' : 'none',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

// ColorSwatch component
const ColorSwatch: React.FC<{
  color: string;
  name?: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  className?: string;
  isGradient?: boolean;
}> = ({ color, name, size = 'medium', onClick, className = '', isGradient = false }) => {
  const sizeClasses = {
    small: 'mk-color-swatch-small',
    medium: 'mk-color-swatch-medium',
    large: 'mk-color-swatch-large'
  };

  const backgroundStyle = isGradient 
    ? { backgroundImage: color }
    : { backgroundColor: color };

  return (
    <div
      className={`mk-color-swatch ${sizeClasses[size]} ${className} ${isGradient ? 'mk-gradient-swatch' : ''}`}
    >
      <div
        className="mk-color-swatch-inner"
        style={backgroundStyle}
        onClick={onClick}
        title={name ? `${name}: ${color}` : color}
      >
      </div>
    </div>
  );
};

// CircularAngleSelector component
const CircularAngleSelector: React.FC<{
  angle: number;
  onChange: (angle: number) => void;
  size?: number;
}> = ({ angle, onChange, size = 40 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateAngle = (clientX: number, clientY: number) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const newAngle = (Math.atan2(deltaY, deltaX) * 180 / Math.PI + 90 + 360) % 360;
      onChange(Math.round(newAngle));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateAngle(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateAngle(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const indicatorAngle = angle - 90; // Convert to radians and adjust for top position
  const indicatorRadius = (size / 2) - 4;
  const indicatorX = Math.cos(indicatorAngle * Math.PI / 180) * indicatorRadius;
  const indicatorY = Math.sin(indicatorAngle * Math.PI / 180) * indicatorRadius;

  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
      <div
        ref={ref}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '1px solid var(--mk-ui-border)',
          backgroundColor: 'white',
          cursor: 'grab',
          position: 'relative',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Center dot */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: 'var(--mk-ui-text-primary)',
            pointerEvents: 'none',
          }}
        />
        {/* Angle indicator */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${indicatorX}px, ${indicatorY}px)`,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'white',
            border: '2px solid #333',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      </div>
    </div>
  );
};

// HuePicker component
const HuePicker: React.FC<{
  hue: number;
  onChange: (hue: number) => void;
  width?: number;
  height?: number;
}> = ({ hue, onChange, width = 200, height = 20 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateHue = (clientX: number) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const newHue = (x / rect.width) * 360;
      onChange(Math.max(0, Math.min(360, newHue)));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateHue(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateHue(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div style={{ position: 'relative', width: `${width}px`, height: `${height}px` }}>
      <div
        ref={ref}
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to right, #ff0000 0%, #ffff00 16.66%, #00ff00 33.33%, #00ffff 50%, #0000ff 66.66%, #ff00ff 83.33%, #ff0000 100%)',
          borderRadius: '4px',
          cursor: 'crosshair',
        }}
        onMouseDown={handleMouseDown}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: `${(hue / 360) * 100}%`,
          transform: 'translateX(-50%)',
          width: '4px',
          height: '100%',
          backgroundColor: 'white',
          border: '1px solid #666666',
          borderRadius: '2px',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

// SaturationLightnessCanvas component
const SaturationLightnessCanvas: React.FC<{
  hue: number;
  saturation: number;
  lightness: number;
  onChange: (saturation: number, lightness: number) => void;
  size?: number;
}> = ({ hue, saturation, lightness, onChange, size = 200 }) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newSaturation = (x / rect.width) * 100;
      
      // Calculate max lightness based on saturation:
      // 0% saturation = 100% max lightness (white at top-left)
      // 100% saturation = 50% max lightness (pure hue at top-right)
      const maxLightness = 100 - (newSaturation / 100) * 50;
      const newLightness = maxLightness - (y / rect.height) * maxLightness;
      
      onChange(
        Math.max(0, Math.min(100, newSaturation)),
        Math.max(0, Math.min(100, newLightness))
      );
    }
  };

  const rgb = hslToRgb(hue / 360, 1, 0.5);
  const hueColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={ref}
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: hueColor,
          borderRadius: '4px',
          cursor: 'crosshair',
        }}
        onClick={handleClick}
      >
        {/* Saturation gradient - white to transparent (left to right) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to right, #ffffff, transparent)',
            borderRadius: '4px',
          }}
        />
        {/* Lightness gradient - transparent to black (top to bottom) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, transparent, #000000)',
            borderRadius: '4px',
          }}
        />
        {/* Cursor */}
        <div
          style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            left: `${saturation}%`,
            top: `${(() => {
              const maxLightness = 100 - (saturation / 100) * 50;
              return ((maxLightness - lightness) / maxLightness) * 100;
            })()}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`
          }}
        />
      </div>
    </div>
  );
};

// ColorPaletteSelector component
const ColorPaletteSelector: React.FC<{
  superstate: Superstate;
  onColorSelect: (color: string) => void;
}> = ({ superstate, onColorSelect }) => {
  const [palettes, setPalettes] = useState<any[]>([]);

  useEffect(() => {
    // Load palettes from asset manager
    const colorPalettes = getColorPalettes(superstate);
    setPalettes(colorPalettes);
  }, [superstate]);

  // Use the palettes from state
  const displayPalettes = palettes;

  return (
    <div className="mk-color-palette-selector">
      {/* Display all color palettes (including gradients) */}
      {displayPalettes.length > 0 ? (
        displayPalettes.map((palette) => (
          <div key={palette.id} className="mk-palette-section">
            <div className="mk-palette-name">{palette.name}</div>
            <div className="mk-palette-colors">
              {palette.colors.map((color: any, index: number) => {
                const isGradient = color.value && (
                  color.value.includes('linear-gradient') || 
                  color.value.includes('radial-gradient') || 
                  color.value.includes('conic-gradient')
                );
                return (
                  <ColorSwatch
                    key={`${palette.id}-${index}`}
                    color={color.value}
                    name={color.name}
                    size="medium"
                    isGradient={isGradient}
                    onClick={() => onColorSelect(color.value)}
                  />
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="mk-palette-empty">{i18n.menu.noColorPalettesAvailable}</div>
      )}
    </div>
  );
};

export const ColorPicker = (props: {
  superstate: Superstate;
  color: string;
  hide?: () => void;
  saveValue: (color: string) => void;
  stayOpen?: boolean;
  allowGradient?: boolean;
  hidePaletteSelector?: boolean;
}) => {
  const [gradient, setGradient] = useState<Gradient | null>(null);
  const [selectedColorStop, setSelectedColorStop] = useState<string | null>(null);
  const [value, setValue] = useState(props.color ?? "#eb3b5a");
  const [currentColor, setCurrentColor] = useState<string>(value);
  const [mode, setMode] = useState<ColorMode>(props.hidePaletteSelector ? 'solid' : 'palettes');
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(50);
  const [lightness, setLightness] = useState(50);
  
  // Debounced save function to prevent excessive updates
  const debouncedSaveValue = useCallback(
    debounce((color: string) => {
      props.saveValue(color);
    }, 150),
    [props.saveValue]
  );
  
  const saveValue = (v: string) => {
    setCurrentColor(v);
    if (gradient && selectedColorStop) {
      const newGradient = { ...gradient };
      const stop = newGradient.values.find((f) => f.id == selectedColorStop);
      if (stop) {
        stop.color = v;
      }

      setGradient(newGradient);
      const gradientString = stringifyGradient(newGradient);

      setValue(gradientString);
      debouncedSaveValue(gradientString);
      return;
    }

    setValue(v);
    debouncedSaveValue(v);
  };
  
  const saveGradient = (v: Gradient) => {
    const gradientString = stringifyGradient(v);
    setValue(gradientString);
    debouncedSaveValue(gradientString);
  };
  
  const updateColor = (color: string) => {
    if (color) {
      setValue(color);
      setCurrentColor(color);
    }
    
    let gradientObject;
    
    // Try to parse as gradient first
    const isGradientString = color && (
      color.includes('linear-gradient(') || 
      color.includes('radial-gradient(') || 
      color.includes('conic-gradient(') ||
      color.includes('repeating-linear-gradient(') ||
      color.includes('repeating-radial-gradient(')
    );
    
    if (isGradientString) {
      try {
        gradientObject = parseGradient(color);
        if (gradientObject) {
          const values = gradientObject.values.map((g) => {
            const existingStop = gradient?.values.find(
              (f) => f.position == g.position && f.color == g.color
            );

            if (existingStop) {
              return { ...g, id: existingStop.id ?? uniqueId() };
            }
            return { ...g, id: uniqueId() };
          });

          gradientObject.values = values;
        }
      } catch (e) {
        gradientObject = null;
      }
    }

    if (gradientObject) {
      setGradient(gradientObject);
      setCurrentColor(gradientObject.values[0].color);
      setSelectedColorStop(gradientObject.values[0].id || null);
      setMode('gradient');
    } else {
      setGradient(null);
      setCurrentColor(color || '#000000');
      setMode(color === '' || color === 'transparent' ? 'none' : (props.hidePaletteSelector ? 'solid' : 'palettes'));
    }
  };
  
  useEffect(() => {
    updateColor(props.color);
  }, [props.color]);

  // Update HSL values when current color changes
  useEffect(() => {
    if (mode === 'solid' || (mode === 'gradient' && selectedColorStop)) {
      const rgb = hexToRgb(currentColor);
      if (rgb) {
        const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
        setHue(h);
        setSaturation(s);
        setLightness(l);
      }
    }
  }, [currentColor, mode, selectedColorStop]);

  useEffect(() => {
    const selectedStopColor = gradient?.values.find((f) => f.id == selectedColorStop)?.color;
    if (selectedStopColor && selectedStopColor !== currentColor) {
      setCurrentColor(selectedStopColor);
      
      // Update HSL values to match the selected stop's color
      const rgb = hexToRgb(selectedStopColor);
      if (rgb) {
        const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
        setHue(h);
        setSaturation(s);
        setLightness(l);
      }
    }
  }, [selectedColorStop, gradient]);

  return (
    <div className="mk-ui-color-picker-enhanced" style={{ width: '200px' }}>
      {/* Mode Selector */}
      <div className="mk-color-mode-selector">
        {([...(props.hidePaletteSelector ? [] : ['none']), ...(props.hidePaletteSelector ? [] : ['palettes']), 'solid', ...(props.allowGradient !== false ? ['gradient'] : [])] as ColorMode[]).map((modeOption) => {
          const isSelected = mode === modeOption;
          
          let backgroundStyle: React.CSSProperties = {};
          switch (modeOption) {
            case 'palettes':
              backgroundStyle = {
                background: `
                  linear-gradient(to right, #3b82f6 0% 50%, #ef4444 50% 100%),
                  linear-gradient(to right, #10b981 0% 50%, #f59e0b 50% 100%)
                `,
                backgroundSize: '100% 50%, 100% 50%',
                backgroundPosition: '0 0, 0 100%',
                backgroundRepeat: 'no-repeat',
              };
              break;
            case 'solid':
              backgroundStyle = {
                backgroundColor: currentColor || '#3b82f6',
              };
              break;
            case 'gradient':
              if (gradient && value) {
                backgroundStyle = {
                  backgroundImage: value,
                };
              } else {
                backgroundStyle = {
                  backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 196, 1.000) 0.000%, rgba(255, 97, 100, 1.000) 50.000%, rgba(176, 0, 18, 1.000) 100.000%)',
                };
              }
              break;
            case 'none':
              backgroundStyle = {};
              break;
          }

          return (
            <button
              key={modeOption}
              onClick={() => {
                setMode(modeOption);
                if (modeOption === 'none') {
                  debouncedSaveValue('');
                } else if (modeOption === 'solid' && gradient) {
                  setGradient(null);
                  debouncedSaveValue(currentColor);
                } else if (modeOption === 'gradient' && !gradient) {
                  const newGradient: Gradient = {
                    type: 'linear',
                    direction: '90deg',
                    values: [
                      {
                        id: uniqueId(),
                        color: currentColor || '#000000',
                        position: 0,
                      },
                      {
                        id: uniqueId(),
                        color: '#ffffff',
                        position: 100,
                      },
                    ],
                  };
                  setGradient(newGradient);
                  setSelectedColorStop(newGradient.values[0].id || null);
                  const gradientString = stringifyGradient(newGradient);
                  setValue(gradientString);
                  debouncedSaveValue(gradientString);
                }
              }}
              className={`mk-color-mode-button ${isSelected ? 'active' : ''}`}
              style={backgroundStyle}
            >
              {modeOption === 'none' && (
                <div className="mk-color-none-icon">
                  <svg width="100%" height="100%" viewBox="0 0 20 20">
                    <line x1="2" y1="2" x2="18" y2="18" stroke="#ef4444" strokeWidth="2" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Gradient Editor - show first in gradient mode */}
      {mode === 'gradient' && gradient && (
        <div className="mk-gradient-editor">
          {/* Controls Row: Angle Selector + Add/Remove Buttons */}
          <div className="mk-gradient-controls-row" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Circular Angle Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CircularAngleSelector
                angle={parseInt(gradient.direction?.replace('deg', '') || '90')}
                onChange={(angle) => {
                  const newGradient = { ...gradient };
                  newGradient.direction = `${angle}deg`;
                  setGradient(newGradient);
                  saveGradient(newGradient);
                }}
                size={40}
              />
            </div>
            
            {/* Icon Buttons */}
            <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
              {/* Add Stop Button */}
              <button
                onClick={() => {
                  const newGradient = { ...gradient };
                  newGradient.values.push({
                    id: uniqueId(),
                    color: currentColor || '#ffffff',
                    position: 50,
                  });
                  newGradient.values.sort((a, b) => a.position - b.position);
                  setGradient(newGradient);
                  saveGradient(newGradient);
                }}
                style={{
                  width: `${ICON_BUTTON_SIZE}px`,
                  height: `${ICON_BUTTON_SIZE}px`,
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--mk-ui-background)',
                  border: '1px solid var(--mk-ui-border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: 'var(--mk-ui-text-primary)'
                }}
                title="Add gradient stop"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Gradient Preview with Draggable Stops */}
          <div 
            className="mk-gradient-preview" 
            style={{ 
              background: `linear-gradient(to right, ${gradient.values
                .sort((a, b) => a.position - b.position)
                .map(stop => `${stop.color} ${stop.position}%`)
                .join(', ')})`,
              position: 'relative',
              height: '40px',
              borderRadius: '4px',
              margin: '8px 0',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              // Add new stop when clicking on empty area
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const position = (x / rect.width) * 100;
              
              // Check if clicking near an existing stop (threshold area)
              const isClickingStop = (e.target as HTMLElement).classList.contains('mk-gradient-stop');
              const thresholdDistance = 10; // 10% threshold around each stop
              const nearExistingStop = gradient.values.some(stop => 
                Math.abs(stop.position - position) <= thresholdDistance
              );
              
              if (!isClickingStop && !nearExistingStop) {
                const newGradient = { ...gradient };
                newGradient.values.push({
                  id: uniqueId(),
                  color: '#ffffff',
                  position: Math.max(0, Math.min(100, position)),
                });
                newGradient.values.sort((a, b) => a.position - b.position);
                setGradient(newGradient);
                saveGradient(newGradient);
              }
            }}
          >
            {/* Stop indicator lines */}
            {gradient.values.map((stop, i) => (
              <div
                key={`line-${stop.id || i}`}
                style={{
                  position: 'absolute',
                  left: `${stop.position}%`,
                  top: '0',
                  bottom: '0',
                  width: '1px',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              />
            ))}
            {/* Gradient stops */}
            {gradient.values.map((stop, i) => (
              <GradientStop
                key={stop.id || i}
                stop={stop as { id: string; color: string; position: number }}
                isSelected={selectedColorStop === stop.id}
                onSelect={() => stop.id && setSelectedColorStop(stop.id)}
                onMove={(newPosition) => {
                  const newGradient = { ...gradient };
                  const stopIndex = newGradient.values.findIndex(s => s.id === stop.id);
                  if (stopIndex >= 0) {
                    newGradient.values[stopIndex].position = newPosition;
                  }
                  setGradient(newGradient);
                  saveGradient(newGradient);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Color Canvas - only show for solid or gradient mode */}
      {(mode === 'solid' || mode === 'gradient') && (
        <div className="mk-color-canvas-section">
          {/* Saturation/Lightness Canvas */}
          <div className="mk-color-canvas-wrapper">
            <SaturationLightnessCanvas
              hue={hue}
              saturation={saturation}
              lightness={lightness}
              onChange={(s, l) => {
                setSaturation(s);
                setLightness(l);
                const rgb = hslToRgb(hue / 360, s / 100, l / 100);
                const hex = `#${rgb
                  .map((v) => Math.round(v).toString(16).padStart(2, '0'))
                  .join('')}`;
                saveValue(hex);
              }}
              size={200}
            />
          </div>
          
          {/* Hue Picker */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <HuePicker
              hue={hue}
              onChange={(h) => {
                setHue(h);
                const rgb = hslToRgb(h / 360, saturation / 100, lightness / 100);
                const hex = `#${rgb
                  .map((v) => Math.round(v).toString(16).padStart(2, '0'))
                  .join('')}`;
                saveValue(hex);
              }}
              width={200}
              height={20}
            />
          </div>
          
          {/* Current Color Display */}
          <div className="mk-color-current" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <ColorSwatch
              color={currentColor}
              size="large"
              onClick={() => {}}
            />
            <input
              type="text"
              value={currentColor}
              onChange={(e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                  saveValue(e.target.value);
                }
              }}
              className="mk-color-hex-input"
              placeholder="#000000"
              style={{ flex: 1, minWidth: 0 }}
            />
          </div>
          
          {/* Gradient Stop Controls - only show in gradient mode with selected stop */}
          {mode === 'gradient' && gradient && selectedColorStop && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', marginTop: '8px' }}>
              <input
                type="number"
                value={gradient.values.find(v => v.id === selectedColorStop)?.position || 0}
                onChange={(e) => {
                  const newPosition = parseFloat(e.target.value);
                  if (!isNaN(newPosition) && newPosition >= 0 && newPosition <= 100) {
                    const newGradient = { ...gradient };
                    const stopIndex = newGradient.values.findIndex(v => v.id === selectedColorStop);
                    if (stopIndex >= 0) {
                      newGradient.values[stopIndex].position = newPosition;
                      newGradient.values.sort((a, b) => a.position - b.position);
                      setGradient(newGradient);
                      saveGradient(newGradient);
                    }
                  }
                }}
                min="0"
                max="100"
                step="1"
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  border: '1px solid var(--background-modifier-border)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  minWidth: 0
                }}
                placeholder="0"
                title={i18n.menu.stopPosition}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>%</span>
              
              <button
                onClick={() => {
                  const newGradient = { ...gradient };
                  newGradient.values = newGradient.values.filter(v => v.id !== selectedColorStop);
                  if (newGradient.values.length > 0) {
                    setSelectedColorStop(newGradient.values[0].id);
                  }
                  setGradient(newGradient);
                  saveGradient(newGradient);
                }}
                disabled={gradient.values.length <= 2}
                style={{
                  width: `${ICON_BUTTON_SIZE}px`,
                  height: `${ICON_BUTTON_SIZE}px`,
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--mk-ui-background)',
                  border: '1px solid var(--mk-ui-border)',
                  borderRadius: '4px',
                  cursor: gradient.values.length <= 2 ? 'not-allowed' : 'pointer',
                  color: gradient.values.length <= 2 ? 'var(--mk-ui-text-tertiary)' : 'var(--mk-ui-text-primary)',
                  opacity: gradient.values.length <= 2 ? 0.5 : 1
                }}
                title={i18n.menu.removeSelectedGradientStop}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}


      {/* Color Palette Selector */}
      {!props.hidePaletteSelector && (mode === 'palettes' || mode === 'none') && (
        <ColorPaletteSelector
          superstate={props.superstate}
          onColorSelect={(color) => {
            if (color.startsWith('linear-gradient') || color.startsWith('radial-gradient') || color.startsWith('conic-gradient')) {
              // Override entire color with gradient
              setValue(color);
              debouncedSaveValue(color);
            } else {
              saveValue(color);
            }
          }}
        />
      )}

      {/* None Mode Display */}
      {!props.hidePaletteSelector && mode === 'none' && (
        <div className="mk-color-none-display">
          <div className="mk-color-none-text">{i18n.menu.noColor}</div>
          <div className="mk-color-none-desc">{i18n.menu.thisElementWillHaveNoColorApplied}</div>
        </div>
      )}
    </div>
  );
};

export const showColorPickerMenu = (
  superstate: Superstate,
  rect: Rect,
  win: Window,
  value: string,
  setValue: (color: string) => void,
  stayOpen?: boolean,
  isSubmenu?: boolean,
  hidePaletteSelector?: boolean
) => {
  return superstate.ui.openCustomMenu(
    rect,
    <ColorPicker
      superstate={superstate}
      color={value}
      saveValue={setValue}
      stayOpen={stayOpen}
      hidePaletteSelector={hidePaletteSelector}
    ></ColorPicker>,
    {},
    win,
    "bottom"
  );
};
