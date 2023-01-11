import MakeMDPlugin from "main";
import { Modal, Notice } from "obsidian";
import t from "i18n";
import {
  insertSpaceAtIndex,
  renameSpace,
  retrieveSpaces
} from "utils/spaces/spaces";
import { SectionAction } from "./vaultChangeModals";
import i18n from "i18n";


export class EditSpaceModal extends Modal {
  space: string;
  action: SectionAction;
  plugin: MakeMDPlugin;

  constructor(plugin: MakeMDPlugin, space: string, action: SectionAction) {
    super(plugin.app);
    this.space = space;
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
      inputEl.value = this.space;
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

    const onClickAction = async () => {
      let newName = inputEl.value.replace(/\//g, "");
      if (newName.length == 0) {
        new Notice(i18n.notice.newSpaceName);
        return;
      }
      if (retrieveSpaces(this.plugin).find((f) => f.name == newName)) {
        new Notice(i18n.notice.duplicateSpaceName);
        return;
      }
      if (this.action === "rename") {
        renameSpace(this.plugin, this.space, newName);
      } else if (this.action === "create") {
        insertSpaceAtIndex(this.plugin, newName, false, 0);
      }
      myModal.close();
    };

    // Event Listener
    changeButton.addEventListener("click", onClickAction);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter")
        onClickAction();
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
