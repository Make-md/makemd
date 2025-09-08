import { ActionInstance } from "shared/types/actions";
import { PathLabel } from "shared/types/caches";
import { Command, CommandResult, Library } from "shared/types/commands";
import { Focus } from "shared/types/focus";
import { Kit } from "shared/types/kits";
import { URI } from "shared/types/path";
import { PathCache } from "./caches";
import { SpaceProperty, SpaceTable, SpaceTableSchema, SpaceTables } from "./mdb";
import { MDBFrame, MDBFrames } from "./mframe";
import { SpaceDefinition, SpaceType } from "./spaceDef";
import { SpaceFragmentType } from "./spaceFragment";
import { SpaceInfo } from "./spaceInfo";
import { ISuperstate } from "./superstate";

export interface SpaceManagerInterface {
  primarySpaceAdapter: SpaceAdapter;
  spaceAdapters: SpaceAdapter[];
  superstate: ISuperstate;
  loadPath: (path: string) => Promise<PathCache | void>;
    readSystemCommands(): Promise<Library[]>;
    saveSystemCommand(lib: string, action: Command): Promise<void>;
    onSpaceUpdated(path: string, type: SpaceFragmentType): void;
    onFocusesUpdated(): void;
    saveFrameKit(frames: MDBFrame, name: string): Promise<void>;
    saveSpaceTemplate(frames: MDBFrames, name: string): Promise<void>;
    onPathCreated(path: string): Promise<void>;
    onPathDeleted(path: string): Promise<void>;
    onPathChanged(path: string, oldPath: string): Promise<void>;
    onSpaceCreated(path: string): Promise<void>;
    onSpaceRenamed(path: string, oldPath: string): Promise<void>;
    onSpaceDeleted(path: string): Promise<void>;
    onPathPropertyChanged(path: string): Promise<void>;
    resolvePath(path: string, source?: string): string;
    uriByString(uri: string, source?: string): URI;
    spaceTypeByString(uri: URI): SpaceType;
    allCaches(): Promise<Map<string, PathCache>>;
    keysForCacheType(type: string): string[];
    pathExists(path: string): Promise<boolean>;
    addSpaceAdapter(spaceAdapter: SpaceAdapter, primary?: boolean): void;
    adapterForPath(path: string): SpaceAdapter;
    createSpace(name: string, parentPath: string, definition: SpaceDefinition): void;
    saveSpace(path: string, definition: (def: SpaceDefinition) => SpaceDefinition, properties?: Record<string, any>): void;
    renameSpace(path: string, newPath: string): Promise<string>;
    deleteSpace(path: string): void;
    childrenForSpace(path: string): string[];
    contextForSpace(path: string): Promise<SpaceTable>;
    tablesForSpace(path: string): Promise<SpaceTableSchema[]>;
    spaceInitiated(path: string): Promise<boolean>;
    contextInitiated(path: string): Promise<boolean>;
    readTable(path: string, schema: string): Promise<SpaceTable>;
    createTable(path: string, schema: SpaceTableSchema): Promise<boolean>;
    saveTableSchema(path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema): Promise<boolean>;
    saveTable(path: string, table: SpaceTable, force?: boolean): Promise<boolean>;
    deleteTable(path: string, name: string): Promise<boolean>;
    readAllKits(): Promise<Kit[]>;
    readAllTemplates(): Promise<{ [key: string]: MDBFrames }>;
    readAllTables(path: string): Promise<SpaceTables>;
    framesForSpace(path: string): Promise<SpaceTableSchema[]>;
    readFrame(path: string, schema: string): Promise<MDBFrame>;
    readAllFrames(path: string): Promise<MDBFrames>;
    createFrame(path: string, schema: SpaceTableSchema): Promise<void>;
    deleteFrame(path: string, name: string): Promise<void>;
    saveFrameSchema(path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema): Promise<void>;
    saveFrame(path: string, frame: MDBFrame): Promise<void>;
    commandsForSpace(path: string): Promise<Command[]>;
    runCommand(path: string, name: string, instance: ActionInstance): Promise<CommandResult>;
    createCommand(path: string, schema: SpaceTableSchema): Promise<boolean>;
    deleteCommand(path: string, name: string): Promise<boolean>;
    saveCommand(path: string, schemaId: string, saveCommand: (prev: Command) => Command): Promise<boolean>;
    allPaths(type?: string[]): string[];
    createItemAtPath(parent: string, type: string, name: string, content?: any): Promise<string>;
    renamePath(oldPath: string, newPath: string): Promise<string>;
    copyPath(source: string, destination: string, newName?: string): Promise<string>;
    getPathInfo(path: string): Promise<Record<string, any>>;
    deletePath(path: string): void;
    readPath(path: string): Promise<string>;
    writeToPath(path: string, content: any, binary?: boolean): Promise<void>;
    parentPathForPath(path: string): string;
    readPathCache(path: string): Promise<PathCache>;
    allSpaces(): SpaceInfo[];
    spaceInfoForPath(path: string): SpaceInfo;
    spaceDefForSpace(path: string): Promise<SpaceDefinition>;
    readLabel(path: string): Promise<PathLabel>;
    saveLabel(path: string, key: string, value: any): void;
    addProperty(path: string, property: SpaceProperty): void;
    saveProperties(path: string, properties: { [key: string]: any }): Promise<boolean>;
    readProperties(path: string): Promise<{ [key: string]: any }>;
    renameProperty(path: string, property: string, newProperty: string): void;
    deleteProperty(path: string, property: string): void;
    addSpaceProperty(path: string, property: SpaceProperty): Promise<boolean>;
    deleteSpaceProperty(path: string, property: SpaceProperty): Promise<boolean>;
    saveSpaceProperty(path: string, property: SpaceProperty, oldProperty: SpaceProperty): Promise<boolean>;
    addTag(path: string, tag: string): void;
    deleteTag(path: string, tag: string): void;
    renameTag(path: string, tag: string, newTag: string): void;
    readTags(): string[];
    pathsForTag(tag: string): string[];
    childrenForPath(path: string, type?: string): Promise<string[]>;
    readFocuses(): Promise<Focus[]>;
    saveFocuses(focuses: Focus[]): Promise<void>;
    readTemplates(path: string): Promise<string[]>;
    saveTemplate(path: string, space: string): Promise<string>;
    deleteTemplate(template: string, space: string): Promise<void>;
  }
