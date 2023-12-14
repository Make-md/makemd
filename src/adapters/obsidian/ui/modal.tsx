import { App, Modal } from "obsidian";
import React from "react";
import { createRoot } from "react-dom/client";

export class ObsidianModal extends Modal {
  constructor(
    app: App,
    public title: string,
    public fc: React.FC<{ hide: () => void }>
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;

    this.modalEl.toggleClass("mod-lg", true);

    this.titleEl.innerText = this.title;
    if (!this.title) {
      this.titleEl.setCssStyles({ display: "none" });
      (
        this.modalEl.querySelector(".modal-close-button") as HTMLElement
      ).setCssStyles({ display: "none" });
    }

    const queryEl = contentEl.createDiv("mk-modal");
    const root = createRoot(queryEl);
    root.render(<this.fc hide={() => this.close()}></this.fc>);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
