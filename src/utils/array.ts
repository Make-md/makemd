export const insert = (arr: any[], index: number, newItem: any) => index <= 0 ? [
  newItem,
  ...arr,
] : [
  ...arr.slice(0, index),
  newItem,
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