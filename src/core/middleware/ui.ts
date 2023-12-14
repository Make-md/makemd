import { SelectMenuProps } from "core/react/components/UI/Menus/menu";
import { Superstate } from "core/superstate/superstate";
import { TargetLocation } from "types/path";
import { Pos } from "../../types/Pos";
import { EventDispatcher } from "./dispatchers/dispatcher";

export type UIManagerEventTypes = {
    'activePathChanged': string;
}
export type ScreenType = 'mobile' | 'desktop' | 'tablet'
export type Sticker = {
    type: string;
    name: string;
    value: string;
    html: string;
    keywords: string;
  };
  export type Command = {
    name: string;
    value: string;
  };

  export abstract class ViewAdapter {
    path: string;
    openPath: (path: string) => void;
    parent: ViewAdapter;
    children: ViewAdapter[];
  }
export interface UIAdapter {
    manager: UIManager;
    openCustomMenu: (position: Pos, fc: React.FC<{hide: () => void}>) => void;
    openMenu: (position: Pos, menuProps: SelectMenuProps) => void;
    openToast: (content: string) => void;
    openModal: (title: string, modal: React.FC<{hide: () => void}>) => void;
    openPalette: (modal: React.FC<{hide: () => void, ref: any}>, className?: string) => void;
    openPath: (path: string, newLeaf: TargetLocation, source?: any, props?: Record<string, any>) => void;
    openPopover: (position: Pos, popover: React.FC<{hide: () => void}>) => void
    getScreenType: () => ScreenType;
    getSticker: (icon: string) => string;
    allStickers: () => Sticker[];
    getUIPath: (path: string) => string;
    dragStarted: (e: React.DragEvent<HTMLDivElement>, paths: string[], ) => void;
    dragEnded: (e: React.DragEvent<HTMLDivElement>) => void;
    setDragLabel: (label: string) => void;
    navigationHistory: () => string[];
    mainMenu: (el: HTMLElement, superstate: Superstate) => void;
    quickOpen: () => void;
}
export class UIManager {

    mainFrame: UIAdapter;
    public eventsDispatch: EventDispatcher<UIManagerEventTypes> = new EventDispatcher<UIManagerEventTypes>();
    public quickOpen() {
        this.mainFrame.quickOpen();
    }

    public activePath: string;
    public setActivePath (path: string) {
        this.activePath = path;
        this.eventsDispatch.dispatchEvent('activePathChanged', path);
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
        return [];
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
    }

    public openMenu (position: Pos, menuProps: SelectMenuProps) {
        this.mainFrame.openMenu(position, menuProps);
    }

    public openCustomMenu (position: Pos, fc: React.FC<{hide: () => void}>) {
        this.mainFrame.openCustomMenu(position, fc);
    }
    public notify (content: string, destination?: string) {
        if (destination == 'console' && this.mainFrame.getScreenType() == 'desktop') {
            console.log(content);
            return;
        }
        this.mainFrame.openToast(content);
    }
    public openPalette (modal: React.FC<{hide: () => void, ref: any}>, className?: string) {
        this.mainFrame.openPalette(modal, className);
    }
    public openModal (title: string, modal: React.FC<{hide: () => void}>) {
        this.mainFrame.openModal(title, modal);
    }
    public openPopover (position: Pos, popover: React.FC<{hide: () => void}>) {
        this.mainFrame.openPopover(position, popover);
    }
    public openPath (path: string, newLeaf: TargetLocation, source?: any, props?: Record<string, any>) {
        this.mainFrame.openPath(path, newLeaf, source, props);
    }
    public getScreenType () {
        return this.mainFrame.getScreenType();
    }
    public getSticker (icon: string) {
        return this.mainFrame.getSticker(icon);
    }
    public allStickers () {
        return this.mainFrame.allStickers()
    }
    public getUIPath (path: string) {
        return this.mainFrame.getUIPath(path);
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