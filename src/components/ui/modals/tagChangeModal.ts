import MakeMDPlugin from "main";
import { Modal } from "obsidian";

import t from "i18n";
import { addTag, renameTag } from "utils/metadata/tags";
type Action = "rename" | "create tag";

export type SectionAction = "rename" | "create";

export class TagChangeModal extends Modal {
  action: Action;
  tag: string;
  plugin: MakeMDPlugin;

  constructor(plugin: MakeMDPlugin, action: Action, tag?: string) {
    super(plugin.app);
    this.action = action;
    this.plugin = plugin;
    this.tag = tag;
  }

  onOpen() {
    let { contentEl } = this;
    let myModal = this;

    // Header
    let headerText: string;

    if (this.action === "rename") {
      headerText = "Rename Tag";
    } else if (this.action === "create tag") {
      headerText = "New Tag";
    }

    const headerEl = contentEl.createEl("div", { text: headerText });
    headerEl.addClass("modal-title");

    // Input El
    const inputEl = contentEl.createEl("input");

    inputEl.style.cssText = "width: 100%; height: 2.5em; margin-bottom: 15px;";
    if (this.action === "rename") {
      // Manual Rename Handler For md Files

      inputEl.value = this.tag;
    }

    inputEl.focus();

    // Buttons
    let changeButtonText: string;

    if (this.action === "rename") {
      changeButtonText = "Rename Tag";
    } else if (this.action === "create tag") {
      changeButtonText = "Create Tag";
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
        renameTag(this.plugin, this.tag, newName);
      } else if (this.action === "create tag") {
        addTag(this.plugin, newName);
      }
      myModal.close();
    };

    // Event Listener
    changeButton.addEventListener("click", onClickAction);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onClickAction();
      }
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
