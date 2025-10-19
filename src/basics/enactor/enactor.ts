import { Root } from "react-dom/client";
import { SelectOption } from "shared/types/menu";
import { URI } from "shared/types/path";
import { SpaceFragmentSchema } from "shared/types/spaceFragment";

export interface Enactor {
    name: string;
    load(): void;
    convertSpaceFragmentToMarkdown(
        spaceFragment: SpaceFragmentSchema,
        onReturn: (markdown: string) => void
    ): void;
    selectLink(e: React.MouseEvent, onSelect: (path: string) => void): void;
    selectSpace(e: React.MouseEvent, onSelect: (path: string) => void): void;
    pathExists(path: string): Promise<boolean>;
    selectImage(e: React.MouseEvent, onSelect: (path: string) => void): void;
    isSpace(path: string): boolean;
    loadExtensions(firstLoad: boolean): void;
    spaceNotePath(path: string): string | null;
    parentPath(path: string): string;
    spaceFolderPath(path: string): string;
    createNote(parent: string, name: string, content?: string) : Promise<string>;
      createRoot(el: Element | DocumentFragment) : Root;
      notify(message: string) : void;
      uriByString(uri: string, source?: string) : URI;
      spaceFragmentSchema(uri: string) : Promise<SpaceFragmentSchema | null>;
      resolvePath(path: string, source?: string) : string;
      saveSettings() : void;
      openMenu(ev: React.MouseEvent, options: SelectOption[]) : void;
      openPath(path: string, source?: HTMLElement, reading?: boolean) : void;
      addActiveStateListener(listener: () => void) : void;
        removeActiveStateListener(listener: () => void) : void;
}

