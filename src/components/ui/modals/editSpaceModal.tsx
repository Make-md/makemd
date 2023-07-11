import SpaceEditor from "components/Spaces/SpaceEditor";
import { default as i18n, default as t } from "i18n";
import MakeMDPlugin from "main";
import { Modal, Notice } from "obsidian";
import React from "react";
import { createRoot } from "react-dom/client";
import { Space } from "schemas/spaces";
import { insertSpaceAtIndex, saveSpace } from "superstate/spacesStore/spaces";
import { SectionAction } from "./vaultChangeModals";

export class EditSpaceModal extends Modal {
  space: Space;
  action: SectionAction;
  plugin: MakeMDPlugin;
  ref: any;

  constructor(plugin: MakeMDPlugin, space: Space, action: SectionAction) {
    super(plugin.app);
    this.space = space;
    this.action = action;
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;

    // Header
    let headerText: string;

    if (this.action === "rename") {
      if (this.space.def.type == "smart") {
        headerText = t.labels.renameSectionSmart;
      } else {
        headerText = t.labels.renameSection;
      }
      headerText = t.labels.renameSection;
    } else if (this.action === "create") {
      if (this.space.def.type == "smart") {
        headerText = t.labels.createSectionSmart;
      } else {
        headerText = t.labels.createSection;
      }
    }

    const headerEl = contentEl.createEl("div", { text: headerText });
    headerEl.addClass("modal-title");

    // Input El
    const inputEl = contentEl.createEl("input");

    inputEl.style.cssText = "width: 100%; height: 2.5em; margin-bottom: 15px;";
    if (this.action === "rename") {
      inputEl.value = this.space.name;
    }

    inputEl.focus();

    const queryEl = contentEl.createDiv("mk-space-query");
    const root = createRoot(queryEl);
    this.ref = React.createRef();
    root.render(
      <SpaceEditor
        plugin={this.plugin}
        def={this.space.def}
        ref={this.ref}
      ></SpaceEditor>
    );

    // Buttons
    let changeButtonText: string;

    if (this.action === "rename") {
      changeButtonText = t.buttons.saveSpace;
    } else if (this.action === "create") {
      changeButtonText = t.buttons.saveSpace;
    }

    const changeButton = contentEl.createEl("button", {
      text: changeButtonText,
    });

    const cancelButton = contentEl.createEl("button", {
      text: t.buttons.cancel,
    });
    cancelButton.style.cssText = "float: right;";
    cancelButton.addEventListener("click", () => {
      this.close();
    });

    const onClickAction = async () => {
      const newName = inputEl.value.replace(/\//g, "");
      if (newName.length == 0) {
        new Notice(i18n.notice.newSpaceName);
        return;
      }
      if (
        this.plugin.index.spacesIndex.has(newName) &&
        newName != this.space.name
      ) {
        new Notice(i18n.notice.duplicateSpaceName);
        return;
      }
      if (this.action === "rename") {
        saveSpace(this.plugin, this.space.name, {
          ...this.space,
          def: this.ref.current,
          name: newName,
        });
      } else if (this.action === "create") {
        insertSpaceAtIndex(
          this.plugin,
          { name: newName, pinned: "home", def: this.ref.current },
          0
        );
      }
      this.close();
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
