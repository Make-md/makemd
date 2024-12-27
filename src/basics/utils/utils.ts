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
