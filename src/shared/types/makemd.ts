import { App, WorkspaceLeaf } from "obsidian";
import { ISuperstate } from "shared/types/superstate";

export interface IMakeMDPlugin {
    app: App;
    superstate: ISuperstate;
    openPath:  (
        leaf: WorkspaceLeaf,
        path: string,
        flow?: boolean
      ) => Promise<void>;
}