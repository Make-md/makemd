import i18n from "i18n";
import MakeMDPlugin from "main";
import { Modal, TFile } from "obsidian";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { MDBField } from "types/mdb";
import { allTagsForFile } from "utils/metadata/tags";
import { showSelectMenu } from "../menus/menuItems";

export class MovePropertyModal extends Modal {
  plugin: MakeMDPlugin;
  syncProperty: (property: MDBField, table: string) => void;
  property: MDBField;
  file: TFile;

  constructor(
    plugin: MakeMDPlugin,
    syncProperty: (property: MDBField, table: string) => void,
    property: MDBField,
    file: TFile
  ) {
    super(plugin.app);
    this.plugin = plugin;
    this.file = file;
    let closeButton = this.modalEl.querySelector(
      ".modal-close-button"
    ) as HTMLElement;
    closeButton.style.display = "none";
    this.syncProperty = syncProperty;
    this.property = property;
  }

  onOpen() {
    let { contentEl } = this;
    let myModal = this;

    // Header
    let headerText: string;

    const headerEl = contentEl.createEl("div", { text: headerText });
    headerEl.addClass("modal-title");
    headerEl.innerHTML = i18n.labels.syncMetadata;

    // Input El

    const root = createRoot(contentEl);
    root.render(
      <MovePropertyComponent
        plugin={this.plugin}
        syncProperty={this.syncProperty}
        close={() => this.close()}
        property={this.property}
        file={this.file}
      ></MovePropertyComponent>
    );
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}

export const MovePropertyComponent = (props: {
  plugin: MakeMDPlugin;
  syncProperty: (property: MDBField, table: string) => void;
  close: () => void;
  property: MDBField;
  file: TFile;
}) => {
  const { plugin } = props;

  const [table, setTable] = useState("");
  const saveContexts = (_: string[], value: string[]) => {
    setTable(value[0]);
  };

  const showContextMenu = async (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const tags = allTagsForFile(props.file);
    showSelectMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        multi: false,
        editable: false,
        value: [],
        options: [
          { name: props.file.parent.name, value: "" },
          ...tags.map((m) => ({ name: m, value: m })),
        ],
        saveOptions: saveContexts,
        placeholder: i18n.labels.tagItemSelectPlaceholder,
        searchable: false,
        showAll: true,
      }
    );
  };
  const sync = () => {
    props.syncProperty(props.property, table);
    props.close();
  };
  return (
    <div className="modal-content">
      <div className="setting-item setting-item-heading">
        {i18n.labels.syncProperties}
      </div>
      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">{i18n.labels.selectContext}</div>
          <div className="setting-item-description">
            {i18n.descriptions.selectContext}
          </div>
        </div>
        <div className="setting-item-control">
          <button onClick={(e) => showContextMenu(e)}>
            {table == "" ? i18n.buttons.currentFolder : table}
          </button>
        </div>
      </div>

      <button style={{ marginRight: 8 }} onClick={() => sync()}>
        {i18n.buttons.sync}
      </button>
      <button onClick={() => props.close()}>{i18n.buttons.cancel}</button>
    </div>
  );
};
