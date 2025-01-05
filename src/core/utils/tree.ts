


export const nodeIsAncestorOfTarget = (path: string, target: string) => {

  return target.startsWith(path);
  return false;
  
};

// Helper Function to Create Folder Tree


export const compareByFieldDeep =
  (field: (obj: Record<string, any>) => string, dir: boolean) =>
  (_a: Record<string, any>, _b: Record<string, any>) => {
    const a = dir ? _a : _b;
    const b = dir ? _b : _a;

    if (field(a) < field(b)) {
      return -1;
    }
    if (field(a) > field(b)) {
      return 1;
    }
    return 0;
  };


export const compareByField =
  (field: string, dir: boolean) =>
  (_a: Record<string, any>, _b: Record<string, any>) => {
    const a = dir ? _a : _b;
    const b = dir ? _b : _a;
    if (a[field] < b[field]) {
      return -1;
    }
    if (a[field] > b[field]) {
      return 1;
    }
    return 0;
  };

export const compareByFieldCaseInsensitive =
  (field: string, dir: boolean) =>
  (_a: Record<string, any>, _b: Record<string, any>) => {
    const a = dir ? _a : _b;
    const b = dir ? _b : _a;
    return a[field]?.toLowerCase().localeCompare(b[field]?.toLowerCase(), undefined, {
      numeric: true,
  })
  };


export const compareByFieldNumerical = (field: string, dir: boolean) => (_a: Record<string, any>, _b: Record<string, any>) => {
  const a = dir ? _a : _b;
  const b = dir ? _b : _a;
  return (+a[field]) - (+b[field]);
}