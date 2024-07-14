import { uiPlaceholders } from "core/assets/placeholders";
import { showMenu } from "core/react/components/UI/Menus/menu";
import { SelectMenuProps } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { showSelectMenu } from "core/react/components/UI/Menus/selectMenu";
import { Superstate } from "core/superstate/superstate";
import { MenuObject } from "core/utils/ui/menu";
import { Root, RootOptions } from "react-dom/client";
import { TargetLocation } from "types/path";
import { Anchors, Pos, Rect } from "../../types/Pos";
import { EventDispatcher } from "./dispatchers/dispatcher";
import { InputManager } from "./inputManager";

export type UIManagerEventTypes = {
    'activePathChanged': string;
    'activeSelectionChanged': {path: string, content: string};
    'windowReady': null;
}
export enum ScreenType {Phone, Desktop, Tablet}
export enum InteractionType {Touch, Mouse, Controller, Voice }
export type Sticker = {
    type: string;
    name: string;
    value: string;
    html: string;
    keywords: string;
  };
  
  export abstract class ViewAdapter {
    path: string;
    openPath: (path: string) => void;
    parent: ViewAdapter;
    children: ViewAdapter[];
  }
  
export interface UIAdapter {
    manager: UIManager;
    availableViews: () => string[];
    viewsByPath: (path: string) => ViewAdapter[];
    createRoot: (container: Element | DocumentFragment, options?: RootOptions) => Root;
    openToast: (content: string) => void;
    openModal: (title: string, modal: React.FC<{hide: () => void}>, win: Window, className?: string, props?: any) => MenuObject;
    openPalette: (modal: React.FC<{hide: () => void}>, win: Window, className?: string) => MenuObject;
    openPath: (path: string, newLeaf: TargetLocation, source?: any, props?: Record<string, any>) => void;
    openPopover: (position: Pos, popover: React.FC<{hide: () => void}>) => void
    getScreenType: () => ScreenType;
    getOS: () => string;
    primaryInteractionType: () => InteractionType;
    getSticker: (icon: string) => string;
    allStickers: () => Sticker[];
    getUIPath: (path: string, thumbnail?: boolean) => string;
    dragStarted: (e: React.DragEvent<HTMLDivElement>, paths: string[], ) => void;
    dragEnded: (e: React.DragEvent<HTMLDivElement>) => void;
    setDragLabel: (label: string) => void;
    navigationHistory: () => string[];
    mainMenu: (el: HTMLElement, superstate: Superstate) => void;
    quickOpen: (superstate: Superstate) => void;
}

export class UIManager {

    inputManager: InputManager;
    mainFrame: UIAdapter;
    public resetFunctions: ((id:string) => void)[] = [];
    public addResetFunction = (reset: (id: string) => void) => {
        this.resetFunctions.push(reset);
      };
    
      public removeResetFunction = (reset: (id: string) => void) => {
        this.resetFunctions = this.resetFunctions.filter(f => f != reset)
      };
      public resetSelection = (id: string) => {
        this.resetFunctions.forEach(f => f(id));
      }
    public eventsDispatch: EventDispatcher<UIManagerEventTypes> = new EventDispatcher<UIManagerEventTypes>();
    public quickOpen(superstate: Superstate) {
        this.mainFrame.quickOpen(superstate);
    }
    public availableViews () {
        return this.mainFrame.availableViews();
    }

    public activePath: string;
    public setActivePath (path: string) {
        this.activePath = path;
        this.eventsDispatch.dispatchEvent('activePathChanged', path);
    }
    public setActiveSelection (path: string, content: any) {
        this.eventsDispatch.dispatchEvent('activeSelectionChanged', {path, content});
    }
    public mainMenu (el: HTMLElement, superstate: Superstate) {
        this.mainFrame.mainMenu(el, superstate);
    }
    public navigationHistory () {
        return this.mainFrame.navigationHistory();
    }
    public allViews () : ViewAdapter[] {
        return [];
    }
    public viewsByPath (path: string) : ViewAdapter[] {
        return this.mainFrame.viewsByPath(path);
    }
    public static create(adapter: UIAdapter, adapters?: UIAdapter[]): UIManager {
        return new UIManager(adapter, adapters);
    }
    public adapters : UIAdapter[] = [];
    private constructor(primaryAdapter : UIAdapter, adapters: UIAdapter[]) {
        this.adapters = adapters ?? [];
        //adapters
        primaryAdapter.manager = this;
        this.mainFrame = primaryAdapter
        this.inputManager = new InputManager();
    }

    public createRoot(container: Element | DocumentFragment, options?: RootOptions) {
        return this.mainFrame.createRoot(container)
    }

    public openMenu (rect: Rect, menuProps: SelectMenuProps, win: Window, defaultAnchor: Anchors = 'right', onHide?: () => void) : MenuObject {
        return showSelectMenu(rect, menuProps, win, defaultAnchor, onHide);
    }

    public openCustomMenu (rect: Rect, fc: JSX.Element, props: any, win: Window, defaultAnchor: Anchors = 'right', onHide?: () => void) : MenuObject {
        return showMenu({rect, anchor: defaultAnchor, win, ui: this, fc, props, onHide});
    }
    public notify (content: string, destination?: string) {
        if (destination == 'console') {
            console.log(content);
            return;
        }
        this.mainFrame.openToast(content);
    }
    public error (error: any) {
        console.log(error);
    }
    public openPalette (modal: React.FC<{hide: () => void}>, win: Window, className?: string, ) {
        return this.mainFrame.openPalette(modal, win, className);
    }
    public openModal (title: string, modal: React.FC<{hide: () => void}>, win: Window, className?: string, props?: any) : MenuObject {
        return this.mainFrame.openModal(title, modal, win, className, props);
    }
    public openPopover (position: Pos, popover: React.FC<{hide: () => void}>) {
        this.mainFrame.openPopover(position, popover);
    }
    public openPath (path: string, newLeaf?: TargetLocation, source?: any, props?: Record<string, any>) {

        this.mainFrame.openPath(path, newLeaf, source, props);
    }
    public primaryInteractionType () {
        return this.mainFrame.primaryInteractionType();
    }
    public getScreenType () {
        return this.mainFrame.getScreenType();
    }
    public getOS () {
        return this.mainFrame.getOS();
    }
    public getSticker (icon: string) {
        return this.mainFrame.getSticker(icon);
    }
    public getPlaceholderImage (icon: string) {
        return uiPlaceholders[icon];
    }
    public allStickers () {
        return this.mainFrame.allStickers()
    }
    public getUIPath (path: string, thumbnail?: boolean) {
        if (!path) return null;
        return this.mainFrame.getUIPath(path, thumbnail);
    }
    
    public dragStarted (e: React.DragEvent<HTMLDivElement>, paths: string[]) {
        this.mainFrame.dragStarted(e, paths);
    }
    public dragEnded (e: React.DragEvent<HTMLDivElement>) {
        this.mainFrame.dragEnded(e);
    }
    public setDragLabel ( label: string) {
        this.mainFrame.setDragLabel(label);
    }
}