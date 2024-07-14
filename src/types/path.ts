
export type PathRefTypes = "frame" | "context" | 'action' | "unknown";

export type URI = {
  basePath: string;
  scheme: string;
  path: string;
  authority: string;

  fullPath: string;
  alias?: string;
  ref?: string;
  refStr?: string;
  refType?: PathRefTypes;
  query?: {[key: string]: string}
  isRemote?: boolean;
};export type TargetLocation = "split" | "window" | "tab" | "left" | "right" | 'system' | 'hover' | boolean;

