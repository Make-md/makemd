export const applySat = (sat: number, color: string) => {
    const hash = color.substring(0, 1) === '#';
  
    const hex = (hash ? color.substring(1) : color).split('');
  
    const long = hex.length > 3;
    const rgb = [];
    let i = 0;
    const len = 3;
  
    rgb.push(hex.shift() + (long ? hex.shift() : ''));
    rgb.push(hex.shift() + (long ? hex.shift() : ''));
    rgb.push(hex.shift() + (long ? hex.shift() : ''));
  
    for (; i < len; i++) {
      if (!long) {
        rgb[i] += rgb[i];
      }
  
      rgb[i] = Math.round((parseInt(rgb[i], 16) / 100) * sat).toString(16);
  
      rgb[i] += rgb[i].length === 1 ? rgb[i] : '';
    }
  
    return (hash ? '#' : '') + rgb.join('');
  };
  