import { PathLabel } from "core/middleware/types/afile";
import { Superstate } from "core/superstate/superstate";
import { SpaceDefinition, SpaceType } from "core/types/space";
import { SpaceInfo, SpaceProperty, SpaceTable, SpaceTableSchema, SpaceTables } from "types/mdb";
import { MDBFrame } from "types/mframe";
import { URI } from "types/path";
import { removeTrailingSlashFromFolder } from "utils/path";

export type PathCache = {
   [key: string]: any,
   metadata: Record<string, any>
   label: PathLabel,
   tags: string[],
   type: string,
   parent: string
}

//Space Manager creates an abstraction that manipulates Spaces and their Items
//Works both on local systems, non-local systems, ACLed systems and cloud systems
export abstract class SpaceAdapter {
    //authorities that this cosmoform supports
    
    public authorities: string[];
   public initiateAdapter:(manager: SpaceManager) => void;
    //basic space operations
    public spaceInfoForPath: (path: string) => SpaceInfo;
    public spaceDefForSpace: (path: string) => Promise<SpaceDefinition>;
    public parentForPath: (path: string) => Promise<string>;
    public createSpace: (name: string, parentPath: string, definition: SpaceDefinition) => void
    public saveSpace: (path: string, definitionFn: (def: SpaceDefinition) => SpaceDefinition, properties?: Record<string, any>) => void
    public renameSpace: (path: string, newPath: string) => void
    public deleteSpace: (path: string) => void
    public childrenForSpace: (path: string) => string[]
    public allPaths: (type?: string[]) => string[]

    //Space Features
    public contextForSpace: (path: string) => Promise<SpaceTable>

    public tablesForSpace: (path: string) => Promise<SpaceTableSchema[]>
    public readTable: (path: string, name: string) => Promise<SpaceTable>
    public readAllTables: (path: string) => Promise<SpaceTables>
    public createTable: (path: string, schema: SpaceTableSchema) => Promise<void>
    public saveTableSchema: (path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema) => Promise<void>
    public saveTable: (path: string, table: SpaceTable, force?: boolean) => Promise<void>
    public deleteTable: (path: string, name: string) => Promise<void>

    public framesForSpace: (path: string) => Promise<SpaceTableSchema[]>
    public readFrame: (path: string, name: string) => Promise<MDBFrame>
    public readAllFrames: (path: string) => Promise<SpaceTables>
    public createFrame: (path: string, schema: SpaceTableSchema) => Promise<void>
    public deleteFrame: (path: string, name: string) => Promise<void>
    public saveFrameSchema: (path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema) => Promise<void>
    public saveFrame: (path: string, frame: MDBFrame) => Promise<void>;

    //basic item operations
    public resolvePath: (path: string, source: string) => string;
    public pathExists: (path: string) => Promise<boolean>;
    public createItemAtPath: (parent: string, type: string, name: string, content: any) => Promise<string>;
    public renamePath: (oldPath: string, newPath: string) => void;
      public copyPath: (source: string, destination: string) => void;
    public deletePath: (path: string) => void;
    public readPath: (path: string) => Promise<string>;

    public readPathCache: (path: string) => PathCache;

    public writeToPath: (path: string, content: any, binary?: boolean) => void;


    public allSpaces: () => SpaceInfo[];
    public allCaches: () => Map<string, PathCache>;
    public addProperty: (path: string, property: SpaceProperty) => void;
    public readProperties: (path: string) => Promise<{[key:string]: any}>;
    public saveProperties: (path: string, properties: {[key:string]: any}) => void;
    public renameProperty: (path: string, property: string, newProperty: string) => void;
    public deleteProperty: (path: string, property: string) => void;

    public readLabel: (path: string) => void;
    public saveLabel: (path: string, key:string, value: any) => void;

    public addSpaceProperty: (path: string, property: SpaceProperty) => void;
    public deleteSpaceProperty: (path: string, property: SpaceProperty) => void;
    public saveSpaceProperty: (path: string, property: SpaceProperty, oldProperty: SpaceProperty) => void;

    //tag management
    public addTag: (path: string, tag: string) => void;
    public deleteTag: (path: string, tag: string) => void;
    public renameTag: (path: string, tag: string, newTag: string) => void;
      public readTags: () => string[];

      public pathsForTag: (tag: string) => string[];
}




export class SpaceManager {
  
