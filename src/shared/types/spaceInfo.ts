
export type FilesystemSpaceInfo = SpaceInfo & {
  folderPath: string;
  dbPath: string;
  framePath: string;
  commandsPath: string;
};

export type SpaceInfo = {
  name: string;
  path: string;
  isRemote: boolean;
  readOnly: boolean;
  defPath: string;
  notePath: string;
};
