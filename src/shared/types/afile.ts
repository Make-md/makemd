import { PathLabel } from "./caches";

export type AFile = {
  path: string;
  name: string;
  filename: string;
  parent: string;
  isFolder: boolean;
  extension?: string;
    ctime?: number;
    mtime?: number;
    size?: number;
}

export type VaultItem = {
  path: string;
  parent: string;
  created: string;
  folder: string;
  rank?: string;
} & PathLabel;


