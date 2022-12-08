import { TFolder, TFile } from "obsidian";
import { UniqueIdentifier } from "@dnd-kit/core";
import { EditorView } from '@codemirror/view'

export interface SectionTree {
  section: string;
  children: string[];
  collapsed: boolean;
}

export interface StringTree {
  node: string;
  children: StringTree[];
  isFolder: boolean;
}

export interface StringTreePath extends StringTree {
  path: string;
}

export interface FolderTree extends TFolder {
  id: UniqueIdentifier;
  isFolder: boolean;
}

export interface FlattenedTreeNode extends FolderTree {
  parentId: UniqueIdentifier | null;
  depth: number;
  index: number;
  section: number;
}

export const eventTypes = {
  activeFileChange: "mkmd-active-file-change",
  refreshView: "mkmd-refresh-view",
  revealFile: "mkmd-reveal-file",
  vaultChange: "mkmd-vault-change",
  updateSections: "mkmd-update-sections",
  settingsChanged: "mkmd-settings-changed",
  spawnPortal: "mkmd-portal-spawn",
  loadPortal: "mkmd-portal-load",
  openFilePortal: "mkmd-portal-file",
  focusPortal: "mkmd-portal-focus",
};

export type VaultChange =
  | "create"
  | "delete"
  | "rename"
  | "modify"
  | "collapse";
export type PortalType = "none" | "doc" | "block" | "callout" | "flow";

export class CustomVaultChangeEvent extends Event {
  detail: {
    file: TFile;
    changeType: VaultChange;
    oldPath: string;
  };
}

export class LoadPortalEvent extends Event {
  detail: {
    el: HTMLElement;
    view: EditorView;
    id: string;
  };
}

export class SpawnPortalEvent extends Event {
  detail: {
    el: HTMLElement;
    file: string;
    from?: number;
    to?: number;
    type: PortalType;
    id: string;
  };
}

export class OpenFilePortalEvent extends Event {
  detail: {
    file: string;
    source: string;
  };
}

export class FocusPortalEvent extends Event {
  detail: {
    id: string;
    parent: boolean;
    top: boolean;
  };
}

export type TransactionRange = {
  from: number;
  to: number;
};
