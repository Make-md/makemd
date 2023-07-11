import "css/Blink.css";
import MakeMDPlugin from "main";
import { App, Modal } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import BlinkComponent from "./BlinkComponent";

export class Blink extends Modal {
  plugin: MakeMDPlugin;
  root: Root;
  previewPath: string;
  eventListeners: any[];
  ref: any;

  constructor(app: App, plugin: MakeMDPlugin) {
    super(app);
    //follow me and feast your eyes on the beauty of react
    this.ref = React.createRef();
    this.plugin = plugin;
    this.modalEl.toggleClass("mk-blink-modal", true);
    this.modalEl.toggleClass("modal", false);
    this.modalEl.toggleClass("prompt", true);
    const keys = [...this.scope.keys];
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].key == "Escape") {
        this.scope.unregister(keys[i]);
        this.scope.register([], "Escape", () => {
          const blurred = this.ref?.current();
          if (blurred) {
            this.close();
          }
        });
      }
    }

    this.root = createRoot(this.modalEl);
    this.root.render(
      <BlinkComponent
        ref={this.ref}
        plugin={plugin}
        hide={() => this.close()}
      ></BlinkComponent>
    );
  }
}
