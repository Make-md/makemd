import { uiPlaceholders } from "core/assets/placeholders";
import { showMenu } from "core/react/components/UI/Menus/menu";

import { showSelectMenu } from "core/react/components/UI/Menus/selectMenu";
import { InputModal } from "core/react/components/UI/Modals/InputModal";
import {
  defaultSpace,
  newPathInSpace,
  newTemplateInSpace,
} from "core/superstate/utils/spaces";
import { addTag } from "core/superstate/utils/tags";
import _ from "lodash";
import { i18n, Superstate } from "makemd-core";
import React from "react";
import { RootOptions } from "react-dom/client";
import { tagsSpacePath } from "shared/schemas/builtin";
import { MenuObject, SelectMenuProps } from "shared/types/menu";
import { TargetLocation } from "shared/types/path";
import { SpaceState } from "shared/types/PathState";
import {
  IUIManager,
  UIAdapter,
  UIManagerEventTypes,
  ViewAdapter,
} from "shared/types/uiManager";
import { Anchors, Pos, Rect } from "../../shared/types/Pos";
import { EventDispatcher } from "../../shared/utils/dispatchers/dispatcher";
import { InputManager } from "../../shared/utils/inputManager";

export class UIManager implements IUIManager {
  inputManager: InputManager;
  superstate: Superstate;
  mainFrame: UIAdapter;
  public resetFunctions: ((id: string) => void)[] = [];
  public addResetFunction = (reset: (id: string) => void) => {
    this.resetFunctions.push(reset);
  };

  public removeResetFunction = (reset: (id: string) => void) => {
    this.resetFunctions = this.resetFunctions.filter((f) => f != reset);
  };
  public resetSelection = (id: string) => {
    this.resetFunctions.forEach((f) => f(id));
  };
  public eventsDispatch: EventDispatcher<UIManagerEventTypes> =
    new EventDispatcher<UIManagerEventTypes>();
  public quickOpen(
    mode?: number,
    offset?: Rect,
    win?: Window,
    onSelect?: (link: string) => void
  ) {
    this.mainFrame.quickOpen(mode, offset, win, onSelect);
  }
  public availableViews() {
    return this.mainFrame.availableViews();
  }

  public defaultAdd(space: SpaceState, win: Window, location?: TargetLocation) {
    if (space?.path == tagsSpacePath) {
      this.openModal(
        "New Tag",
        <InputModal
          value=""
          saveLabel={i18n.labels.saveView}
          saveValue={(value) => addTag(this.superstate, value)}
        ></InputModal>,
        win
      );
    } else if (space) {
      if (space?.metadata.template?.length > 0) {
        newTemplateInSpace(
          this.superstate,
          space,
          space.metadata.template,
          location
        );
        return;
      } else {
        newPathInSpace(
          this.superstate,
          space,
          "md",
          null,
          false,
          null,
          location
        );
      }
    } else {
      defaultSpace(
        this.superstate,
        this.superstate.pathsIndex.get(this.superstate.ui.activePath)
      ).then((f) => {
        if (f)
          newPathInSpace(this.superstate, f, "md", null, false, null, location);
      });
    }
  }

  public activeState: Record<string, any> = {};
  public setActiveState(state: Record<string, any>) {
    if (_.isEqual(state, this.activeState)) return;
    this.activeState = state;
    this.eventsDispatch.dispatchEvent("activeStateChanged", null);
  }
  public activePath: string;
  public setActivePath(path: string) {
    this.activePath = path;
    this.eventsDispatch.dispatchEvent("activePathChanged", path);
  }
  public setActiveSelection(path: string, content: any) {
    this.eventsDispatch.dispatchEvent("activeSelectionChanged", {
      path,
      content,
    });
  }
  public mainMenu(el: HTMLElement, superstate: Superstate) {
    this.mainFrame.mainMenu(el, superstate);
  }

