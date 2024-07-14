import { App, Modal } from "obsidian";
import React from "react";
import { Root } from "react-dom/client";
import { ObsidianUI } from "./ui";

export class ObsidianPalette extends Modal {
  ref: any;
  root: Root;
  constructor(
    app: App,
    public fc: React.FC<{ hide: () => void; ref: any }>,
    public className: string,
    public ui: ObsidianUI
  ) {
    super(app);
    this.ref = React.createRef();
  }

  onOpen() {
    this.contentEl.remove();
    this.modalEl.classList.add("prompt");
    this.modalEl.classList.remove("modal");
    this.modalEl.classList.add(this.className);

    this.titleEl.remove();
    this.modalEl.querySelector(".modal-close-button").remove();

    const keys = [...this.scope.keys];
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].key == "Escape") {
        this.scope.unregister(keys[i]);
        this.scope.register([], "Escape", () => {
          if (typeof this.ref?.current === "function") {
            const blurred = this.ref?.current();
            if (blurred) {
              this.close();
            }
          } else {
            this.close();
          }
        });
      }
    }
    this.root = this.ui.createRoot(this.modalEl);
    this.root.render(
      <this.fc hide={() => this.close()} ref={this.ref}></this.fc>
    );
  }

  onClose() {
    if (this.root) this.root.unmount();
    const { contentEl } = this;
    contentEl.innerHTML = "";
  }
}
