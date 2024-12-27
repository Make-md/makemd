/**
 * Obsidian Hover Editor
 * https://github.com/nothingislost/obsidian-hover-editor
 * nothingislost
 *
 * Includes leaf loading and management strategies from project
 **/

import {
  App,
  Component,
  EphemeralState,
  HoverPopover,
  MousePos,
  OpenViewState,
  PopoverState,
  resolveSubpath,
  TFile,
  View,
  Workspace,
  WorkspaceLeaf,
  WorkspaceSplit,
  WorkspaceTabs,
} from "obsidian";

import { genId } from "./utils/uuid";

export interface FlowEditorParent {
  flowEditors: FlowEditor[] | null;
  containerEl?: HTMLElement;
  view?: View;
  dom?: HTMLElement;
}
const popovers = new WeakMap<Element, FlowEditor>();
type ConstructableWorkspaceSplit = new (
  ws: Workspace,
  dir: "horizontal" | "vertical"
) => WorkspaceSplit;

const mouseCoords: MousePos = { x: 0, y: 0 };

function nosuper<T>(base: new (...args: unknown[]) => T): new () => T {
  const derived = function () {
    return Object.setPrototypeOf(new Component(), new.target.prototype);
  };
  derived.prototype = base.prototype;
  return Object.setPrototypeOf(derived, base);
}

export class FlowEditor extends nosuper(HoverPopover) {
  onTarget: boolean;
  setActive: (event: MouseEvent) => void;
  shownPos: MousePos | null;

  lockedOut: boolean;

  abortController? = this.addChild(new Component());

  detaching = false;

  opening = false;

  rootSplit: WorkspaceSplit =
    new (WorkspaceSplit as ConstructableWorkspaceSplit)(
      this.app.workspace,
      "vertical"
    );

  targetRect = this.targetEl?.getBoundingClientRect();

  pinEl: HTMLElement;

  titleEl: HTMLElement;

  containerEl: HTMLElement;

  hideNavBarEl: HTMLElement;

  oldPopover = this.parent?.flowEditors.find((he: any) => he.id !== this.id);
  document: Document =
    this.targetEl?.ownerDocument ?? window.activeDocument ?? window.document;

  id = genId();

  bounce?: NodeJS.Timeout;

  boundOnZoomOut: () => void;

  originalPath: string; // these are kept to avoid adopting targets w/a different link
  originalLinkText: string;

  static activeWindows(app: App) {
    const windows: Window[] = [window];
    const { floatingSplit } = app.workspace;
    if (floatingSplit) {
      for (const split of floatingSplit.children) {
        if (split.win) windows.push(split.win);
      }
    }
    return windows;
  }

  static containerForDocument(app: App, doc: Document) {
    if (doc !== document && app.workspace.floatingSplit)
      for (const container of app.workspace.floatingSplit.children) {
        if (container.doc === doc) return container;
      }
    return app.workspace.rootSplit;
  }

  static activePopovers(app: App) {
    return this.activeWindows(app).flatMap(this.popoversForWindow);
  }

  static popoversForWindow(win?: Window) {
    return (
      Array.prototype.slice.call(
        win?.document?.body.querySelectorAll(".mk-hover-popover") ?? []
      ) as HTMLElement[]
    )
      .map((el) => popovers.get(el)!)
      .filter((he) => he);
  }

  static forLeaf(leaf: WorkspaceLeaf | undefined) {
    // leaf can be null such as when right clicking on an internal link
    const el =
      leaf &&
      document.body.matchParent.call(leaf.containerEl, ".mk-hover-popover"); // work around matchParent race condition
    return el ? popovers.get(el) : undefined;
  }

  hoverEl: HTMLElement = this.document.defaultView!.createDiv({
    cls: "mk-floweditor mk-hover-popover",
    attr: { id: "he" + this.id },
  });

