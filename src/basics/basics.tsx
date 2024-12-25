import { Extension } from "@codemirror/state";
import { openPath } from "adapters/obsidian/utils/file";
import { flowEditorInfo, toggleFlowEditor } from "basics/codemirror/flowEditor";
import { registerEditorMenus } from "basics/menus/registerMenus";
import { defaultMenu } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { showLinkMenu } from "core/react/components/UI/Menus/properties/linkMenu";
import { showSpacesMenu } from "core/react/components/UI/Menus/properties/selectSpaceMenu";
import ImageModal from "core/react/components/UI/Modals/ImageModal";
import {
  SpaceFragmentSchema,
  uriToSpaceFragmentSchema,
} from "core/superstate/utils/spaces";
import { createTable } from "core/utils/createTable";
import { mdbSchemaToFrameSchema } from "core/utils/frames/nodes";
import MakeMDPlugin from "main";
import { SelectOption, Superstate } from "makemd-core";
import { App, Platform, TFile } from "obsidian";
import React from "react";
import { getLineRangeFromRef } from "shared/getLineRangeFromRef";
import { openPathInElement } from "shared/openPathInElement";
import { editableRange } from "shared/selectiveEditor";
import { windowFromDocument } from "utils/dom";
import { cmExtensions } from "./cmExtensions";
import { getActiveCM } from "./codemirror";
import { loadFlowCommands } from "./flow/flowCommands";
import { replaceAllEmbed, replaceAllTables } from "./flow/markdownPost";
import {
  patchWorkspaceForFlow,
  patchWorkspaceLeafForFlow,
} from "./flow/patchWorkspaceForFlow";
import { toggleMark } from "./menus/inlineStylerView/marks";
import { replaceMobileMainMenu } from "./mobile/replaceMobileMainMenu";
import { DEFAULT_SETTINGS } from "./schemas/settings";
import { MakeBasicsSettings } from "./types/settings";

export default class MakeBasicsPlugin {
  public settings: MakeBasicsSettings;
  public extensions: Extension[];
  public superstate: Superstate;
  public app: App;
  constructor(public plugin: MakeMDPlugin) {
    this.settings = plugin.superstate.settings.basicsSettings;
    this.superstate = plugin.superstate;
    this.app = plugin.app;
  }
  async convertSpaceFragmentToMarkdown(
    spaceFragment: SpaceFragmentSchema,
    onReturn: (markdown: string) => void
  ) {
    if (spaceFragment.type == "frame") {
      const schema = await this.superstate.spaceManager
        .readFrame(spaceFragment.path, spaceFragment.id)
        .then((f) => f?.schema);

      if (schema) {
        const mdbSchema = mdbSchemaToFrameSchema(schema);
        this.superstate.spaceManager
          .readTable(spaceFragment.path, mdbSchema.def.db)
          .then((mdbTable) => {
            if (!mdbTable) return;
            const markdown = createTable(mdbTable.rows, mdbTable.cols);
            onReturn(markdown);
          });
      }
    } else {
      this.superstate.spaceManager
        .readTable(spaceFragment.path, spaceFragment.id)
        .then((mdbTable) => {
          if (!mdbTable) return;
          const markdown = createTable(mdbTable.rows, mdbTable.cols);
          onReturn(markdown);
        });
    }
  }
  selectLink(e: React.MouseEvent, onSelect: (path: string) => void) {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    return showLinkMenu(
      offset,
      windowFromDocument(e.view.document),
      this.superstate,
      onSelect
    );
  }
  selectSpace(e: React.MouseEvent, onSelect: (path: string) => void) {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    return showSpacesMenu(
      offset,
      windowFromDocument(e.view.document),
      this.superstate,
      onSelect
    );
  }
  selectImage(onSelect: (path: string) => void, win: Window) {
    this.superstate.ui.openPalette(
      <ImageModal
        superstate={this.superstate}
        selectedPath={(image) => {
          onSelect(image);
        }}
      ></ImageModal>,
      win
    );
  }
  isSpace(path: string) {
    return this.superstate.spacesIndex.has(path);
  }
  spaceNotePath(path: string) {
    return this.superstate.spacesIndex.get(path)?.space.notePath;
  }
  createNote(parent: string, name: string, content?: string) {
    return this.superstate.spaceManager.createItemAtPath(
      parent,
      "md",
      name,
      content
    );
  }
  createRoot(el: Element | DocumentFragment) {
    return this.superstate.ui.createRoot(el);
  }
  notify(message: string) {
    return this.superstate.ui.notify(message);
  }
  uriByString(uri: string, source?: string) {
    return this.superstate.spaceManager.uriByString(uri, source);
  }
  spaceFragmentSchema(uri: string) {
    return uriToSpaceFragmentSchema(this.superstate, uri);
  }
  isTouchScreen() {
    return Platform.isMobile;
  }
  saveSettings() {
    this.plugin.superstate.settings.basicsSettings = this.settings;
    this.plugin.saveSettings();
  }
  openMenu(ev: React.MouseEvent, options: SelectOption[]) {
    const offset = (ev.target as HTMLElement).getBoundingClientRect();
    return this.superstate.ui.openMenu(
      offset,
      defaultMenu(this.superstate.ui, options),
      windowFromDocument(ev.view.document)
    );
    return;
    // const menu = new Menu();
    // for (const option of options) {
    //   menu.addItem((item) => {
    //     item.setTitle(option.name);
    //     item.onClick((e) => option.onClick(e));
    //   });
    // }
    // menu.showAtMouseEvent(ev);
  }
  openPath(path: string, source?: HTMLElement) {
    const uri = this.uriByString(path);
    openPathInElement(
      this.plugin.app,
      this.plugin.app.workspace.getLeaf(), // workspaceLeafForDom(this.plugin.app, source),
      source,
      null,
      async (editor) => {
        const leaf = editor.attachLeaf();
        if (
          this.plugin.app.vault.getAbstractFileByPath(uri.basePath) instanceof
          TFile
        ) {
          await leaf.openFile(
            this.plugin.app.vault.getAbstractFileByPath(uri.basePath) as TFile
          );
          const selectiveRange = getLineRangeFromRef(
            uri.basePath,
            uri.refStr,
            this.plugin.app
          );
          if (!leaf.view?.editor) {
            return;
          }

          if (selectiveRange[0] && selectiveRange[1]) {
            leaf.view.editor?.cm.dispatch({
              annotations: [editableRange.of(selectiveRange)],
            });
          }
        } else {
          await openPath(leaf, path, this.plugin, true);
        }
      }
    );
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
  resolvePath(path: string, source?: string) {
    return this.superstate.spaceManager.resolvePath(path, source);
  }
  loadBasics() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      this.superstate.settings,
      this.superstate.settings.basicsSettings
    );
    document.body.classList.toggle(
      "mk-mobile-sidepanel",
      this.settings.mobileSidepanel
    );
    document.body.classList.toggle(
      "mk-mobile-styler",
      this.settings.mobileMakeBar
    );
    if (this.settings.mobileSidepanel) {
      this.app.workspace.onLayoutReady(async () => {
        replaceMobileMainMenu(this);
      });
    }
    if (this.settings.makerMode) {
      registerEditorMenus(this);
    }
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
    this.extensions = cmExtensions(this, this.isTouchScreen());
    if (firstLoad) {
      this.plugin.registerEditorExtension(this.extensions);
    } else {
      this.app.workspace.updateOptions();
    }
  }
}
