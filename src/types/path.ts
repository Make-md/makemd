import { SpaceFragmentType } from "core/superstate/utils/spaces";

export type PathRefTypes = SpaceFragmentType | "unknown";

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
};export type TargetLocation = "split" | "overview" | "window" | "tab" | "left" | "right" | 'system' | 'hover' | boolean;

