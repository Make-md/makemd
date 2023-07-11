//https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map


export const safelyParseJSON = (json: string) => {
    // This function cannot be optimised, it's best to
    // keep it small!
    var parsed;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      //
      // Oh well, but whatever...
    }
  
    return parsed; // Could be undefined!
  };
  
export const jsonMapReplacer = (key: string, value: any) => {
    if(value instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(value.entries()), // or with spread: value: [...value]
      };
    } else {
      return value;
    }
  }
  
  export const jsonMapReviver = (key: string, value: any) => {
    if(typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  }