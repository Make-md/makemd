export const insert = (arr: any[], index: number, newItem: any) => !index || index <= 0 ? [
  newItem,
  ...arr,
] : [
  ...arr.slice(0, index),
  newItem,
  ...arr.slice(index),
];

export const insertMulti = (arr: any[], index: number, newItem: any[]) => !index || index <= 0 ? [
  ...newItem,
  ...arr,
] : [
  ...arr.slice(0, index),
  ...newItem,
  ...arr.slice(index),
];

export const uniq = (a: any[]) => [...new Set(a)];
export const uniqCaseInsensitive = (a: string[]) => [
  ...new Map(a.map((s) => [s.toLowerCase(), s])).values(),
];
export const uniqueNameFromString = (name: string, cols: string[]) => {
  let newName = name;
  if (cols.includes(newName)) {
    let append = 1;
    while (cols.includes(newName)) {
      newName = name + append.toString();
      append += 1;
    }
  }
  return newName;
};
export const onlyUniqueProp =
  (prop: string) => (value: any, index: number, self: any[]) => {
    return self.findIndex((v) => value[prop] == v[prop]) === index;
  };

export const onlyUniquePropCaseInsensitive =
  (prop: string) => (value: any, index: number, self: any[]) => {
    return (
      self.findIndex(
        (v) => value[prop].toLowerCase() == v[prop].toLowerCase()
      ) === index
    );
  };

  
  export const orderStringArrayByArray = (array: string[], order: string[]) =>{
  
    return array.sort( function (a, b) {
      const A = order.indexOf(a), B = order.indexOf(b);
      
      if (A > B) {
        if (A != -1 && B == -1) {
          return -1
        }
        return 1;
      } else {
        if (B != -1 && A == -1) {
          return 1
        }
        return -1;
      }
      
    });
    
  };

  
  export const orderArrayByArrayWithKey = (array: any[], order: string[], key: string) =>{
  
    return array.sort( function (a, b) {
      const A = order.indexOf(a[key]), B = order.indexOf(b[key]);
      
      if (A > B) {
        if (A != -1 && B == -1) {
          return -1
        }
        return 1;
      } else {
        if (B != -1 && A == -1) {
          return 1
        }
        return -1;
      }
      
    });
    
  };