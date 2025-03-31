import { getAbstractFileAtPath } from "adapters/obsidian/utils/file";
import { transformPath } from "core/export/treeHelpers";
import MakeMDPlugin from "main";
import { FileView, TFile, ViewStateResult, WorkspaceLeaf } from "obsidian";
export const HTML_FILE_VIEWER_TYPE = "mk-html-view";
export const ICON = "sheets-in-box";

export class HTMLFileViewer extends FileView {
  plugin: MakeMDPlugin;
  navigation = true;
  observer: MutationObserver;

  constructor(leaf: WorkspaceLeaf, plugin: MakeMDPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return HTML_FILE_VIEWER_TYPE;
  }

  getDisplayText(): string {
    return this.file?.name;
  }

  async onClose() {
    this.destroy();
  }

  destroy() {
    this.observer?.disconnect();
  }

  async onOpen(): Promise<void> {
    this.destroy();
  }

  async setState(state: any, result: ViewStateResult): Promise<void> {
    this.file = getAbstractFileAtPath(this.plugin.app, state.file) as TFile;
    this.loadFile(this.file);
    await super.setState(state, result);
    this.leaf.tabHeaderInnerTitleEl.innerText = this.file.name;
    //@ts-ignore
    this.leaf.view.titleEl = this.file.name;
    const headerEl = this.leaf.view.headerEl;
    if (headerEl) {
      //@ts-ignore
      headerEl.querySelector(".view-header-title").innerText = this.file.name;
    }
    result.history = true;
    return;
  }
  getState(): any {
    const state = super.getState();
    state.file = this.file?.path;
    // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file

    return state;
  }

  openPathInViewer = async (path: string) => {
    const htmlPath = transformPath(
      this.plugin.superstate,
      path,
      this.file.parent.path,
      true
    );
    if (getAbstractFileAtPath(this.plugin.app, htmlPath)) {
      this.plugin.superstate.ui.openPath(htmlPath);
      return;
    }
    const resolvedPath = this.plugin.superstate.spaceManager.resolvePath(
      path,
      this.file.path
    );
    this.plugin.superstate.ui.openPath(resolvedPath);
  };

  async loadFile(file: TFile) {
    const htmlString = await this.plugin.app.vault.read(file);
    const iframe = document.createElement("iframe");
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.srcdoc = htmlString;
    this.contentEl.empty();
    this.contentEl.appendChild(iframe);
    iframe.style.pointerEvents = "none";
    iframe.addEventListener(
      "load",
      (evt) => {
        iframe.style.pointerEvents = "auto";
        iframe.contentDocument
          ?.querySelector("html")
          .setAttribute("style", "width: 100%; height: 100%");
        const title = iframe.contentDocument.querySelector("title");
        if (title) {
          this.leaf.tabHeaderInnerTitleEl.innerText = title.innerText;
          //@ts-ignore
          this.leaf.view.titleEl = title.innerText;
          const headerEl = this.leaf.view.headerEl;
          if (headerEl) {
            //@ts-ignore
            headerEl.querySelector(".view-header-title").innerText =
              title.innerText;
          }
        }
        const divs = iframe.contentDocument.querySelectorAll("div");
        divs.forEach((div: HTMLElement) => {
          // If the href attribute ends with .md
          const style = div.style;
          if (
            style.backgroundImage &&
            style.backgroundImage.startsWith("url")
          ) {
            const bi = style.backgroundImage.slice(4, -1).replace(/"/g, "");
            if (bi.startsWith("http")) return;
            if (bi.startsWith("app")) return;
            div.style.backgroundImage = `url('${this.plugin.superstate.ui.getUIPath(
              this.plugin.superstate.spaceManager.resolvePath(bi, file.path)
            )}')`;
          }
        });

        const links = iframe.contentDocument.querySelectorAll("a");
        links.forEach((link: Element) => {
          if (!link.getAttribute("href").startsWith("http")) {
            link.addEventListener("click", (event) => {
              event.preventDefault();
              this.openPathInViewer(link.getAttribute("href"));
            });
          }
        });
        const navItems =
          iframe.contentDocument.querySelectorAll(".nav-contents");
        navItems.forEach((link: Element) => {
          if (!link.getAttribute("data-path")?.startsWith("http")) {
            link.addEventListener("click", (event) => {
              event.preventDefault();
              this.openPathInViewer(link.getAttribute("data-path"));
            });
          }
        });
        const images = iframe.contentDocument.querySelectorAll("img");
        images.forEach((link: Element) => {
          if (!link.getAttribute("src").startsWith("http")) {
            link.setAttribute(
              "src",
              this.plugin.superstate.ui.getUIPath(link.getAttribute("src"))
            );
          }
        });
      },
      { once: true }
    );

    // Clean up the observer when the component is unmounted or the markdown changes
    return;
  }
}
