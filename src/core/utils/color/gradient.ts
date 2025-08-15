export type Gradient = {
type: string,
direction: string,
values: GradientColorStop[],
}

export type GradientColorStop = {
    position: number,
    color: string
    id?: string,
}

const typeName = (name: string) => `${name}-gradient(`;

export const stringifyGradient = (gradient: Gradient): string => {
    let handlers = gradient.values;
    handlers.sort((l, r) => l.position - r.position);
    handlers = handlers.length == 1 ? [handlers[0], handlers[0]] : handlers;
    const color = handlers.map((handler) => `${handler.color} ${handler.position}%`).join(', ');

    const tp = gradient.type
    const defDir = ['top', 'left', 'bottom', 'right', 'center'];
    let ang = gradient.direction

    if (
      ['linear', 'repeating-linear'].indexOf(tp) >= 0
      && defDir.indexOf(ang) >= 0
    ) {
      ang = ang === 'center' ? 'to right' : `to ${ang}`;
    }

    if (
      ['radial', 'repeating-radial'].indexOf(tp) >= 0
      && defDir.indexOf(ang) >= 0
    ) {
      ang = `circle at ${ang}`;
    }

    return color ? `${tp}-gradient(${ang}, ${color})` : '';
}

export const parseGradient = (value: string): Gradient | null => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    let type = null;
    let direction = '90deg';
    
    // Find gradient type
    const types = ['repeating-linear', 'repeating-radial', 'linear', 'radial', 'conic'];
    for (const typeName of types) {
        if (value.includes(`${typeName}-gradient(`)) {
            type = typeName;
            break;
        }
    }

    if (!type) {
        return null;
    }

    const start = value.indexOf('(') + 1;
    const end = value.lastIndexOf(')');
    if (start === 0 || end === -1 || start >= end) {
        return null;
    }

    const content = value.substring(start, end).trim();
    if (!content) {
        return null;
    }

    // Split by commas, but not inside parentheses (for complex colors like rgba)
    const parts = [];
    let current = '';
    let parenDepth = 0;
    
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === '(') parenDepth++;
        if (char === ')') parenDepth--;
        
        if (char === ',' && parenDepth === 0) {
            parts.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim()) {
        parts.push(current.trim());
    }

    // Extract direction if present
    const firstPart = parts[0];
    const isDirectionPart = (part: string) => {
        return part.includes('deg') || 
               part.includes('to ') || 
               part.includes('at ') ||
               /^-?\d+deg$/.test(part.trim()) ||
               ['to top', 'to right', 'to bottom', 'to left', 'to top right', 'to top left', 'to bottom right', 'to bottom left'].includes(part.trim());
    };

    let colorParts = parts;
    if (firstPart && isDirectionPart(firstPart)) {
        direction = firstPart;
        colorParts = parts.slice(1);
    }

    // Parse color stops
    const values = [];
    for (const part of colorParts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        // Match color and percentage pattern
        const match = trimmed.match(/^(.+?)\s+(\d+(?:\.\d+)?)%\s*$/);
        if (match) {
            const [, color, positionStr] = match;
            const position = parseFloat(positionStr);
            if (!isNaN(position)) {
                values.push({
                    color: color.trim(),
                    position: position
                });
            }
        } else {
            // If no percentage, assume it's evenly distributed
            const color = trimmed;
            const positionValue: number = values.length === 0 ? 0 : 100;
            values.push({
                color: color,
                position: positionValue
            });
        }
    }

    // If we only have colors without positions, distribute them evenly
    if (values.length > 1 && values.every(v => v.position === 0 || v.position === 100)) {
        values.forEach((v, index) => {
            v.position = (index / (values.length - 1)) * 100;
        });
    }

    // Ensure we have at least 2 color stops
    if (values.length < 2) {
        if (values.length === 1) {
            values.push({
                color: '#ffffff',
                position: 100
            });
        } else {
            values.push(
                { color: '#000000', position: 0 },
                { color: '#ffffff', position: 100 }
            );
        }
    }

    return {
        type,
        direction,
        values: values.sort((a, b) => a.position - b.position)
    };
}