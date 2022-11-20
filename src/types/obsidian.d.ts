import { FlowEditorParent } from "components/FlowEditor/FlowEditor";
import { EditorView } from '@codemirror/view'

declare module "obsidian" {
  interface App {
    commands: {
        listCommands(): Command[],
        findCommand(id: string): Command,
        removeCommand(id: string): void,
        executeCommandById(id: string): void,
        commands: Record<string, Command>,
    },
    mobileToolbar: {
        containerEl: HTMLElement;
    }
    hotkeyManager: {
        getHotkeys(id: string): Hotkey[],
        getDefaultHotkeys(id: string): Hotkey[],
    },
    internalPlugins: {
        getPluginById(id: string): { instance: { options: { pinned: [] } } },
    }
  }

  interface MetadataCache {
    getCachedFiles(): string[],
    getTags(): Record<string, number>;
  }

  class FileExplorerPlugin extends Plugin_2 {
    revealInFolder(this: any, ...args: any[]): any;
  }

    interface WorkspaceParent {
        insertChild(index: number, child: WorkspaceItem, resize?: boolean): void;
        replaceChild(index: number, child: WorkspaceItem, resize?: boolean): void;
        removeChild(leaf: WorkspaceLeaf, resize?: boolean): void;
        containerEl: HTMLElement;
      }
      
interface EmptyView extends View {
    actionListEl: HTMLElement;
    emptyTitleEl: HTMLElement;
  }

  interface MousePos {
    x: number;
    y: number;
  }

  interface EphemeralState {
    focus?: boolean;
    subpath?: string;
    line?: number;
    startLoc?: Loc;
    endLoc?: Loc;
    scroll?: number;
  }
interface WorkspaceMobileDrawer {
  currentTab: number;
  children: WorkspaceLeaf[];
}
interface WorkspaceRibbon {
  orderedRibbonActions: any[];
}
interface HoverPopover {
    parent: FlowEditorParent | null;
    targetEl: HTMLElement;
    hoverEl: HTMLElement;
    hide(): void;
    show(): void;
    shouldShowSelf(): boolean;
    timer: number;
    waitTime: number;
    shouldShow(): boolean;
    transition(): void;
  }
  interface Workspace {
    recordHistory(leaf: WorkspaceLeaf, pushHistory: boolean): void;
    iterateLeaves(callback: (item: WorkspaceLeaf) => boolean | void, item: WorkspaceItem | WorkspaceItem[]): boolean;
    iterateLeaves(item: WorkspaceItem | WorkspaceItem[], callback: (item: WorkspaceLeaf) => boolean | void): boolean;
    getDropLocation(event: MouseEvent): {
      target: WorkspaceItem;
      sidedock: boolean;
    };
    recursiveGetTarget(event: MouseEvent, parent: WorkspaceParent): WorkspaceItem;
    recordMostRecentOpenedFile(file: TFile): void;
    onDragLeaf(event: MouseEvent, leaf: WorkspaceLeaf): void;
    onLayoutChange(): void  // tell Obsidian leaves have been added/removed/etc.
    floatingSplit: WorkspaceSplit;
  }
interface WorkspaceSplit {
  children: any[];
}
  interface WorkspaceLeaf {
    containerEl: HTMLElement;
    tabHeaderInnerTitleEl: HTMLElement;
  }
  interface Editor {
    cm: EditorView;
  }

interface View {
  headerEl: HTMLDivElement;
}

  interface EditorSuggest<T> {
    suggestEl: HTMLElement;
  }
}