    public primarySpaceAdapter : SpaceAdapter;
    public spaceAdapters: SpaceAdapter[] = []
    public superstate: Superstate;





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
      await this.superstate.reloadSpace(this.spaceInfoForPath(path), null, true)
      this.superstate.onPathCreated(path)
    }
    public onSpaceRenamed = async (path: string, oldPath: string) => {
      this.superstate.onSpaceRenamed(oldPath, this.spaceInfoForPath(path))
    }

    public onSpaceDeleted = async (path: string) => {
      this.superstate.onSpaceDeleted(path)
      this.superstate.onPathDeleted(path)
    }

    public onSpaceDefinitionChanged = async (path: string) => {
      this.superstate.reloadSpace(this.spaceInfoForPath(path))
    }

    public onSpacePropertyChanged = async (path: string) => { 
      this.superstate.reloadSpace(this.spaceInfoForPath(path))
    }

    public onPathPropertyChanged = async (path: string) => {
      this.superstate.onMetadataChange(path)
    }

    public resolvePath(path: string, source?: string) {
      return this.primarySpaceAdapter.resolvePath(path, source);
    }
    public uriByString(uri: string, source?: string): URI {
      if (!uri) return null;
      if (uri.indexOf('/') == -1 && source) {
        uri = this.resolvePath(uri, source);
        if (!uri) return null;
      }

      const fullPath= uri;
    //   const nt = uriByStr(uri, source);
    //   return nt;
    // }
    // export const uriByStr = (uri: string, source?: string) => {
      
      let refTypeChar = '';
      const parseQuery = (queryString: string) => {
        const query: { [key: string]: string } = {};
        queryString.split('&').forEach(param => {
          const [key, value] = param.split('=');
          query[decodeURIComponent(key)] = decodeURIComponent(value);
        });
        return query;
      };
    
      const mapRefType = (refTypeChar: string) => {
        if (refTypeChar === '^') return 'context';
        if (refTypeChar === '*') return 'frame';
        return null;
      };
    
      let space: string | null = null;
      let path: string | null = null;
      let alias: string | null = null;
      let reference: string | null = null;
      let refType: "context" | "frame" = null;
      let query: { [key: string]: string } | null = null;
      let scheme: string | null = 'vault';
    
      if (fullPath.indexOf('://') != -1) {
      scheme = uri.slice(0, uri.indexOf('://'))
      const spaceStr = uri.slice(uri.indexOf('://')+3);
        
        if (spaceStr.charAt(0) == "#") {
          const endIndex = spaceStr.lastIndexOf('/#');
          if (endIndex != -1) {
            space = spaceStr.slice(0, endIndex)
            uri = spaceStr.slice(endIndex)
          } else {
            space = spaceStr;
            uri = '/'
          }
        } else {
          const spaceParts = spaceStr.split('/');  
          space = spaceParts[0];
          uri = '/' + (spaceParts.slice(1).join('/') || ''); // Convert the rest back to a relative URI
        }
        
      }
      const queryDelimiter = '?'
      const aliasDelimiter = '|'
      const fragmentDelimiter = '#'
      const pathSeparator = '/'
    
      const lastSlashIndex = uri.lastIndexOf('/');
      const lastHashIndex = uri.lastIndexOf('#');
      const lastPipeIndex = uri.lastIndexOf('|');
      const queryIndex = uri.lastIndexOf('?');
    
      if (queryIndex !== -1) {
        query = parseQuery(uri.slice(queryIndex + 1));
        uri = uri.slice(0, queryIndex);
      }
    
      if (lastHashIndex !== -1 && lastHashIndex > lastSlashIndex) {
        const refPart = uri.slice(lastHashIndex + 1);
        refType = mapRefType(refPart[0]);
        if (refType || lastHashIndex != lastSlashIndex+1) {
        refTypeChar = refPart[0];
        reference = refType ? refPart.slice(1) : refPart;
        uri = uri.slice(0, lastHashIndex);
        }
      }
    
      if (lastPipeIndex !== -1 && lastPipeIndex > lastSlashIndex) {
        alias = uri.slice(lastPipeIndex + 1);
        uri = uri.slice(0, lastPipeIndex);
      }
    path = uri
      return {
    basePath:`${space ? `${scheme}://${space}${path != '/' ? path : ''}` : removeTrailingSlashFromFolder(path)}`,

        authority: space,
        fullPath,
        scheme,
        path: removeTrailingSlashFromFolder(uri),
        alias: alias,
        ref: reference,
        refType: refType,
        refStr: refTypeChar ? refTypeChar+reference : null,
        query: query
      };
    }

    public spaceTypeByString = (uri: URI): SpaceType => {
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

    public allCaches () {
      return this.primarySpaceAdapter.allCaches();
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

     //basic space operations
     public createSpace (name: string, parentPath: string, definition: SpaceDefinition) {
        return this.primarySpaceAdapter.createSpace(name, parentPath, definition);
     }
     public saveSpace (path: string, definition: (def: SpaceDefinition) => SpaceDefinition, properties?: Record<string, any>) {
        return this.primarySpaceAdapter.saveSpace(path, definition, properties);
     }
     public renameSpace (path: string, newPath: string) {
        return this.primarySpaceAdapter.renameSpace(path, newPath);
     }
     public deleteSpace (path: string) {
        return this.primarySpaceAdapter.deleteSpace(path);
     }
     public childrenForSpace (path: string) {
        return this.primarySpaceAdapter.childrenForSpace(path);
     }
     public contextForSpace (path: string) {
         return this.primarySpaceAdapter.contextForSpace(path);
      }
      public async tablesForSpace (path: string) {
         return this.primarySpaceAdapter.tablesForSpace(path);
      }  
      
      public readTable (path: string, schema: string) {
         return this.primarySpaceAdapter.readTable(path, schema);
      }

      public createTable (path: string, schema: SpaceTableSchema) {
         return this.primarySpaceAdapter.createTable(path, schema);
      }
    
    public saveTableSchema (path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema) {
      return this.primarySpaceAdapter.saveTableSchema(path, schemaId, saveSchema);
    }
    public saveTable (path: string, table: SpaceTable, force?: boolean) {

      return this.primarySpaceAdapter.saveTable(path, table, force);
    }
    public deleteTable (path: string, name: string) {
      return this.primarySpaceAdapter.deleteTable(path, name);
    }

    public readAllTables (path: string) {
      return this.primarySpaceAdapter.readAllTables(path);
    }
      public framesForSpace (path: string) {
         return this.primarySpaceAdapter.framesForSpace(path);
      }
      public readFrame (path: string, schema: string) {
         return this.primarySpaceAdapter.readFrame(path, schema);
      }

      public readAllFrames (path: string) {
         return this.primarySpaceAdapter.readAllFrames(path);
      }

    public createFrame (path: string, schema: SpaceTableSchema) {
      return this.primarySpaceAdapter.createFrame(path, schema);
    }
    
    public deleteFrame (path: string, name: string) {
      return this.primarySpaceAdapter.deleteFrame(path, name);
    }
    public saveFrameSchema (path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema) {
      return this.primarySpaceAdapter.saveFrameSchema(path, schemaId, saveSchema);
    }

    public saveFrame (path: string, frame: MDBFrame) {
      return this.primarySpaceAdapter.saveFrame(path, frame);
    }    
 
     //basic item operations
     public allPaths (type?: string[]) {
         return this.primarySpaceAdapter.allPaths(type);
       }
     public createItemAtPath (parent: string, type: string, name: string, content?: any) :Promise<string> {
        return this.primarySpaceAdapter.createItemAtPath(parent, type, name, content);
     }
     public renamePath (oldPath: string, newPath: string) {
        return this.primarySpaceAdapter.renamePath(oldPath, newPath);
     }
     public copyPath(source: string, destination: string) {
        return this.primarySpaceAdapter.copyPath(source, destination);
     }
     public deletePath (path: string) {
        return this.primarySpaceAdapter.deletePath(path);
     }
     public readPath (path: string) {
        return this.primarySpaceAdapter.readPath(path);
     }
     
     public writeToPath (path: string, content: any, binary?: boolean) {

        return this.primarySpaceAdapter.writeToPath(path, content, binary);
     }
     public parentForPath (path: string) {
         return this.primarySpaceAdapter.parentForPath(path);
       }

       public readPathCache (path: string) {
         return this.primarySpaceAdapter.readPathCache(path);
       }
 
     
     public allSpaces () {
        return this.primarySpaceAdapter.allSpaces();
     }
 
     //Local SpaceInfo for Path
     public spaceInfoForPath (path: string) {
        return this.primarySpaceAdapter.spaceInfoForPath(path);
     }
     public spaceDefForSpace (path: string) {
        return this.primarySpaceAdapter.spaceDefForSpace(path);
     }
     
     public readLabel (path: string) {
        return this.primarySpaceAdapter.readLabel(path);
     }
      public saveLabel (path: string, key:string, value: any) {
          return this.primarySpaceAdapter.saveLabel(path, key, value);
      }
     public addProperty(path: string, property: SpaceProperty) {
        return this.primarySpaceAdapter.addProperty(path, property);
     }
     public saveProperties (path: string, properties: {[key:string]: any}) {
        return this.primarySpaceAdapter.saveProperties(path, properties);
     }
       public readProperties (path: string) {
         return this.primarySpaceAdapter.readProperties(path);
       }
       public renameProperty (path: string, property: string, newProperty: string) {
         return this.primarySpaceAdapter.renameProperty(path, property, newProperty);
       }
     public deleteProperty (path: string, property: string) {
        return this.primarySpaceAdapter.deleteProperty(path, property);
     }
 
     public addSpaceProperty (path: string, property: SpaceProperty) {
        return this.primarySpaceAdapter.addSpaceProperty(path, property);
     
     }
     public deleteSpaceProperty (path: string, property: SpaceProperty) {
        return this.primarySpaceAdapter.deleteSpaceProperty(path, property);
     }
     public saveSpaceProperty (path: string, property: SpaceProperty, oldProperty: SpaceProperty) {
        return this.primarySpaceAdapter.saveSpaceProperty(path, property, oldProperty);
     }
 
    public addTag (path: string, tag: string) {  
        return this.primarySpaceAdapter.addTag(path, tag);
    }

    public deleteTag (path: string, tag: string) {
        return this.primarySpaceAdapter.deleteTag(path, tag);
    }

    public renameTag (path: string, tag: string, newTag: string) {
        return this.primarySpaceAdapter.renameTag(path, tag, newTag);
    }
    public readTags () {
         return this.primarySpaceAdapter.readTags();
    }
    public pathsForTag (tag: string) {
        return this.primarySpaceAdapter.pathsForTag(tag);
    }
}