//Space Manager creates an abstraction that manipulates Spaces and their Items
//Works both on local systems, non-local systems, ACLed systems and cloud systems

export abstract class SpaceAdapter {
  //authorities that this cosmoform supports
  public schemes: string[];
  public loadPath: (path: string) => Promise<PathCache | void>;
  public initiateAdapter: (manager: SpaceManagerInterface) => void;
  //basic space operations
  public spaceInfoForPath: (path: string) => SpaceInfo;
  public spaceDefForSpace: (path: string) => Promise<SpaceDefinition>;
  public parentPathForPath: (path: string) => string;
  public createSpace: (name: string, parentPath: string, definition: SpaceDefinition) => void;
  public saveSpace: (path: string, definitionFn: (def: SpaceDefinition) => SpaceDefinition, properties?: Record<string, any>) => void;
  public renameSpace: (path: string, newPath: string) => Promise<string>;
  public deleteSpace: (path: string) => void;
  public childrenForSpace: (path: string) => string[];
  public allPaths: (type?: string[]) => string[];
  public keysForCacheType: (type: string) => string[];
  public spaceInitiated: (path: string) => Promise<boolean>;

  //Space Features
  public contextForSpace: (path: string) => Promise<SpaceTable>;

  //Context
  public contextInitiated: (path: string) => Promise<boolean>;
  public tablesForSpace: (path: string) => Promise<SpaceTableSchema[]>;
  public readTable: (path: string, name: string) => Promise<SpaceTable>;
  public readAllTables: (path: string) => Promise<SpaceTables>;
  public createTable: (path: string, schema: SpaceTableSchema) => Promise<void>;
  public saveTableSchema: (path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema) => Promise<boolean>;
  public saveTable: (path: string, table: SpaceTable, force?: boolean) => Promise<boolean>;
  public deleteTable: (path: string, name: string) => Promise<void>;

