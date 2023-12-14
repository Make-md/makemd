import { App, Modal } from "obsidian";
import React from "react";
import { createRoot } from "react-dom/client";

export class ObsidianPalette extends Modal {
  ref: any;
  constructor(
    app: App,
    public fc: React.FC<{ hide: () => void; ref: any }>,
    public className: string
  ) {
    super(app);
    this.ref = React.createRef();
  }

  onOpen() {
    const { contentEl } = this;

    this.modalEl.toggleClass("prompt", true);
    this.modalEl.toggleClass("modal", false);
    this.modalEl.toggleClass(this.className, true);

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
    const root = createRoot(this.modalEl);
    root.render(<this.fc hide={() => this.close()} ref={this.ref}></this.fc>);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
