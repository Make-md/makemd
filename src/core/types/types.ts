



export const eventTypes = {

  frameSelected: "mkmd-active-frame",
  frameLayerSelected: "mkmd-frame-layer",
  refreshView: "mkmd-refresh-view",
  revealPath: "mkmd-reveal-file",
  collapseFolders: "mkmd-collapse-folders",
  toggleBacklinks: "mkmd-toggle-backlinks",
  metadataChange: "mkmd-tags-change",
  vaultChange: "mkmd-vault-change",
  mdbChange: "mkmd-mdb-change",
  spacesChange: "mkmd-spaces-change",
  frameChange: "mkmd-frame-change",
  updateSections: "mkmd-update-sections",
  settingsChanged: "mkmd-settings-changed",
};

export type VaultChange =
  | "create"
  | "delete"
  | "rename"
  | "modify"
  | "collapse";
export type SpaceChange = "sticker" | "space" | "vault" | "file" | "context" | 'frames';
export class ActivePathEvent {
    path: string;
    selection?: string;
    selectionType?: 'view' | 'row'
}
export class SelectionEvent {
  selection: string[];
}

export class SpaceChangeEvent extends Event {
  detail: {
    type: SpaceChange;
    action?: string,
    name?: string, 
    newName?: string

  };
}

export class CustomVaultChangeEvent extends Event {
  detail: {
    path: string;
    changeType: VaultChange;
    oldPath: string;
  };
}


