
import { PathLabel } from "core/middleware/types/afile";

import { Focus } from "core/types/focus";
import { SpaceDefinition } from "core/types/space";
import { defaultContextSchemaID } from "schemas/mdb";
import { Command, CommandResult, Library } from "types/commands";
import { Kit, SpaceKit } from "types/kits";
import { SpaceInfo, SpaceProperty, SpaceTable, SpaceTableSchema, SpaceTables } from "types/mdb";
import { MDBFrame, MDBFrames } from "types/mframe";
import { PathCache, SpaceAdapter, SpaceManager } from "../spaceManager";
import { WebCacher } from "./webCache";




export class WebSpaceAdapter implements SpaceAdapter {
    public webCache : WebCacher;
    public constructor() {
        this.webCache = new WebCacher(this)
    }
  
   public spaceManager: SpaceManager;
   public schemes = ['http', 'https']
    public initiateAdapter(manager: SpaceManager) {
      this.spaceManager = manager;
    }

    public async readTemplates (path: string) : Promise<string[]> {
      return []
    }

    onNoteCreate = async (path: string, content: string) => {

        this.spaceManager.onPathCreated(path)
  
        }

    onCreate = async (path: string, kit: SpaceKit) => {
      
      const space = this.spaceInfoForPath(path)
      await this.spaceManager.onSpaceCreated(path)
      await this.spaceManager.superstate.reloadContext(space);
      };

    public async saveTemplate (path: string, space: string) : Promise<string> {
        return null
    }
    public deleteTemplate (path: string, space: string) : Promise<void> {
      return
    }
    public async readWaypoints () : Promise<Focus[]> {
      return []
    }
    public async saveWaypoints (waypoints: Focus[]) {
      return
    }

    public async readTemplate (name: string) {
      return
    }
    
    public async readAllKits () : Promise<Kit[]> {
      return []
    }

    public async readAllTemplates () : Promise<{[key: string]: MDBFrames}> {
      return {}
    }
    public async readKitFrames (name: string) : Promise<MDBFrames> {
      return {}
      
    }
    public async saveFrameKit (frames: MDBFrame, name: string) {
      return;
    }
    public async saveSpaceTemplate (frames: MDBFrames, name: string) {
      return;
    }

    
    
    public allPaths (type?: string[]) : string[] {
      return [];
    }
    public async pathExists (path: string) {
      if (!path.startsWith("https://www.make.md")) return false;
      return true;
    }
  public async createItemAtPath (parent: string, type: string, name: string, content?: any) : Promise<string> {
    return null;
  }
  public async renamePath (oldPath: string, path: string) {
    return
  }
  public async deletePath (path: string) {
    return;
  }

  public async getPathInfo (path: string) {
    return {}
  }

  
  public keysForCacheType (path: string) : string[] {
    return null
  }

  public async readPathCache (path: string) : Promise<PathCache> {
    
    if (this.webCache.notes.has(path)) {
      return {
        metadata: { properties: {}},
        type: "remote",
        ctime: 0,
        subtype: "note",
        contentTypes: [],
        tags: [],
        readOnly: true,
        label: {
          name: this.webCache.notes.get(path).name,
          sticker: this.webCache.notes.get(path).properties.sticker,
          color: null
        },
        parent: [...this.webCache.parentMap.get(path)]?.[0],
      
      }
    }
    const space = await this.webCache.load(path);
    return {
      metadata: { properties: space.properties},
      ctime: 0,
      type: "space",
      subtype: "web",
      contentTypes: [],
      tags: [],
      readOnly: true,
      label: {
        name: space.name,
        sticker: space.properties.sticker,
        color: space.properties.color
    },
      parent: [...this.webCache.parentMap.get(path)]?.[0],
    }
  }
  public async readPath (path: string) {
    
    return this.webCache.notes.get(path).content;
  }
  public async copyPath (path: string, newPath: string, newName?: string) : Promise<string> {

    return
    }
  public async writeToPath (path: string, content: any, binary: boolean) {
    return
  }
  
  public async childrenForPath (path: string, type?: string): Promise<string[]> {
  return [...this.webCache.parentMap.getInverse(path)]
  }

  public parentPathForPath (path: string) : string {
    // const uri = this.uriByPath(path);
    // const file = await this.fileSystem.getFile(uri.path);
    // if (uri.refStr) {
    //   return file.path
    // }
    return [...this.webCache.parentMap.get(path)]?.[0];
  }
  public async readFrame (path: string, schema: string) : Promise<MDBFrame> {
    const space = await this.webCache.load(path);
    return space.frames[schema] as MDBFrame;
  }

  public async readAllFrames (path: string) : Promise<MDBFrames> {
    const space = await this.webCache.load(path);
    return space.frames as MDBFrames;
  }
  