  constructor(
    parent: FlowEditorParent,
    public targetEl: HTMLElement,
    public app: App,
    waitTime?: number,
    public onShowCallback?: (editor: FlowEditor) => Promise<unknown>
  ) {
    //
    super();
    if (waitTime === undefined) {
      waitTime = 10;
    }
    this.onTarget = true;
    this.parent = parent;
    this.waitTime = waitTime;
    this.state = PopoverState.Showing;
    const { hoverEl } = this;

    this.abortController!.load();
    this.timer = window.setTimeout(this.show.bind(this), waitTime);
    this.setActive = this._setActive.bind(this);
    if (hoverEl) {
      hoverEl.addEventListener("mousedown", this.setActive);
      hoverEl.addEventListener("mousedown", (e) => e.stopPropagation());
    }
    // custom logic begin
    popovers.set(this.hoverEl, this);
    this.hoverEl.addClass("hover-editor");

    this.containerEl = this.hoverEl.createDiv("popover-content");
    this.setTitleBar();
    this.hoverEl.style.height = "auto";
    this.hoverEl.style.width = "100%";
    this.hoverEl.addEventListener("keydown", (e) => e.stopPropagation());
  }
  onunload(): void {
    this.hide();
  }

  _setActive() {
    this.app.workspace.setActiveLeaf(this.leaves()[0], { focus: true });
  }

  getDefaultMode() {
    return this.parent?.view?.getMode ? this.parent.view.getMode() : "preview";
  }

  updateLeaves() {
    if (
      this.onTarget &&
      this.targetEl &&
      !this.document.contains(this.targetEl)
    ) {
      this.onTarget = false;
      this.transition();
    }
    let leafCount = 0;
    this.app.workspace.iterateLeaves((leaf) => {
      leafCount++;
    }, this.rootSplit);
    if (leafCount === 0) {
      this.hide(); // close if we have no leaves
    } else if (leafCount > 1) {
    }
    this.hoverEl.setAttribute("data-leaf-count", leafCount.toString());
  }

  setTitleBar() {
    this.titleEl = this.document.defaultView!.createDiv("mk-flow-titlebar");
    this.containerEl.prepend(this.titleEl);
  }

  attachLeaf(): WorkspaceLeaf {
    this.rootSplit.getRoot = () =>
      this.app.workspace[
        this.document === document ? "rootSplit" : "floatingSplit"
      ]!;
    this.rootSplit.getContainer = () =>
      FlowEditor.containerForDocument(this.app, this.document);

    this.titleEl.insertAdjacentElement("afterend", this.rootSplit.containerEl);
    const leaf = this.app.workspace.createLeafInParent(this.rootSplit, 0);

    leaf.isFlowBlock = true;
    this.updateLeaves();
    return leaf;
  }

