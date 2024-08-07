import { PathLabel } from "core/middleware/types/afile";
import { Superstate } from "core/superstate/superstate";
import { SpaceFragmentType } from "core/superstate/utils/spaces";
import { ActionInstance } from "core/types/actions";
import { Focus } from "core/types/focus";
import { builtinSpacePathPrefix, SpaceDefinition, SpaceType } from "core/types/space";
import { serializeOptionValue } from "core/utils/serializer";
import { parseURI } from "core/utils/uri";
import { defaultContextSchemaID } from "schemas/mdb";
import { Command, CommandResult, Library } from "types/commands";
import { Kit } from "types/kits";
import { SpaceInfo, SpaceProperty, SpaceTable, SpaceTables, SpaceTableSchema } from "types/mdb";
import { MDBFrame, MDBFrames } from "types/mframe";
import { URI } from "types/path";
import { uniq } from "utils/array";
import { parseMultiString } from "utils/parsers";

export type PathCache = {
   [key: string]: any,
   metadata: Record<string, any>,
   ctime: number,
   label: PathLabel,
   contentTypes: string[],
   tags: string[],
   type: string,
   subtype: string,
   parent: string,
   readOnly: boolean
}

//Space Manager creates an abstraction that manipulates Spaces and their Items
//Works both on local systems, non-local systems, ACLed systems and cloud systems
export abstract class SpaceAdapter {
    //authorities that this cosmoform supports
    
    public schemes: string[];
   public initiateAdapter:(manager: SpaceManager) => void;
    //basic space operations
    
    public spaceInfoForPath: (path: string) => SpaceInfo;
    public spaceDefForSpace: (path: string) => Promise<SpaceDefinition>;
    public parentPathForPath: (path: string) => string;
    public createSpace: (name: string, parentPath: string, definition: SpaceDefinition) => void
    public saveSpace: (path: string, definitionFn: (def: SpaceDefinition) => SpaceDefinition, properties?: Record<string, any>) => void
    public renameSpace: (path: string, newPath: string) => Promise<string>
    public deleteSpace: (path: string) => void
    public childrenForSpace: (path: string) => string[]
    public allPaths: (type?: string[]) => string[]
    public keysForCacheType: (type: string) => string[];
    public spaceInitiated: (path: string) => Promise<boolean>
    
    //Space Features
    public contextForSpace: (path: string) => Promise<SpaceTable>

    //Context
    public contextInitiated: (path: string) => Promise<boolean>
    public tablesForSpace: (path: string) => Promise<SpaceTableSchema[]>
    public readTable: (path: string, name: string) => Promise<SpaceTable>
    public readAllTables: (path: string) => Promise<SpaceTables>
    public createTable: (path: string, schema: SpaceTableSchema) => Promise<void>
    public saveTableSchema: (path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema) => Promise<boolean>
    public saveTable: (path: string, table: SpaceTable, force?: boolean) => Promise<boolean>
    public deleteTable: (path: string, name: string) => Promise<void>

    //Frames
    public framesForSpace: (path: string) => Promise<SpaceTableSchema[]>
    public readFrame: (path: string, name: string) => Promise<MDBFrame>
    public readAllFrames: (path: string) => Promise<SpaceTables>
    public createFrame: (path: string, schema: SpaceTableSchema) => Promise<void>
    public deleteFrame: (path: string, name: string) => Promise<void>
    public saveFrameSchema: (path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema) => Promise<boolean>
    public saveFrame: (path: string, frame: MDBFrame) => Promise<boolean>;

    //Commands
    public commandsForSpace: (path: string) => Promise<Command[]>
    public runCommand: (path: string, name: string, instance: ActionInstance) => Promise<CommandResult>
    public createCommand: (path: string, schema: SpaceTableSchema) => Promise<void>
    public deleteCommand: (path: string, name: string) => Promise<void>
    public saveCommand: (path: string, schemaId: string, saveCommand: (prev: Command) => Command) => Promise<boolean>
    public readSystemCommands: () => Promise<Library[]>
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

    public writeToPath: (path: string, content: any, binary?: boolean) => void;


