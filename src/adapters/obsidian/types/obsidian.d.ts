import { EditorView } from "@codemirror/view";
import { FlowEditor, FlowEditorParent } from "adapters/obsidian/ui/editors/FlowEditor";

declare module "obsidian" {
  export enum PopoverState {
 Shown,
 Hiding,
 Hidden,
 Showing
  }
  interface  WorkspaceMobileDrawer {
    togglePinned(): void;
  }
  interface WorkspaceSidedock {
    togglePinned(): void;
  }
  interface Vault {
    getConfig(config: string): any
    on(name: 'raw', callback: (path: string) => any, ctx?: any): EventRef;
    config: {
      cssTheme: string;
    }
  }
  interface App {
    appId: string;
    plugins: any;
    dragManager: any;
    commands: {
      listCommands(): Command[];
      findCommand(id: string): Command;
      removeCommand(id: string): void;
      executeCommandById(id: string): void;
      commands: Record<string, Command>;
    };
    embedRegistry: {
      embedByExtension: Record<string, any>;
    };
    mobileToolbar: {
      containerEl: HTMLElement;
    };
    hotkeyManager: {
      getHotkeys(id: string): Hotkey[];
      getDefaultHotkeys(id: string): Hotkey[];
    };
    internalPlugins: {
      getPluginById(id: string): { instance: { options: { pinned: [] } } };
      config: Record<string, boolean>;
      plugins: any
    };
  }

  interface FileManager {
    processFrontMatter: (
      file: TFile,
      callback: (FrontMatterCache) => void
    ) => void;
    createNewMarkdownFile: (folder: TFolder, name: string) => Promise<TFile>;
  }

  interface MetadataCache {
    getCachedFiles(): string[];
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
  interface MarkdownFileInfo {
    contentEl: HTMLElement;
  }
  interface Workspace {
    activeEditor: MarkdownFileInfo;
    recordHistory(leaf: WorkspaceLeaf, pushHistory: boolean): void;
    iterateLeaves(
      callback: (item: WorkspaceLeaf) => boolean | void,
      item: WorkspaceItem | WorkspaceItem[]
    ): boolean;
    iterateLeaves(
      item: WorkspaceItem | WorkspaceItem[],
      callback: (item: WorkspaceLeaf) => boolean | void
    ): boolean;
    getDropLocation(event: MouseEvent): {
      target: WorkspaceItem;
      sidedock: boolean;
    };
    recursiveGetTarget(
      event: MouseEvent,
      parent: WorkspaceParent
    ): WorkspaceItem;
    recordMostRecentOpenedFile(file: TFile): void;
    onDragLeaf(event: MouseEvent, leaf: WorkspaceLeaf): void;
    onLayoutChange(): void; // tell Obsidian leaves have been added/removed/etc.
    floatingSplit: WorkspaceSplit;
  }
  interface WorkspaceSplit {
    children: any[];
  }
  interface WorkspaceLeaf {
    id: string;
    containerEl: HTMLElement;
    tabHeaderInnerTitleEl: HTMLElement;
    tabHeaderInnerIconEl: HTMLElement;
    history: {
      backHistory: any[];
    };
    isFlowBlock?: boolean;
    flowEditors?: FlowEditor[];
  }
  interface Editor {
    cm: EditorView;
  }
interface WorkspaceTabs {
  children: WorkspaceLeaf[];
}
  interface View {
    headerEl: HTMLDivElement;
    editor?: Editor,
    setMode?: (unknown) => unknown,
    editMode?: unknown,
    file?: TAbstractFile,
    getMode?: () => unknown,
  }
  interface MenuItem {
    dom: HTMLElement;
    iconEl: HTMLElement
  }
  interface Menu {
    dom: HTMLElement;
    scope: Scope;
  }
  interface Scope {
    keys: KeymapEventHandler[];
  }
  interface EditorSuggest<T> {
    suggestEl: HTMLElement;
  }
}
