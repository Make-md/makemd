import { EditorView } from "@codemirror/view";
import { UniqueIdentifier } from "@dnd-kit/core";
import { TAbstractFile, TFile } from "obsidian";

export interface SectionTree {
  section: string;
  children: string[];
  collapsed: boolean;
  def?: string;
  sticker?: string;
}

export interface StringTree {
  node: string;
  children: StringTree[];
  isFolder: boolean;
}

export interface StringTreePath extends StringTree {
  path: string;
}

export interface FolderTree extends TAbstractFile {
  id?: UniqueIdentifier;
  isFolder: boolean;
}

export interface FlattenedTreeNode extends FolderTree {
  parentId: UniqueIdentifier | null;
  depth: number;
  index: number;
  section: number;
  selected?: boolean;
}

export const eventTypes = {
  selectedFileChange: "mkmd-selected-file-change",
  activeFileChange: "mkmd-active-file-change",
  refreshView: "mkmd-refresh-view",
  revealFile: "mkmd-reveal-file",
  tagsChange: "mkmd-tags-change",
  vaultChange: "mkmd-vault-change",
  mdbChange: "mkmd-mdb-change",
  spacesChange: "mkmd-spaces-change",
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
export type PortalType =
  | "none"
  | "doc"
  | "block"
  | "callout"
  | "flow"
  | "context";
export type SpaceChange = "sticker" | "space" | "vault";

export class SpaceChangeEvent extends Event {
  detail: {
    changeType: SpaceChange;
  };
}

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
    ref?: string;
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