    public allSpaces: () => SpaceInfo[];
    public allCaches: () => Map<string, PathCache>;
    public addProperty: (path: string, property: SpaceProperty) => void;
    public readProperties: (path: string) => Promise<{[key:string]: any}>;
    public saveProperties: (path: string, properties: {[key:string]: any}) => Promise<boolean>;
    public renameProperty: (path: string, property: string, newProperty: string) => void;
    public deleteProperty: (path: string, property: string) => void;

    public readLabel: (path: string) => Promise<PathLabel>;
    public saveLabel: (path: string, key:string, value: any) => void;

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
      public readAllTemplates: () => Promise<{[key: string]: MDBFrames}>;
      public saveFrameKit: (frames: MDBFrame, name: string) => Promise<void>;
    public saveSpaceTemplate: (frames: MDBFrames, name: string) => Promise<void>;
    public childrenForPath: (path: string, type?: string) => Promise<string[]>;

    public readFocuses: () => Promise<Focus[]>;
    public saveFocuses: (focuses: Focus[]) => Promise<void>;
    public readTemplates: (path: string) => Promise<string[]>;
    public saveTemplate: (path: string, space: string) => Promise<string>;
    public deleteTemplate: (path: string, space: string) => Promise<void>;
}




export class SpaceManager {
  
    public primarySpaceAdapter : SpaceAdapter;
    public spaceAdapters: SpaceAdapter[] = []
    public superstate: Superstate;

 
    public readSystemCommands = () => {
      return this.primarySpaceAdapter.readSystemCommands();
    }
    public saveSystemCommand = (lib: string, action: Command) => {
      return this.primarySpaceAdapter.saveSystemCommand(lib, action).then(f => this.superstate.reloadSystemActions());
    }

    public onSpaceUpdated (path: string, type: SpaceFragmentType) {
      if (!this.superstate.spacesIndex.has(path)) {
        return;
      }
      if (type == 'context') {
        this.superstate.reloadContextByPath(path);
      }
      if (type == 'frame') {
        this.superstate.dispatchEvent("frameStateUpdated", {path})
      }
      if (type == 'action') {
        this.superstate.reloadActions(this.spaceInfoForPath(path));
      }

    }

    public onFocusesUpdated = () => {
      this.readFocuses().then(f => {
        this.superstate.focuses = f    
        this.superstate.dispatchEvent("focusesChanged", null)
      });
    }

    public saveFrameKit (frames: MDBFrame, name: string) {
      return this.primarySpaceAdapter.saveFrameKit(frames, name);
    }
    public saveSpaceTemplate (frames: MDBFrames, name: string) {
      return this.primarySpaceAdapter.saveSpaceTemplate(frames, name);
    }

    public onPathCreated = async (path: string) => {
      this.superstate.onPathCreated(path);
    }

    public onPathDeleted = async (path: string) => {
      this.superstate.onPathDeleted(path);
    }

    public onPathChanged = async (path: string, oldPath: string) => {
      this.superstate.onPathRename(oldPath, path);
    }

    public onSpaceCreated = async (path: string) => {

      if (path.startsWith(this.superstate.settings.spacesFolder)) {
        await this.onSpaceCreated(path.replace(this.superstate.settings.spacesFolder, 'spaces:/'))
        return;
      }
      
      const space = await this.superstate.reloadSpace(this.spaceInfoForPath(path), null, true)
      
      await this.superstate.onSpaceDefinitionChanged(space)
      
      await this.superstate.onPathCreated(path)
     
    }
    public onSpaceRenamed = async (path: string, oldPath: string) => {
      await this.superstate.onSpaceRenamed(oldPath, this.spaceInfoForPath(path))
      await this.superstate.onPathRename(oldPath, path)
    }

    public onSpaceDeleted = async (path: string) => {
      this.superstate.onSpaceDeleted(path)
      this.superstate.onPathDeleted(path)
    }

    

    public onPathPropertyChanged = async (path: string) => {
      this.superstate.onMetadataChange(path)
    }

