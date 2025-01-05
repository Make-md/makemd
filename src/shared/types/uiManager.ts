import { Root, RootOptions } from "react-dom/client";
import { SelectMenuProps } from "shared/types/menu";
import { EventDispatcher } from "shared/utils/dispatchers/dispatcher";
import { InputManager } from "shared/utils/inputManager";
import { MenuObject } from "./menu";
import { TargetLocation } from "./path";
import { SpaceState } from "./PathState";
import { Anchors, Pos, Rect } from "./Pos";
import { ISuperstate } from "./superstate";
import { InteractionType, ScreenType, Sticker } from "./ui";
import { Warning } from "./Warning";

export interface IUIManager {
    inputManager: InputManager;
    superstate: ISuperstate;
    mainFrame: UIAdapter;
    resetFunctions: ((id: string) => void)[];
    addResetFunction: (reset: (id: string) => void) => void;
    removeResetFunction: (reset: (id: string) => void) => void;
    resetSelection: (id: string) => void;
    eventsDispatch: EventDispatcher<UIManagerEventTypes>;
    defaultAdd: (space: SpaceState, win: Window, location?: TargetLocation) => void;
    quickOpen: (
        mode?: number,
        offset?: Rect,
        win?: Window,
        onSelect?: (link: string) => void, source?: string) => void;
    availableViews: () => string[];
    activeState: Record<string, any>;
    setActiveState: (state: Record<string, any>) => void;
    activePath: string;
    setActivePath: (path: string) => void;
    setActiveSelection: (path: string, content: any) => void;
    mainMenu: (el: HTMLElement, superstate: ISuperstate) => void;
    navigationHistory: () => string[];
    allViews: () => ViewAdapter[];
    viewsByPath: (path: string) => ViewAdapter[];
    isEverViewOpen: () => boolean;
    adapters: UIAdapter[];
    getWarnings: () => Warning[];
    createRoot: (container: Element | DocumentFragment, options?: RootOptions) => Root;
    openMenu: (rect: Rect, menuProps: SelectMenuProps, win: Window, defaultAnchor?: Anchors, onHide?: () => void, force?: boolean) => MenuObject;
    openCustomMenu: (rect: Rect, fc: JSX.Element, props: any, win: Window, defaultAnchor?: Anchors, onHide?: () => void, className?: string, onSubmenu?: (openSubmenu: (offset: Rect, onHide: () => void) => MenuObject) => MenuObject) => MenuObject;
    notify: (content: string, destination?: string) => void;
    error: (error: any) => void;
    openPalette: (modal: JSX.Element, win: Window, className?: string) => MenuObject;
    openModal: (title: string, modal: JSX.Element, win: Window, className?: string, props?: any) => MenuObject;
    openPopover: (position: Pos, popover: JSX.Element) => void;
    openPath: (path: string, newLeaf?: TargetLocation, source?: any, props?: Record<string, any>) => void;
    primaryInteractionType: () => InteractionType;
    getScreenType: () => ScreenType;
    getOS: () => string;
    getSticker: (icon: string) => string;
    getPlaceholderImage: (icon: string) => string;
    allStickers: () => Sticker[];
    getUIPath: (path: string, thumbnail?: boolean) => string;
    dragStarted: (e: React.DragEvent<HTMLDivElement>, paths: string[]) => void;
    dragEnded: (e: React.DragEvent<HTMLDivElement>) => void;
    setDragLabel: (label: string) => void;
    hasNativePathMenu: (path: string) => boolean;
    nativePathMenu: (e: React.MouseEvent, path: string) => void;
}

export interface UIAdapter {
    manager: IUIManager;
    availableViews: () => string[];
    viewsByPath: (path: string) => ViewAdapter[];
    createRoot: (container: Element | DocumentFragment, options?: RootOptions) => Root;
    openToast: (content: string) => void;
    openModal: (title: string, modal: JSX.Element, win: Window, className?: string, props?: any) => MenuObject;
    openPalette: (modal: JSX.Element, win: Window, className?: string) => MenuObject;
    openPath: (path: string, newLeaf: TargetLocation, source?: any, props?: Record<string, any>) => void;
    openPopover: (position: Pos, popover: JSX.Element) => void;
    getScreenType: () => ScreenType;
    getOS: () => string;
    getWarnings: () => Warning[];
    primaryInteractionType: () => InteractionType;
    getSticker: (icon: string) => string;
    allStickers: () => Sticker[];
    getUIPath: (path: string, thumbnail?: boolean) => string;
    dragStarted: (e: React.DragEvent<HTMLDivElement>, paths: string[]) => void;
    dragEnded: (e: React.DragEvent<HTMLDivElement>) => void;
    setDragLabel: (label: string) => void;
    navigationHistory: () => string[];
    hasNativePathMenu: (path: string) => boolean;
    nativePathMenu: (e: React.MouseEvent, path: string) => void;
    mainMenu: (el: HTMLElement, superstate: ISuperstate) => void;
    quickOpen: (
        mode?: number,
        offset?: Rect,
        win?: Window,
        onSelect?: (link: string) => void, source?: string) => void;
    isEverViewOpen: () => boolean;
}export type UIManagerEventTypes = {
    'activePathChanged': string;
    'activeStateChanged': null;
    'activeSelectionChanged': { path: string; content: string; };
    'windowReady': null;
};
export abstract class ViewAdapter {
    path: string;
    openPath: (path: string) => void;
    parent: ViewAdapter;
    children: ViewAdapter[];
}

