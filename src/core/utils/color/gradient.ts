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

export const parseGradient = (value: string): Gradient => {
    let type = null;
    let direction = null;
    const start = value.indexOf('(') + 1;
    const end = value.lastIndexOf(')');
    const gradients = value.substring(start, end);
    const values = gradients.split(/,(?![^(]*\)) /);

    if (!gradients) {
      return null;
    }

    if (values.length > 2) {
      direction = values.shift();
    }

    let typeFound = false;
    const types = ['repeating-linear', 'repeating-radial', 'linear', 'radial'];
    types.forEach(name => {
      if (value.indexOf(typeName(name)) > -1 && !typeFound) {
        typeFound = true;
        type = name;
      }
    })
    if (!type) {
      return null;
    }
return {
    type,
    direction,
    values: values.map(value => {
        const hdlValues = value.split(' ');
        const position = parseFloat(hdlValues.pop());
        const color = hdlValues.join('');
        return {
            position, color
        }
      })
}
}