    public resolvePath(path: string, source?: string) {
      if (!source || !path) return path;
      if (path.indexOf('http') == 0) return path;
      if (path.indexOf('|') != -1) {
        path = path.split('|')[0];
      }
      if (path.indexOf('./') == 0 && source) {
        if (this.superstate.spacesIndex.has(source))
          return source + path.slice(1);
        return source.slice(0, source.lastIndexOf('/')) + path.slice(1);
      } else if (path.indexOf('../') == 0 && source) {
        const sourceParts = source.split('/');
    const pathParts = path.split('/');
    while (pathParts[0] === '..') {
      sourceParts.pop();
      pathParts.shift();
    }
    return [...sourceParts, ...pathParts].join('/');
      }
      if (this.superstate.pathsIndex.has(path)) return path;
      return this.primarySpaceAdapter.resolvePath(path, source) ?? path;
    }
    public uriByString(uri: string, source?: string): URI {
      if (!uri) return null;
      
      if (source) {
        uri = this.resolvePath(uri, source);
        if (!uri) return null;
      }
      return parseURI(uri); 
    }

    public spaceTypeByString = (uri: URI): SpaceType => {
      
      if (uri.fullPath.startsWith(builtinSpacePathPrefix)) {
        return 'default';
      }
      if (uri.scheme == 'space') {
        return "folder";
      }
      if (uri.authority?.charAt(0) == "#") {
        return "tag";
      }
      if (uri.path.charAt(uri.path.length - 1) == "/") {
        if (uri.path == '/') return 'vault'
        return "folder";
      }
      return "folder";
    };

    public async allCaches () {
      const caches = new Map<string, PathCache>();
      const keys = this.primarySpaceAdapter.allCaches().keys();
      for (const key of keys) {
        const cache = await this.readPathCache(key);
        caches.set(key, cache);
      }
      return caches;
    }
    public keysForCacheType (type: string) {
      return this.primarySpaceAdapter.keysForCacheType(type);
    }
    public pathExists (path: string)  {
         return this.primarySpaceAdapter.pathExists(path);
    }
    public addSpaceAdapter (spaceAdapter: SpaceAdapter, primary?: boolean) {
      spaceAdapter.initiateAdapter(this);
        if (primary)
        this.primarySpaceAdapter = spaceAdapter;
      
        this.spaceAdapters.push(spaceAdapter);
    }

    public adapterForPath (path: string) {
      const uri = this.uriByString(path);
      if (!uri) return this.primarySpaceAdapter;
      return this.spaceAdapters.find(f => f.schemes.includes(uri.scheme)) ?? this.primarySpaceAdapter;
    }
     //basic space operations
     public createSpace (name: string, parentPath: string, definition: SpaceDefinition) {
        return this.adapterForPath(parentPath).createSpace(name, parentPath, definition);
     }
     public saveSpace (path: string, definition: (def: SpaceDefinition) => SpaceDefinition, properties?: Record<string, any>) {
        return this.adapterForPath(path).saveSpace(path, definition, properties);
     }
     public renameSpace (path: string, newPath: string) {
        return this.adapterForPath(path).renameSpace(path, newPath);
     }
     public deleteSpace (path: string) {
        return this.adapterForPath(path).deleteSpace(path);
     }
     public childrenForSpace (path: string) {
        return this.adapterForPath(path).childrenForSpace(path);
     }
     public contextForSpace (path: string) {
         return this.adapterForPath(path).contextForSpace(path);
      }
      public async tablesForSpace (path: string) {
         return this.adapterForPath(path).tablesForSpace(path);
      }  
      public spaceInitiated (path: string) {
        return this.adapterForPath(path).spaceInitiated(path);
      }
      public contextInitiated (path: string) {
        return this.adapterForPath(path).contextInitiated(path);
      }
      public readTable (path: string, schema: string) {
         return this.adapterForPath(path).readTable(path, schema);
      }

      public createTable (path: string, schema: SpaceTableSchema) {
        
         return this.adapterForPath(path).createTable(path, schema).then(f => 
          this.superstate.reloadContextByPath(path));
      }
    
    public saveTableSchema (path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema) {
      
      return this.adapterForPath(path).saveTableSchema(path, schemaId, saveSchema).then(f => {
        if (f)
        return this.superstate.reloadContextByPath(path)
      return f});
    }
    public saveTable (path: string, table: SpaceTable, force?: boolean) {
      
      return this.adapterForPath(path).saveTable(path, table, force)
    }
    public deleteTable (path: string, name: string) {
      
      return this.adapterForPath(path).deleteTable(path, name).then(f => {
        return this.superstate.reloadContextByPath(path)});
    }

