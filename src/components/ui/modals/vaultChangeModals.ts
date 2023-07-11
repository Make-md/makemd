import MakeMDPlugin from "main";
import {
  App,
  FuzzySuggestModal,
  Modal,
  Notice,
  TAbstractFile,
  TFile,
  TFolder
} from "obsidian";

import { default as i18n, default as t } from "i18n";
import { Space } from "schemas/spaces";
import {
  addPathsToSpace,
  insertSpaceItemAtIndex,
  moveAFileToNewParentAtIndex,
  removePathsFromSpace
} from "superstate/spacesStore/spaces";
import { FileMetadataCache } from "types/cache";
import { getAbstractFileAtPath, getAllFoldersInVault, renameFile } from "utils/file";
import { indexOfCharElseEOS } from "utils/strings";
type Action = "rename" | "create folder" | "create note";

export type SectionAction = "rename" | "create";

export class VaultChangeModal extends Modal {
  file: TFolder | TFile | TAbstractFile;
  action: Action;
  plugin: MakeMDPlugin;
  space: string;

  constructor(
    plugin: MakeMDPlugin,
    file: TFolder | TFile | TAbstractFile,
    action: Action,
    space?: string
  ) {
    super(plugin.app);
    this.file = file;
    this.action = action;
    this.plugin = plugin;
    this.space = space;
  }

  onOpen() {
    const { contentEl } = this;
    const myModal = this;

    // Header
    let headerText: string;

    if (this.action === "rename") {
      headerText = t.labels.rename;
    } else if (this.action === "create folder") {
      headerText = t.labels.createFolder;
    } else if (this.action === "create note") {
      headerText = t.labels.createNote;
    }

    const headerEl = contentEl.createEl("div", { text: headerText });
    headerEl.addClass("modal-title");

    // Input El
    const inputEl = contentEl.createEl("input");

    inputEl.style.cssText = "width: 100%; height: 2.5em; margin-bottom: 15px;";
    if (this.action === "rename") {
      if (this.file instanceof TFolder) {
        inputEl.value = this.file.name
      } else {
      inputEl.value = this.file.name.substring(
        0,
        indexOfCharElseEOS(".", this.file.name)
      );
      }
    }

    inputEl.focus();

    // Buttons
    let changeButtonText: string;

    if (this.action === "rename") {
      changeButtonText = t.buttons.rename;
    } else if (this.action === "create folder") {
      changeButtonText = t.buttons.createFolder;
    } else if (this.action === "create note") {
      changeButtonText = t.buttons.createNote;
    }

    const changeButton = contentEl.createEl("button", {
      text: changeButtonText,
    });

    const cancelButton = contentEl.createEl("button", {
      text: t.buttons.cancel,
    });
    cancelButton.style.cssText = "float: right;";
    cancelButton.addEventListener("click", () => {
      myModal.close();
    });

    const onClickAction = async () => {
      let newName = inputEl.value;
      if (this.action === "rename") {
        // Manual Rename Handler For md Files
        if (this.file instanceof TFile) {
        newName =
          this.file.name.lastIndexOf(".") == -1
            ? newName
            : newName +
              this.file.name.substring(this.file.name.lastIndexOf("."));
        }
        renameFile(this.plugin, this.file, newName);
      } else if (this.action === "create folder") {
        const path =
          !this.file || this.file.path == "/"
            ? newName
            : this.file.path + "/" + newName;
        if (getAbstractFileAtPath(app, path)) {
          new Notice(i18n.notice.folderExists);
          return;
        }
        this.app.vault.createFolder(path);
        if (this.space != "/") addPathsToSpace(this.plugin, this.space, [path]);
      }
      myModal.close();
    };

    // Event Listener
    changeButton.addEventListener("click", onClickAction);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") onClickAction();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export class MoveSuggestionModal extends FuzzySuggestModal<TFolder> {
  app: App;
  files: string[];

  constructor(app: App, files: string[]) {
    super(app);
    this.files = files;
  }

  getItemText(item: TFolder): string {
    return item.path;
  }

  getItems(): TFolder[] {
    return getAllFoldersInVault(this.app);
  }

  onChooseItem(item: TFolder, evt: MouseEvent | KeyboardEvent) {
    this.files.forEach((f) => {
      const file = getAbstractFileAtPath(app, f);
      if (file) {
        this.app.vault.rename(file, item.path + "/" + file.name);
      }
    });
  }
}


export class AddToSpaceModal extends FuzzySuggestModal<Space> {
  plugin: MakeMDPlugin;
  files: string[];

  constructor(plugin: MakeMDPlugin, files: string[]) {
    super(app);
    this.plugin = plugin;
    this.files = files;
  }

  getItemText(space: Space): string {
    return space.name;
  }

  getItems(): Space[] {
    return this.plugin.index.allSpaces().filter(f => f.def.type == 'focus');
  }

  onChooseItem(space: Space, evt: MouseEvent | KeyboardEvent) {
    
    this.files.forEach((f) => {
      const file = this.plugin.index.filesIndex.get(f);
      if (file) {
        if (space.def.folder?.length > 0) {
          moveAFileToNewParentAtIndex(this.plugin, file, space.def.folder, 0)
        } else {
          insertSpaceItemAtIndex(this.plugin, space.name, file.path, 0);
        }
        
      }
    });
  }
}

export class RemoveFromSpaceModal extends FuzzySuggestModal<Space> {
  plugin: MakeMDPlugin;
  file: FileMetadataCache;

  constructor(plugin: MakeMDPlugin, file: string) {
    super(app);
    this.plugin = plugin;
    this.file = this.plugin.index.filesIndex.get(file);
  }

  getItemText(space: Space): string {
    return space.name;
  }

  getItems(): Space[] {
    return this.file ? this.plugin.index.allSpaces().filter(f => f.def.type == 'focus' && !(f.def.folder?.length > 0) && this.file.spaces.includes(f.name)) : [];
  }

  onChooseItem(space: Space, evt: MouseEvent | KeyboardEvent) {
        removePathsFromSpace(this.plugin, space.name, [this.file.path]);
  }
}