  public navigationHistory() {
    return this.mainFrame.navigationHistory();
  }
  public allViews(): ViewAdapter[] {
    return [];
  }
  public viewsByPath(path: string): ViewAdapter[] {
    return this.mainFrame.viewsByPath(path);
  }
  public static create(adapter: UIAdapter, adapters?: UIAdapter[]): UIManager {
    return new UIManager(adapter, adapters);
  }
  public isEverViewOpen() {
    return this.mainFrame.isEverViewOpen();
  }
  public adapters: UIAdapter[] = [];
  private constructor(primaryAdapter: UIAdapter, adapters: UIAdapter[]) {
    this.adapters = adapters ?? [];
    //adapters
    primaryAdapter.manager = this;
    this.mainFrame = primaryAdapter;
    this.inputManager = new InputManager();
  }
  public getWarnings() {
    return this.mainFrame.getWarnings();
  }

  public createRoot(
    container: Element | DocumentFragment,
    options?: RootOptions
  ) {
    return this.mainFrame.createRoot(container);
  }

  public openMenu(
    rect: Rect,
    menuProps: SelectMenuProps,
    win: Window,
    defaultAnchor: Anchors = "right",
    onHide?: () => void,
    force?: boolean
  ): MenuObject {
    return showSelectMenu(rect, menuProps, win, defaultAnchor, onHide, force);
  }

  public openCustomMenu(
    rect: Rect,
    fc: JSX.Element,
    props: any,
    win: Window,
    defaultAnchor: Anchors = "right",
    onHide?: () => void,
    className?: string,
    onSubmenu?: (
      openSubmenu: (offset: Rect, onHide: () => void) => MenuObject
    ) => MenuObject
  ): MenuObject {
    return showMenu({
      rect,
      anchor: defaultAnchor,
      win,
      ui: this,
      fc,
      props,
      onHide,
      className,
      onSubmenu,
    });
  }
  public notify(content: string, destination?: string) {
    if (destination == "console") {
      console.log(content);
      return;
    }
    this.mainFrame.openToast(content);
  }
  public error(error: any) {
    console.log(error);
  }
  public openPalette(modal: JSX.Element, win: Window, className?: string) {
    return this.mainFrame.openPalette(modal, win, className);
  }
  public openModal(
    title: string,
    modal: JSX.Element,
    win: Window,
    className?: string,
    props?: any
  ): MenuObject {
    return this.mainFrame.openModal(title, modal, win, className, props);
  }
  public openPopover(position: Pos, popover: JSX.Element) {
    this.mainFrame.openPopover(position, popover);
  }
  public openPath(
    path: string,
    newLeaf?: TargetLocation,
    source?: any,
    props?: Record<string, any>
  ) {
    this.mainFrame.openPath(path, newLeaf, source, props);
  }
  public primaryInteractionType() {
    return this.mainFrame.primaryInteractionType();
  }
  public getScreenType() {
    return this.mainFrame.getScreenType();
  }
  public getOS() {
    return this.mainFrame.getOS();
  }
  public getSticker(icon: string, options?: Record<string, any>) {
    return this.mainFrame.getSticker(icon, options);
  }
  public getPlaceholderImage(icon: string) {
    return uiPlaceholders[icon];
  }
  public allStickers() {
    return this.mainFrame.allStickers();
  }
  public getUIPath(path: string, thumbnail?: boolean) {
    if (!path) return null;
    return this.mainFrame.getUIPath(path, thumbnail);
  }

  public dragStarted(e: React.DragEvent<HTMLDivElement>, paths: string[]) {
    this.mainFrame.dragStarted(e, paths);
  }
  public dragEnded(e: React.DragEvent<HTMLDivElement>) {
    this.mainFrame.dragEnded(e);
  }
  public setDragLabel(label: string) {
    this.mainFrame.setDragLabel(label);
  }
  public hasNativePathMenu(path: string) {
    return this.mainFrame.hasNativePathMenu(path);
  }
  public nativePathMenu(e: React.MouseEvent, path: string) {
    this.mainFrame.nativePathMenu(e, path);
  }
}
