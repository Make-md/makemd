import MakeMDPlugin from "main";
import {
  App, FuzzySuggestModal, Modal, Notice, TAbstractFile, TFile, TFolder
} from "obsidian";

import t from "i18n";
import { getAbstractFileAtPath } from "utils/file";
import {
  addPathsToSpace} from "utils/spaces/spaces";
import i18n from "i18n";
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
    let { contentEl } = this;
    let myModal = this;

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
      // Manual Rename Handler For md Files
      if (this.file.name.endsWith(".md")) {
        inputEl.value = this.file.name.substring(
          0,
          this.file.name.lastIndexOf(".")
        );
      } else {
        inputEl.value = this.file.name;
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
        if (this.file.name.endsWith(".md")) newName = newName + ".md";
        this.app.fileManager.renameFile(
          this.file,
          this.file.parent.path == "/"
            ? newName
            : this.file.parent.path + "/" + newName
        );
      } else if (this.action === "create folder") {
        const path =
          !this.file || this.file.path == "/"
            ? newName
            : this.file.path + "/" + newName;
          if (getAbstractFileAtPath(app, path)) {
            new Notice(i18n.notice.folderExists)
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
    let { contentEl } = this;
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

function getAllFoldersInVault(app: App): TFolder[] {
  let folders: TFolder[] = [];
  let rootFolder = app.vault.getRoot();
  folders.push(rootFolder);
  function recursiveFx(folder: TFolder) {
    for (let child of folder.children) {
      if (child instanceof TFolder) {
        let childFolder: TFolder = child as TFolder;
        folders.push(childFolder);
        if (childFolder.children) recursiveFx(childFolder);
      }
    }
  }
  recursiveFx(rootFolder);
  return folders;
}