  public async readTable (path: string, schema: string): Promise<SpaceTable> {
    const space = await this.webCache.load(path);
    return space.context[schema]
  }
  public async spaceInitiated (path: string) {
    if (this.webCache.cache.has(path)) return true;
    return false;
  
  }
public async contextInitiated (path: string) {
  if (this.webCache.cache.has(path)) return true;
  return false;
}
  public async tablesForSpace (path: string) : Promise<SpaceTableSchema[]> {
    const space = await this.webCache.load(path);
    return Object.values(space.context).map(f => f.schema)
  }


  
  public async createTable (path: string, schema: SpaceTableSchema) {
    
    return;
  }
  
  public async saveTableSchema (path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema) {
    
    return false;
  }

  public async saveTable (path: string, table: SpaceTable, force?: boolean) {

    return false;
  }
  public async deleteTable (path: string, name: string) {
    return;
  }

  public async readAllTables (path: string) : Promise<SpaceTables> {
    const space = await this.webCache.load(path);
    return space.context
  }

  public async framesForSpace (path: string) : Promise<SpaceTableSchema[]> {
    const space = await this.webCache.load(path);
    return Object.values(space.frames).map(f => f.schema)
  }
  

  public async createFrame (path: string, schema: SpaceTableSchema) {
    
    return
  }
  public async deleteFrame (path: string, name: string) {
    return
  }
  public async saveFrameSchema (path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema) {
    
    return false
  }
  
  public async saveFrame (path: string, frame: SpaceTable) {
    
    return false
  }

  

  public async commandsForSpace (path: string) : Promise<Command[]> {
    
    return []
  }

  public async runCommand (path: string, name: string, args: any) : Promise<CommandResult> {
    
    return null
  }
  public async createCommand (path: string, schema: SpaceTableSchema) {
    
    
    return
  
  }

  public async readSystemCommands (): Promise<Library[]> {
    
      return []
  }

  public async readLibraryCommands (name: string) : Promise<Command[]> {
    return []
    
  }

  public async saveSystemCommand (lib: string, command: Command) {
    return;
  }
  public async deleteCommand (path: string, name: string) {
    
    return
  }
  public async saveCommand (path: string, schemaId: string, saveCommand: (prev: Command) => Command) {
    
    return false
  }

  public async contextForSpace (path: string) : Promise<SpaceTable> {
    
    return null
  }
  
  public async addSpaceProperty (path: string, property: SpaceProperty) {
    return;
  }
  public async deleteSpaceProperty (path: string, property: SpaceProperty) {
    return;
  }
  
  public async saveSpaceProperty (path: string, property: SpaceProperty, oldProperty: SpaceProperty) {
    return false;
  }
  public async addProperty (path: string, property: SpaceProperty) {
    return;
  }

  public async readLabel (path: string) : Promise<PathLabel> {
    return null
  }

  public async saveLabel (path: string, label: keyof PathLabel, value: any) {
    return;
  }

  public async renameProperty (path: string, property: string, newProperty: string) {
    return;
    }
  public async readProperties (path: string) : Promise<SpaceProperty[]> {
    const space = await this.webCache.load(path);
    return space.context[defaultContextSchemaID].cols
  }
  public async deleteProperty (path: string, property: string) {
    return;
  }
public async saveProperties (path: string, properties: SpaceProperty[]) {
    return
    }
    
      

    public allSpaces () : SpaceInfo[]  {
      // if (this.spaceManager.superstate.settings.enableTagSpaces) {
        
        return []
    }

    public readTags () : string[]{
      return []
    }

    //Local SpaceInfo for Path
    public spaceInfoForPath (path: string) : SpaceInfo {
      return {
        name: path.split("/").pop(),
    
        path: path,
        isRemote: true,
        readOnly: true,
        defPath: path + '/.def',
        notePath: path,
      };
    }

    public allCaches () : Map<string, PathCache> {
        return new Map();
    }

    public async spaceDefForSpace (path: string) : Promise<SpaceDefinition> {
      const space = await this.webCache.load(path)
        return space.definition
    }

    public async createSpace (name: string, parentPath: string, definition: SpaceDefinition) {

        return;
    }

    public async saveSpace (path: string, definitionFn: (def: SpaceDefinition) => SpaceDefinition, properties?: Record<string, any>) {
      
      return;
    }

    public renameSpace (oldPath: string, newPath: string) {
      return;
    }
    public deleteSpace (path: string) {
      return;
    }

    public childrenForSpace (path: string) : string[] {

      return [...this.webCache.parentMap.getInverse(path)]
    }

    public addTag (path: string, tag: string) {
      return;
    }

    public renameTag (path: string, tag: string, newTag: string) {
      return;
    }

    public deleteTag (path: string, tag: string) {
      return
    }

    public pathsForTag (tag: string) : string[] {
      return []
    }

    public resolvePath (path: string, source: string) : string {
      return path
    }
    
}