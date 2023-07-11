
export type ContextInfo = {
  type: "tag" | "folder" | 'space' | "unknown";
  sticker: string;
  banner: string;
  isRemote: boolean;
  readOnly: boolean;
  dbPath: string;
  contextPath: string;
};