    public readAllKits () {
      return this.primarySpaceAdapter.readAllKits();
    }

    public readAllTemplates () {
      return this.primarySpaceAdapter.readAllTemplates();
    }
    public readAllTables (path: string) {
      return this.adapterForPath(path).readAllTables(path);
    }
      public framesForSpace (path: string) {
         return this.adapterForPath(path).framesForSpace(path);
      }
      public readFrame (path: string, schema: string) {
         return this.adapterForPath(path).readFrame(path, schema);
      }

      public readAllFrames (path: string) {
         return this.adapterForPath(path).readAllFrames(path);
      }

    public createFrame (path: string, schema: SpaceTableSchema) {
      return this.adapterForPath(path).createFrame(path, schema).then(f =>
        this.superstate.dispatchEvent("frameStateUpdated", {path: this.spaceInfoForPath(path).path, schemaId: schema.id}))
    }
    
    public deleteFrame (path: string, name: string) {
      return this.adapterForPath(path).deleteFrame(path, name);
    }
    public saveFrameSchema (path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema) {
      return this.adapterForPath(path).saveFrameSchema(path, schemaId, saveSchema).then(f =>
        this.superstate.dispatchEvent("frameStateUpdated", {path: this.spaceInfoForPath(path).path, schemaId: schemaId}))
    }

    public saveFrame (path: string, frame: MDBFrame) {
      return this.adapterForPath(path).saveFrame(path, frame).then(f =>
     this.superstate.dispatchEvent("frameStateUpdated", {path: this.spaceInfoForPath(path).path, schemaId: frame.schema.id}))
    }
 
    public commandsForSpace (path: string) {
      return this.adapterForPath(path).commandsForSpace(path);
    }
    public runCommand (path: string, name: string, instance: ActionInstance) {
      return this.adapterForPath(path).runCommand(path, name, instance);
    }
    public createCommand (path: string, schema: SpaceTableSchema) {
      return this.adapterForPath(path).createCommand(path, schema).then(f => 
        this.superstate.reloadActions(this.spaceInfoForPath(path)));
    }
    public deleteCommand (path: string, name: string) {
      return this.adapterForPath(path).deleteCommand(path, name).then(f => 
        this.superstate.reloadActions(this.spaceInfoForPath(path)));
    }
    public saveCommand (path: string, schemaId: string, saveCommand: (prev: Command) => Command) {
      return this.adapterForPath(path).saveCommand(path, schemaId, saveCommand).then(f => 
        this.superstate.reloadActions(this.spaceInfoForPath(path)));
    }
     //basic item operations
     public allPaths (type?: string[]) {
         return this.primarySpaceAdapter.allPaths(type);
       }
     public createItemAtPath (parent: string, type: string, name: string, content?: any) :Promise<string> {
        return this.adapterForPath(parent).createItemAtPath(parent, type, name, content);
     }
     public renamePath (oldPath: string, newPath: string) {
        return this.adapterForPath(oldPath).renamePath(oldPath, newPath);
     }
     public copyPath(source: string, destination: string, newName?: string) {
        return this.adapterForPath(source).copyPath(source, destination, newName);
     }
     public getPathInfo (path: string) {
        return this.adapterForPath(path).getPathInfo(path);
     }
     public deletePath (path: string) {
        return this.adapterForPath(path).deletePath(path);
     }
     public readPath (path: string) {
        return this.adapterForPath(path).readPath(path);
     }
     
     public writeToPath (path: string, content: any, binary?: boolean) {

        return this.adapterForPath(path).writeToPath(path, content, binary);
     }
     public parentPathForPath (path: string) {
         return this.adapterForPath(path).parentPathForPath(path);
       }

       public async readPathCache (path: string) {
        const pathCache = await this.adapterForPath(path).readPathCache(path);
        if (pathCache && pathCache.type == 'space' && !this.superstate.settings.enableFolderNote) {
          const defPath = this.spaceInfoForPath(path).defPath
          
          pathCache.label = {...pathCache.label, ...(await this.readLabel(defPath))};
          pathCache.property = await this.readProperties(defPath)
        }
         return pathCache;
       }
 
     
     public allSpaces () {
        return this.primarySpaceAdapter.allSpaces();
     }
 
