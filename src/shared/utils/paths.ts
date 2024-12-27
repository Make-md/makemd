



export const removeTrailingSlashFromFolder = (path: string) => path == "/"
  ? path
  : path.slice(-1) == "/"
    ? path.substring(0, path.length - 1)
    : path;
