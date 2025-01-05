import { Extension } from "@codemirror/state";
import { flowEditorInfo, toggleFlowEditor } from "basics/codemirror/flowEditor";
import { registerEditorMenus } from "basics/menus/registerMenus";
import MakeMDPlugin from "main";
import { App, Platform } from "obsidian";

import { getActiveCM } from "./codemirror";
import { Enactor } from "./enactor/enactor";
import { MakeMDEnactor } from "./enactor/makemd";
import { ObsidianEnactor } from "./enactor/obsidian";
import { loadFlowCommands } from "./flow/flowCommands";
import { replaceAllEmbed, replaceAllTables } from "./flow/markdownPost";
import {
  patchWorkspaceForFlow,
  patchWorkspaceLeafForFlow,
} from "./flow/patchWorkspaceForFlow";
import { toggleMark } from "./menus/inlineStylerView/marks";
import { Command } from "./types/command";
import { MakeBasicsSettings } from "./types/settings";

export default class MakeBasicsPlugin {
  public settings: MakeBasicsSettings;
  public extensions: Extension[];
  public commands: Command[];
  public app: App;
  public enactor: Enactor;
  constructor(public plugin: MakeMDPlugin) {
    this.settings = plugin.superstate.settings.basicsSettings;
    this.app = plugin.app;
    if (plugin.app.plugins.getPlugin("make-md")) {
      const mkmdEnactor = new MakeMDEnactor(
        plugin.app.plugins.getPlugin("make-md"),
        this
      );
      this.enactor = mkmdEnactor;
    } else {
      this.enactor = new ObsidianEnactor(this);
    }
  }

  isTouchScreen() {
    return Platform.isMobile;
  }

  toggleBold() {
    const cm = getActiveCM(this);
    if (cm) {
      cm.dispatch({
        annotations: toggleMark.of("strong"),
      });
    }
  }
  toggleEm() {
    const cm = getActiveCM(this);
    if (cm) {
      cm.dispatch({
        annotations: toggleMark.of("em"),
      });
    }
  }
  openFlow() {
    const cm = getActiveCM(this);
    if (cm) {
      const value = cm.state.field(flowEditorInfo, false);
      const currPosition = cm.state.selection.main;
      for (const flowEditor of value) {
        if (
          flowEditor.from < currPosition.to &&
          flowEditor.to > currPosition.from
        ) {
          cm.dispatch({
            annotations: toggleFlowEditor.of([flowEditor.id, 2]),
          });
        }
      }
    }
  }
  closeFlow() {
    const cm = getActiveCM(this);
    if (cm) {
      const value = cm.state.field(flowEditorInfo, false);
      const currPosition = cm.state.selection.main;
      for (const flowEditor of value) {
        if (
          flowEditor.from < currPosition.to &&
          flowEditor.to > currPosition.from
        ) {
          cm.dispatch({
            annotations: toggleFlowEditor.of([flowEditor.id, 0]),
          });
        }
      }
    }
  }

  loadBasics() {
    this.enactor.load();
    document.body.classList.toggle(
      "mk-mobile-sidepanel",
      this.settings.mobileSidepanel
    );
    document.body.classList.toggle(
      "mk-mobile-styler",
      this.settings.mobileMakeBar
    );
    registerEditorMenus(this);

    if (this.settings.editorFlow) {
      patchWorkspaceForFlow(this);
      patchWorkspaceLeafForFlow(this);
      document.body.classList.toggle(
        "mk-flow-replace",
        this.settings.editorFlow
      );
      document.body.classList.toggle(
        "mk-flow-" + this.settings.editorFlowStyle,
        true
      );

      this.plugin.registerMarkdownPostProcessor((element, context) => {
        const removeAllFlowMarks = (el: HTMLElement) => {
          const embeds = el.querySelectorAll(".internal-embed.markdown-embed");

          for (let index = 0; index < embeds.length; index++) {
            const embed = embeds.item(index);
            if (
              embed.previousSibling &&
              embed.previousSibling.textContent.slice(-1) == "!"
            )
              embed.previousSibling.textContent =
                embed.previousSibling.textContent.slice(0, -1);
          }
        };
        removeAllFlowMarks(element);
        replaceAllTables(this, element, context);
        replaceAllEmbed(element, context, this, this.app);
      });
      loadFlowCommands(this);
    }
    this.reloadExtensions(true);
  }
  reloadExtensions(firstLoad: boolean) {
    this.enactor.loadExtensions(firstLoad);
  }
}
