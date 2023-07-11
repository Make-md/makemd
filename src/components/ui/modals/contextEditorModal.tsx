import { ContextBuilderView } from "components/ContextView/ContextBuilder/ContextBuilderView";
import { MDBProvider } from "components/ContextView/MDBContext";
import "css/ContextBuilder.css";
import { default as t } from "i18n";
import MakeMDPlugin from "main";
import { Modal } from "obsidian";
import React from "react";
import { createRoot } from "react-dom/client";
import { ContextInfo } from "types/contextInfo";

export class ContextEditorModal extends Modal {
  context: ContextInfo;
  view: string;
  plugin: MakeMDPlugin;

  constructor(plugin: MakeMDPlugin, context: ContextInfo, view: string) {
    super(plugin.app);
    this.context = context;
    this.view = view;
    this.plugin = plugin;
  }

  onOpen() {
    let { contentEl } = this;
    let myModal = this;
    myModal.modalEl.toggleClass("mk-context-maker", true);

    // Header
    let headerText: string;

    headerText = t.labels.contextMaker;

    // Input El

    const queryEl = contentEl.createDiv("mk-context-maker-container");
    const root = createRoot(queryEl);
    root.render(
      <MDBProvider
        plugin={this.plugin}
        context={this.context}
        schema={this.view}
      >
        <ContextBuilderView plugin={this.plugin}></ContextBuilderView>
      </MDBProvider>
    );
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