     //Local SpaceInfo for Path
     public spaceInfoForPath (path: string) {
        return this.adapterForPath(path).spaceInfoForPath(path);
     }
     public spaceDefForSpace (path: string) {
        return this.adapterForPath(path).spaceDefForSpace(path);
     }
     
     public readLabel (path: string) {
        return this.adapterForPath(path).readLabel(path);
     }
      public saveLabel (path: string, key:string, value: any) {
          return this.adapterForPath(path).saveLabel(path, key, value);
      }
     public addProperty(path: string, property: SpaceProperty) {
        return this.adapterForPath(path).addProperty(path, property);
     }
     public saveProperties (path: string, properties: {[key:string]: any}) {

      if (!path) return;
        return this.adapterForPath(path).saveProperties(path, properties);
     }
       public readProperties (path: string) {
         return this.adapterForPath(path).readProperties(path);
       }
       public renameProperty (path: string, property: string, newProperty: string) {
         return this.adapterForPath(path).renameProperty(path, property, newProperty);
       }
     public deleteProperty (path: string, property: string) {
        return this.adapterForPath(path).deleteProperty(path, property);
     }
 
     public addSpaceProperty (path: string, property: SpaceProperty) {
      if (
        property.schemaId == defaultContextSchemaID &&
        property.type.startsWith("option")
      ) {
        const allOptions = uniq([...this.superstate.spacesMap.getInverse(path) ?? []].flatMap(f => parseMultiString(this.superstate.pathsIndex.get(f)?.metadata?.property?.[property.name]) ?? []));
        const values = serializeOptionValue(allOptions.map(f => ({ value: f, name: f })), {});
        property.value = values;
      }
        return this.adapterForPath(path).addSpaceProperty(path, property).then(f => 
          this.superstate.reloadContextByPath(path));
     
     }
     public deleteSpaceProperty (path: string, property: SpaceProperty) {
        return this.adapterForPath(path).deleteSpaceProperty(path, property).then(f => 
          this.superstate.reloadContextByPath(path));
     }
     public saveSpaceProperty (path: string, property: SpaceProperty, oldProperty: SpaceProperty) {

        return this.adapterForPath(path).saveSpaceProperty(path, property, oldProperty).then(f => 
          {
            if (oldProperty.name != property.name) {
              this.superstate.getSpaceItems(path).forEach(f => {
                this.renameProperty(f.path, oldProperty.name, property.name);
              })
            }
            return this.superstate.reloadContextByPath(path)
          });
     }
 
    public addTag (path: string, tag: string) {  
        return this.adapterForPath(path).addTag(path, tag);
    }

    public deleteTag (path: string, tag: string) {
        return this.adapterForPath(path).deleteTag(path, tag);
    }

    public renameTag (path: string, tag: string, newTag: string) {
        return this.adapterForPath(path).renameTag(path, tag, newTag);
    }
    public readTags () {
         return this.primarySpaceAdapter.readTags();
    }
    public pathsForTag (tag: string) {
        return this.primarySpaceAdapter.pathsForTag(tag);
    }
    public childrenForPath (path: string, type?: string) {
        return this.adapterForPath(path).childrenForPath(path, type);
    }
    public readFocuses () {
        return this.primarySpaceAdapter.readFocuses();
    }
    public saveFocuses (focuses: Focus[]) {
      this.superstate.focuses = focuses;
      this.superstate.dispatchEvent("focusesChanged", null)
        return this.primarySpaceAdapter.saveFocuses(focuses);
    }
    public readTemplates (path:string) {
        return this.adapterForPath(path).readTemplates(path);
    }
    public saveTemplate (path: string, space: string) {
        return this.adapterForPath(path).saveTemplate(path, space).then(f => this.superstate.reloadSpace(this.spaceInfoForPath(space), null, true));
    }
    public deleteTemplate (template: string, space: string) {
        return this.primarySpaceAdapter.deleteTemplate(template, space).then(f => this.superstate.reloadSpace(this.spaceInfoForPath(space), null, true));
    }
}