  onload(): void {
    super.onload();

    this.registerEvent(
      this.app.workspace.on("layout-change", this.updateLeaves, this)
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        // Ensure that top-level items in a popover are not tabbed
        this.rootSplit.children.forEach((item, index) => {
          if (item instanceof WorkspaceTabs) {
            this.rootSplit.replaceChild(index, item.children[0]);
          }
        });
      })
    );
  }

  leaves() {
    const leaves: WorkspaceLeaf[] = [];
    this.app.workspace.iterateLeaves((leaf) => {
      leaves.push(leaf);
    }, this.rootSplit);
    return leaves;
  }

  async onShow() {
    const closeDelay = 600;
    setTimeout(() => (this.waitTime = closeDelay), closeDelay);

    this.oldPopover?.hide();
    this.oldPopover = null;

    this.hoverEl.classList.add("is-new");

    this.document.body.addEventListener(
      "click",
      () => {
        this.hoverEl.classList.remove("is-new");
      },
      { once: true, capture: true }
    );

    if (this.parent) {
      if (!this.parent.flowEditors) this.parent.flowEditors = [];
      this.parent.flowEditors.push(this);
      this.parent.view.addChild(this);
    }
    await this.onShowCallback?.(this);
    this.onShowCallback = undefined; // only call it once
    const viewHeaderEl = this.hoverEl.querySelector(".view-header");
    viewHeaderEl?.remove();
    const sizer = this.hoverEl.querySelector(".workspace-leaf");
    if (sizer) this.hoverEl.appendChild(sizer);
    const inlineTitle = this.hoverEl.querySelector(".inline-title");
    inlineTitle?.remove();
  }

  transition() {
    if (this.shouldShow()) {
      if (this.state === PopoverState.Hiding) {
        this.state = PopoverState.Shown;
        clearTimeout(this.timer);
      }
    } else {
      if (this.state === PopoverState.Showing) {
        this.hide();
      } else {
        if (this.state === PopoverState.Shown) {
          this.state = PopoverState.Hiding;
          this.timer = window.setTimeout(() => {
            if (this.shouldShow()) {
              this.transition();
            } else {
              this.hide();
            }
          }, this.waitTime);
        }
      }
    }
  }

  shouldShow() {
    return this.shouldShowSelf() || this.shouldShowChild();
  }

  shouldShowChild(): boolean {
    return FlowEditor.activePopovers(this.app).some((popover) => {
      if (
        popover !== this &&
        popover.targetEl &&
        this.hoverEl.contains(popover.targetEl)
      ) {
        return popover.shouldShow();
      }
      return false;
    });
  }

  shouldShowSelf() {
    return (
      !this.detaching &&
      !!(
        this.onTarget ||
        this.state == PopoverState.Shown ||
        this.document.querySelector(
          `body>.modal-container, body > #he${this.id} ~ .menu, body > #he${this.id} ~ .suggestion-container`
        )
      )
    );
  }

  show() {
    this.state = PopoverState.Shown;
    this.timer = 0;
    this.shownPos = mouseCoords;
    this.targetEl.replaceChildren(this.hoverEl);
    this.onShow();
    this.app.workspace.onLayoutChange();
    this.load();
  }

  onHide() {
    this.oldPopover = null;
    if (this.parent?.flowEditors.find((he: any) => he == this)) {
      this.parent.flowEditors = this.parent.flowEditors.filter(
        (he: any) => he.id !== this.id
      );
    }
  }

  hide() {
    this.onTarget = false;
    this.detaching = true;
    // Once we reach this point, we're committed to closing

    // in case we didn't ever call show()

    // A timer might be pending to call show() for the first time, make sure
    // it doesn't bring us back up after we close
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = 0;
    }

    // Hide our HTML element immediately, even if our leaves might not be
    // detachable yet.  This makes things more responsive and improves the
    // odds of not showing an empty popup that's just going to disappear
    // momentarily.
    this.hoverEl.hide();

    // If a file load is in progress, we need to wait until it's finished before
    // detaching leaves.  Because we set .detaching, The in-progress openFile()
    // will call us again when it finishes.
    if (this.opening) return;

    const leaves = this.leaves();
    if (leaves.length) {
      // Detach all leaves before we unload the popover and remove it from the DOM.
      // Each leaf.detach() will trigger layout-changed and the updateLeaves()
      // method will then call hide() again when the last one is gone.
      leaves.forEach((leaf) => {
        leaf.detach();
      });
    } else {
      this.parent = null;
      this.abortController?.unload();
      this.abortController = undefined;
      return this.nativeHide();
    }
  }

  nativeHide() {
    const { hoverEl, targetEl } = this;

    this.state = PopoverState.Hidden;

    hoverEl.detach();

    if (targetEl) {
      const parent = targetEl.matchParent(".mk-hover-popover");
      if (parent) popovers.get(parent)?.transition();
    }

    this.onHide();
    this.unload();
  }

  async openContext(
    file: TFile,
    openState?: OpenViewState,
    useLeaf?: WorkspaceLeaf
  ) {
    if (this.detaching) return;
    const leaf = useLeaf ?? this.attachLeaf();
    this.opening = true;
    try {
      await leaf.openFile(file, openState);
    } catch (e) {
      console.error(e);
    } finally {
      this.opening = false;
      if (this.detaching) this.hide();
    }
    // this.plugin.app.workspace.setActiveLeaf(leaf);

    return leaf;
  }
  async openFile(
    file: TFile,
    openState?: OpenViewState,
    useLeaf?: WorkspaceLeaf
  ) {
    if (this.detaching) return;
    const leaf = useLeaf ?? this.attachLeaf();
    this.opening = true;
    try {
      await leaf.openFile(file, openState);
    } catch (e) {
      console.error(e);
    } finally {
      this.opening = false;
      if (this.detaching) this.hide();
    }
    // this.plugin.app.workspace.setActiveLeaf(leaf);

    return leaf;
  }

  buildState(parentMode: string, eState?: EphemeralState) {
    return {
      active: false,
      state: {},
      eState: eState,
    };
  }

  buildEphemeralState(
    file: TFile,
    link?: {
      path: string;
      subpath: string;
    }
  ) {
    const cache = this.app.metadataCache.getFileCache(file);
    const subpath = cache
      ? resolveSubpath(cache, link?.subpath || "")
      : undefined;
    const eState: EphemeralState = { subpath: link?.subpath };
    if (subpath) {
      eState.line = subpath.start.line;
      eState.startLoc = subpath.start;
      eState.endLoc = subpath.end || undefined;
    }
    return eState;
  }
}
