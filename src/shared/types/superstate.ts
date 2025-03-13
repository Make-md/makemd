
import { LocalCachePersister } from "shared/types/persister";

import { FrameExecutable } from "shared/types/frameExec";
import { Kit } from "shared/types/kits";
import { Metadata } from "shared/types/metadata";
import { MakeMDSettings } from "shared/types/settings";
import { EventDispatcher } from "shared/utils/dispatchers/dispatcher";
import { ICLIManager } from "./actions";
import { IAPI } from "./api";
import { Command } from "./commands";
import { Focus } from "./focus";
import { IndexMap } from "./indexMap";
import { FrameRoot, MDBFrames } from "./mframe";
import { ContextState, PathState, SpaceState, SuperstateEvent } from "./PathState";
import { SpaceDefGroup, SpaceDefinition } from "./spaceDef";
import { SpaceInfo } from "./spaceInfo";
import { SpaceManagerInterface } from "./spaceManager";
import { IUIManager } from "./uiManager";



export abstract class ISuperstate {
    formulaContext: math.MathJsInstance;
    initialized: boolean;
    eventsDispatcher: EventDispatcher<SuperstateEvent>;
    spaceManager: SpaceManagerInterface;
    settings: MakeMDSettings;
    onSpaceDefinitionChanged: (space: SpaceState, metadata?: SpaceDefinition) => Promise<void>;
    saveSettings: () => void;
    api: IAPI;
    ui: IUIManager;
    cli: ICLIManager;
    pathsIndex: Map<string, PathState>;
    spacesIndex: Map<string, SpaceState>;
    contextsIndex: Map<string, ContextState>;
    actionsIndex: Map<string, Command[]>;
    kits: Map<string, Kit>;
    actions: Map<string, Command[]>;
    selectedKit: Kit;
    kitFrames: Map<string, FrameExecutable>;
    templateCache: Map<string, MDBFrames>;
    kit: FrameRoot[];
    iconsCache: Map<string, string>;
    imagesCache: Map<string, string>;
    spacesDBLoaded: boolean;
    spacesMap: IndexMap;
    linksMap: IndexMap;
    tagsMap: IndexMap;
    liveSpaceLinkMap: IndexMap;
    allMetadata: Record<string, { name: string; properties: Metadata[] }>;
    focuses: Focus[];
    persister: LocalCachePersister;

    refreshMetadata: () => void;
    initializeIndex:() => Promise<void>;
    addToContextStateQueue: (operation: () => Promise<any>) => void;
    initialize:() => Promise<void>;
    reloadSystemActions: () => Promise<void>;
    initializePaths: () => Promise<void>;
    initializeActions: () => Promise<void>;
    initializeKits: () => Promise<void>;
    initializeTemplates: () => Promise<void>;
    initializeSpaces:() => Promise<void>;
    getSpaceItems: (spacePath: string, filesOnly?: boolean)=> PathStateWithRank[];
    loadFromCache: () => Promise<void>;
    dispatchEvent:(event: keyof SuperstateEvent, payload: any)=> void;
    initializeBuiltins: () => Promise<void>;
    initializeTags: () => Promise<void>;
    onTagRenamed: (tag: string, newTag: string)=> Promise<void>;
    onTagDeleted:(tag: string) => Promise<void>;
    deleteTagInPath:(tag: string, path: string) => Promise<void>;
    onMetadataChange:(path: string) => void;
    reloadSpaceByPath:(path: string, metadata?: SpaceDefinition) => Promise<SpaceState>;
    onPathRename:(oldPath: string, newPath: string) => Promise<void>;
    onPathCreated:(path: string) => Promise<void>;
    onPathDeleted:(path: string) => void;
    onSpaceRenamed:(oldPath: string, newSpaceInfo: SpaceInfo) => Promise<void>;
    onSpaceDeleted:(space: string) => void;
    reloadActions:(space: SpaceInfo) => Promise<boolean>;
    reloadContextByPath:(path: string, options?: {calculate?: boolean, force?: boolean}) => Promise<boolean>;
    reloadContext:(space: SpaceInfo, options?: {calculate?: boolean, force?: boolean}) => Promise<boolean>;
    contextReloaded:(path: string, cache: ContextState, changed: boolean, force?: boolean) => Promise<boolean>;
    allSpaces:(ordered?: boolean) => SpaceState[];
    spaceOrder:() => string[];
    updateSpaceMetadata:(spacePath: string, metadata: SpaceDefinition) => Promise<SpaceState>;
    reloadSpace:(space: SpaceInfo, spaceMetadata?: SpaceDefinition, initialized?: boolean) => Promise<SpaceState>;
    reloadPath:(path: string, force?: boolean) => Promise<boolean>;
    onPathReloaded:(path: string) => Promise<boolean>;
    search:(path: string, query?: string, queries?: SpaceDefGroup[]) => Promise<PathStateWithRank[]>;
    
}

export type PathStateWithRank = PathState & { rank?: number; };