  //Frames
  public framesForSpace: (path: string) => Promise<SpaceTableSchema[]>;
  public readFrame: (path: string, name: string) => Promise<MDBFrame>;
  public readAllFrames: (path: string) => Promise<MDBFrames>;
  public createFrame: (path: string, schema: SpaceTableSchema) => Promise<void>;
  public deleteFrame: (path: string, name: string) => Promise<void>;
  public saveFrameSchema: (path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema) => Promise<boolean>;
  public saveFrame: (path: string, frame: MDBFrame) => Promise<boolean>;

  //Commands
  public commandsForSpace: (path: string) => Promise<Command[]>;
  public runCommand: (path: string, name: string, instance: ActionInstance) => Promise<CommandResult>;
  public createCommand: (path: string, schema: SpaceTableSchema) => Promise<void>;
  public deleteCommand: (path: string, name: string) => Promise<void>;
  public saveCommand: (path: string, schemaId: string, saveCommand: (prev: Command) => Command) => Promise<boolean>;
  public readSystemCommands: () => Promise<Library[]>;
  public saveSystemCommand: (lib: string, action: Command) => Promise<void>;

  //basic item operations
  public resolvePath: (path: string, source: string) => string;
  public pathExists: (path: string) => Promise<boolean>;
  public createItemAtPath: (parent: string, type: string, name: string, content: any) => Promise<string>;
  public renamePath: (oldPath: string, newPath: string) => Promise<string>;
  public copyPath: (source: string, destination: string, newName?: string) => Promise<string>;
  public getPathInfo: (path: string) => Promise<Record<string, any>>;
  public deletePath: (path: string) => void;
  public readPath: (path: string) => Promise<string>;

  public readPathCache: (path: string) => Promise<PathCache>;

  public writeToPath: (path: string, content: any, binary?: boolean) => Promise<void>;


  public allSpaces: () => SpaceInfo[];
  public allCaches: () => Map<string, PathCache>;
  public addProperty: (path: string, property: SpaceProperty) => void;
  public readProperties: (path: string) => Promise<{ [key: string]: any; }>;
  public saveProperties: (path: string, properties: { [key: string]: any; }) => Promise<boolean>;
  public renameProperty: (path: string, property: string, newProperty: string) => void;
  public deleteProperty: (path: string, property: string) => void;

  public readLabel: (path: string) => Promise<PathLabel>;
  public saveLabel: (path: string, key: string, value: any) => void;

  public addSpaceProperty: (path: string, property: SpaceProperty) => Promise<void>;
  public deleteSpaceProperty: (path: string, property: SpaceProperty) => Promise<void>;
  public saveSpaceProperty: (path: string, property: SpaceProperty, oldProperty: SpaceProperty) => Promise<boolean>;

  //tag management
  public addTag: (path: string, tag: string) => void;
  public deleteTag: (path: string, tag: string) => void;
  public renameTag: (path: string, tag: string, newTag: string) => void;
  public readTags: () => string[];

  public pathsForTag: (tag: string) => string[];
  public readAllKits: () => Promise<Kit[]>;
  public readAllTemplates: () => Promise<{ [key: string]: MDBFrames; }>;
  public saveFrameKit: (frames: MDBFrame, name: string) => Promise<void>;
  public saveSpaceTemplate: (frames: MDBFrames, name: string) => Promise<void>;
  public childrenForPath: (path: string, type?: string) => Promise<string[]>;

  public readFocuses: () => Promise<Focus[]>;
  public saveFocuses: (focuses: Focus[]) => Promise<void>;
  public readTemplates: (path: string) => Promise<string[]>;
  public saveTemplate: (path: string, space: string) => Promise<string>;
  public deleteTemplate: (path: string, space: string) => Promise<void>;
}
  