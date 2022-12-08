import {
  Modal,
  App,
  TFolder,
  TFile,
  TAbstractFile,
  FuzzySuggestModal,
} from "obsidian";
import MakeMDPlugin from "main";
import { createNewMarkdownFile } from "utils/utils";
import { SectionTree, eventTypes } from "types/types";
import t from "i18n";
type Action = "rename" | "create folder" | "create note";
type SectionAction = "rename" | "create";

export class VaultChangeModal extends Modal {
  file: TFolder | TFile | TAbstractFile;
  action: Action;
  plugin: MakeMDPlugin;
  section: number;

  constructor(
    plugin: MakeMDPlugin,
    file: TFolder | TFile | TAbstractFile,
    action: Action,
    section?: number
  ) {
    super(plugin.app);
    this.file = file;
    this.action = action;
    this.plugin = plugin;
    this.section = section;
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

    const updateSections = (sections: SectionTree[]) => {
      this.plugin.settings.spaces = sections;
      this.plugin.saveSettings();
    };

    const onClickAction = async () => {
      let newName = inputEl.value;
      if (this.action === "rename") {
        // Manual Rename Handler For md Files
        if (this.file.name.endsWith(".md")) newName = newName + ".md";
        this.app.fileManager.renameFile(
          this.file,
          this.file.parent.path + "/" + newName
        );
      } else if (this.action === "create folder") {
        const path = this.file.path + "/" + newName;
        this.app.vault.createFolder(path);
        if (this.section >= 0)
          updateSections(
            this.plugin.settings.spaces.map((s, k) => {
              return k == this.section
                ? {
                    ...s,
                    children: [newName, ...s.children],
                  }
                : s;
            })
          );
      } else if (this.action === "create note") {
        await createNewMarkdownFile(
          this.plugin.app,
          this.file as TFolder,
          newName,
          ""
        );
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
  fileOrFolderToMove: TFile | TFolder;

  constructor(app: App, fileOrFolderToMove: TFile | TFolder) {
    super(app);
    this.fileOrFolderToMove = fileOrFolderToMove;
  }

  getItemText(item: TFolder): string {
    return item.path;
  }

  getItems(): TFolder[] {
    return getAllFoldersInVault(this.app);
  }

  onChooseItem(item: TFolder, evt: MouseEvent | KeyboardEvent) {
    this.app.vault.rename(
      this.fileOrFolderToMove,
      item.path + "/" + this.fileOrFolderToMove.name
    );
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

export class SectionChangeModal extends Modal {
  section: string;
  sectionIndex: number;
  action: SectionAction;
  plugin: MakeMDPlugin;

  constructor(
    plugin: MakeMDPlugin,
    section: string,
    sectionIndex: number,
    action: SectionAction
  ) {
    super(plugin.app);
    this.section = section;
    this.sectionIndex = sectionIndex;
    this.action = action;
    this.plugin = plugin;
  }

  onOpen() {
    let { contentEl } = this;
    let myModal = this;

    // Header
    let headerText: string;

    if (this.action === "rename") {
      headerText = t.labels.renameSection;
    } else if (this.action === "create") {
      headerText = t.labels.createSection;
    }

    const headerEl = contentEl.createEl("div", { text: headerText });
    headerEl.addClass("modal-title");

    // Input El
    const inputEl = contentEl.createEl("input");

    inputEl.style.cssText = "width: 100%; height: 2.5em; margin-bottom: 15px;";
    if (this.action === "rename") {
      inputEl.value = this.section;
    }

    inputEl.focus();

    // Buttons
    let changeButtonText: string;

    if (this.action === "rename") {
      changeButtonText = t.buttons.rename;
    } else if (this.action === "create") {
      changeButtonText = t.buttons.createSection;
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

    const updateSections = (sections: SectionTree[]) => {
      this.plugin.settings.spaces = sections;
      this.plugin.saveSettings();
    };
    const onClickAction = async () => {
      let newName = inputEl.value;
      if (this.action === "rename") {
        updateSections(
          this.plugin.settings.spaces.map((s, i) => {
            return i == this.sectionIndex
              ? {
                  ...s,
                  section: newName,
                }
              : s;
          })
        );
      } else if (this.action === "create") {
        updateSections([
          { section: newName, children: [], collapsed: false },
          ...this.plugin.settings.spaces,
        ]);
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
