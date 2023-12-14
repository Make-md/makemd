import { mdbFrameToDBTables, schemasAndFields } from "adapters/mdb/db/db";
import { defaultTableDataForContext } from "core/utils/contexts/optionValuesForColumn";

import { FileCache, FilesystemMiddleware } from "core/middleware/filesystem";
import { AFile, PathLabel } from "core/middleware/types/afile";

import { DefaultMDBTables } from "core/react/components/SpaceView/Frames/DefaultFrames/DefaultFrames";
import { fileSystemSpaceInfoByPath, fileSystemSpaceInfoFromFolder, fileSystemSpaceInfoFromTag } from "core/spaceManager/filesystemAdapter/spaceInfo";
import { parseSpaceMetadata, spaceContextsKey, spaceFilterKey, spaceLinksKey, spaceSortKey } from "core/superstate/utils/spaces";
import { SpaceDefinition } from "core/types/space";
import { defaultFrameSchema } from "schemas/frames";
import { defaultContextDBSchema, defaultContextSchemaID, defaultContextTable, defaultFieldsForContext, defaultTablesForContext, fieldSchema } from "schemas/mdb";
import { DBTables, SpaceInfo, SpaceProperty, SpaceTable, SpaceTableSchema, SpaceTables } from "types/mdb";
import { MDBFrame } from "types/mframe";
import { tagPathToTag } from "utils/tags";
import { SpaceAdapter, SpaceManager } from "../spaceManager";


//Space Adapter that works on a generic filesystem middleware

export class FilesystemSpaceAdapter implements SpaceAdapter {
    public constructor(public fileSystem: FilesystemMiddleware) {
        fileSystem.eventDispatch.addListener("onCreate", this.onCreate, 0, this)
        fileSystem.eventDispatch.addListener("onRename", this.onRename, 0, this)
        fileSystem.eventDispatch.addListener("onDelete", this.onDelete, 0, this)
        fileSystem.eventDispatch.addListener("onCacheUpdated", this.onMetadataChange, 0, this)

    }
   public spaceManager: SpaceManager;
    public initiateAdapter(manager: SpaceManager) {
      this.spaceManager = manager;
    }

    


    private async onMetadataChange(payload: {path: string}) {
      if (!payload.path) return;
      for (const space of this.allSpaces()) {
        if (space.defPath == payload.path) {

          this.spaceManager.onSpaceDefinitionChanged(space.path)
          this.spaceManager.onPathPropertyChanged(space.path)
        }
      }
      this.spaceManager.onPathPropertyChanged(payload.path)
    }
    
    public uriByPath (path: string) {
      return this.spaceManager.uriByString(path);
    }
    public allPaths (type?: string[]) {
      return [...this.fileSystem.allFiles().filter(f =>  type ? type.some(g =>  g == 'folder' ? f.isFolder : f.extension == g) : true).map(g => g.path)];
    }
    public async pathExists (path: string) {
      return this.fileSystem.fileExists(path)
    }
  public async createItemAtPath (parent: string, type: string, name: string, content?: any) {

    const parentURI = await this.getPath(parent);
    if (!parentURI.isFolder) {
      const file = await this.fileSystem.getFile(parent)
      return this.fileSystem.newFileFragment(file, type, name, content).then(f => file.path)
    }
    return this.fileSystem.newFile(parent, name, type, content).then(f => f.path);
  }
  public async renamePath (oldPath: string, path: string) {
    const uri = this.uriByPath(oldPath);
    const newUri = this.uriByPath(path);
    const file = await this.fileSystem.getFile(uri.path);
    if (uri.refStr) {
      const refType = await this.fileSystem.getFileCacheTypeByRefString(file, uri.refStr);
      return await this.fileSystem.saveFileFragment(file, refType, uri.refStr, () => newUri.refStr);
    }
    return await this.fileSystem.renameFile(oldPath, path);
  }
  public async deletePath (path: string) {
    const uri = this.uriByPath(path);
    if (uri.refStr) {
      const file = await this.fileSystem.getFile(uri.path);
      const refType = await this.fileSystem.getFileCacheTypeByRefString(file, uri.refStr);
      return this.fileSystem.deleteFileFragment(file, refType, uri.refStr)
    }
    return this.fileSystem.deleteFile(path)
  }

  public async getPath (path: string) {
    const uri = this.uriByPath(path);
    const file = await this.fileSystem.getFile(uri.path);
    if (uri.refStr) {
      const type = this.fileSystem.getFileCacheTypeByRefString(file, uri.refStr);
    }
    return file;   
  }

  
  

  public readPathCache (path: string) : FileCache {
    const uri = this.uriByPath(path);
    if (uri.scheme == 'spaces') {
      if (uri.authority.charAt(0) == '#')
      {
        return {
          file: null,
          metadata: null,
          label: {
            name: uri.authority,
            sticker: '',
            color: ''
          },
          type: 'space',
          parent: '',
          tags: []
          } as FileCache
        }
      }
    
    return this.fileSystem.getFileCache(path)
  }
  public async readPath (path: string) {
    const uri = this.uriByPath(path);
    const file = await this.fileSystem.getFile(uri.path);
    if (uri.refStr) {
      const fragmentType = this.fileSystem.getFileCacheTypeByRefString(file, uri.refStr);
      this.fileSystem.getFileContent(file, fragmentType, uri.refStr)
    }
    return this.fileSystem.readTextFromFile(path);
  }
  public async copyPath (path: string, newPath: string) {
    const uri = this.uriByPath(path);
    const file = await this.fileSystem.getFile(uri.path);
    
    return this.fileSystem.copyFile(file.path, newPath);
    }
  public async writeToPath (path: string, content: any, binary: boolean) {
    const uri = this.uriByPath(path);
    const file = await this.fileSystem.getFile(uri.path);
    if (uri.refStr) {
      const fragmentType = this.fileSystem.getFileCacheTypeByRefString(file, uri.refStr);
      this.fileSystem.saveFileFragment(file, fragmentType, uri.refStr, () => content)
    }
    if (binary) {
      return this.fileSystem.writeBinaryToFile(path, content);
    }
    return this.fileSystem.writeTextToFile(path, content);
  }
  
  public async parentForPath (path: string) {
    const uri = this.uriByPath(path);
    const file = await this.fileSystem.getFile(uri.path);
    if (uri.refStr) {
      return file.path
    }
    return this.fileSystem.parentForPath(path).then(f => f?.path);
  }
  public async readFrame (path: string, schema: string) : Promise<MDBFrame> {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).framePath)
    if (!mdbFile && Object.keys(DefaultMDBTables).some(f => f == schema)) {
      const defaultTable = DefaultMDBTables[schema];
      return defaultTable
    }
    return this.fileSystem.readFileFragments(mdbFile, 'mdbTable', schema)
  }

  public async readAllFrames (path: string) {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).framePath)
    if (!mdbFile) {
      return DefaultMDBTables;
    }
    return this.fileSystem.readFileFragments(mdbFile, 'mdbTables')
  }
  
  public async readTable (path: string, schema: string) {
    const spaceInfo = this.spaceInfoForPath(path);
    const mdbFile = await this.fileSystem.getFile(spaceInfo.dbPath)

    if (!mdbFile && schema == defaultContextDBSchema.id) {
      const defaultTable = defaultTableDataForContext(this.spaceManager.superstate, spaceInfo);
      return defaultTable
    }
    return this.fileSystem.readFileFragments(mdbFile, 'mdbTable', schema)
  }

  public async tablesForSpace (path: string) {
    const spaceInfo = this.spaceInfoForPath(path);
    const mdbFile = await this.fileSystem.getFile(spaceInfo.dbPath)
    if (!mdbFile) {
      return defaultContextTable.rows
    }
    return this.fileSystem.readFileFragments(mdbFile, 'schemas', null)
  }
private defaultDBTablesForContext (spaceInfo: SpaceInfo) {
  const table = defaultTableDataForContext(this.spaceManager.superstate, spaceInfo);
  const defaultFields = defaultFieldsForContext(spaceInfo);
    const defaultTable = defaultTablesForContext(spaceInfo);
    return {
      ...defaultTable,
      m_fields: {
        uniques: defaultFields.uniques,
        cols: defaultFields.cols,
        rows: [...(defaultFields.rows ?? []), ...table.cols],
      },
      [table.schema.id]: {
        uniques: table.cols
          .filter((c) => c.unique == "true")
          .map((c) => c.name),
        cols: table.cols.map((c) => c.name),
        rows: table.rows,
      },
    };
}


  public async createDefaultTable (path: string) {

    const spaceInfo = this.spaceInfoForPath(path)
      const dbPath = this.spaceInfoForPath(path).dbPath
      const extension = dbPath.split('.').pop();
      const folder = dbPath.split('/').slice(0, -1).join('/');
      const filename = dbPath.split('/').pop().split('.')[0];
      return this.fileSystem.newFile(folder, filename, extension, this.defaultDBTablesForContext(spaceInfo))
  }

  public async createDefaultFrames (path: string) {

    const dbField : DBTables=  {
          ...mdbFrameToDBTables(DefaultMDBTables, {
            m_fields: fieldSchema.uniques,
            main: defaultFrameSchema.uniques,
          }),
          ...schemasAndFields(DefaultMDBTables),
    };
      const dbPath = this.spaceInfoForPath(path).framePath
      const extension = dbPath.split('.').pop();
      const folder = dbPath.split('/').slice(0, -1).join('/');
      const filename = dbPath.split('/').pop().split('.')[0];
      return this.fileSystem.newFile(folder, filename, extension, dbField)
  }

  public async createTable (path: string, schema: SpaceTableSchema) {
    let mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).dbPath)
    if (!mdbFile) {
      mdbFile = await this.createDefaultTable(path)
    }
    return this.fileSystem.newFileFragment(mdbFile, 'schema', schema.id, schema)
  }
  
  public async saveTableSchema (path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema) {
    let mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).dbPath)
    if (!mdbFile) {
      mdbFile = await this.createDefaultTable(path)
    }
    return this.fileSystem.saveFileFragment(mdbFile, 'schema', schemaId, saveSchema)
  }

  public async saveTable (path: string, table: SpaceTable, force?: boolean) {

    let mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).dbPath)
    if (!mdbFile) {
      if (force)
      {
        mdbFile = await this.createDefaultTable(path)
      }
       else {
        return null;
       }
    }

    return this.fileSystem.saveFileFragment(mdbFile, 'mdbTable', table.schema.id, () => table)
  }
  public async deleteTable (path: string, name: string) {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).dbPath)
    return this.fileSystem.deleteFileFragment(mdbFile, 'schema', name)
  }

  public async readAllTables (path: string) : Promise<SpaceTables> {
    const spaceInfo = this.spaceInfoForPath(path);
    const mdbFile = await this.fileSystem.getFile(spaceInfo.dbPath)
    if (!mdbFile) {
      const defaultTable = defaultTableDataForContext(this.spaceManager.superstate, spaceInfo);
      return {
        [defaultTable.schema.id]: defaultTable
      }
    }
    return this.fileSystem.readFileFragments(mdbFile, 'mdbTables', null)
  }

  public async framesForSpace (path: string) {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).framePath)
    if (!mdbFile) {
      return Object.values(DefaultMDBTables).map(f => f.schema)
    }
    return this.fileSystem.readFileFragments(mdbFile, 'schemas', null)
  }
  

  public async createFrame (path: string, schema: SpaceTableSchema) {
    let mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).framePath)
    if (!mdbFile) {
      mdbFile = await this.createDefaultFrames(path);
    }
    return this.fileSystem.newFileFragment(mdbFile, 'schema', schema.id, schema)
  }
  public async deleteFrame (path: string, name: string) {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).framePath)
    return this.fileSystem.deleteFileFragment(mdbFile, 'schema', name)
  }
  public async saveFrameSchema (path: string, schemaId: string, saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema) {
    let mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).framePath)
    if (!mdbFile) {
      mdbFile = await this.createDefaultFrames(path);
    }
    return this.fileSystem.saveFileFragment(mdbFile, 'schema', schemaId, saveSchema)
  }
  
  public async saveFrame (path: string, frame: SpaceTable) {
    let mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).framePath)
    if (!mdbFile) {
      mdbFile = await this.createDefaultFrames(path)
    }
    return this.fileSystem.saveFileFragment(mdbFile, 'mdbFrame', frame.schema.id, () => frame)
  }

  public async contextForSpace (path: string) : Promise<SpaceTable> {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).dbPath)
    if (!mdbFile) {
      return defaultTableDataForContext(this.spaceManager.superstate, this.spaceInfoForPath(path))
    }
    return this.fileSystem.readFileFragments(mdbFile, 'mdbTable', defaultContextSchemaID)
  }
  
  public async addSpaceProperty (path: string, property: SpaceProperty) {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).dbPath)

    if (!mdbFile) {
      await this.createDefaultTable(path)
    }
    this.fileSystem.newFileFragment(mdbFile, 'field', property.name, property)
  }
  public async deleteSpaceProperty (path: string, property: SpaceProperty) {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).dbPath)
    this.fileSystem.deleteFileFragment(mdbFile, 'field', property)
  }
  
  public async saveSpaceProperty (path: string, property: SpaceProperty, oldProperty: SpaceProperty) {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).dbPath)
    if (!mdbFile) {
      await this.createDefaultTable(path)
    }
    this.fileSystem.saveFileFragment(mdbFile, 'field', oldProperty, (prev) => property)
  }
  public async addProperty (path: string, property: SpaceProperty) {
    const file = await this.fileSystem.getFile(path)
    this.fileSystem.newFileFragment(file, 'property', property.name, property)
  }
  public async saveProperties (path: string, properties:  {[key:string]: any}) {
    const file = await this.fileSystem.getFile(path)

    this.fileSystem.saveFileFragment(file, 'property', null, (prev) => properties)
  }

  public async readLabel (path: string) {
    return this.fileSystem.getFileCache(path).label
  }

  public async saveLabel (path: string, label: keyof PathLabel, value: any) {
    const file = await this.fileSystem.getFile(path)
    this.fileSystem.saveFileLabel(file, label, value)
  }

  public async renameProperty (path: string, property: string, newProperty: string) {
    
      const file = await this.fileSystem.getFile(path)
      this.fileSystem.saveFileFragment(file, 'property', null, (prev: {[key: string]: any}) => {
       const { [property]: _, properties} =  prev
       return {...properties, [newProperty]: prev[property]}
      })
    }
  public async readProperties (path: string) {
    const file = await this.fileSystem.getFile(path)
    return this.fileSystem.readFileFragments(file, 'property', null)
  }
  public async deleteProperty (path: string, property: string) {
    const file = await this.fileSystem.getFile(path)
    this.fileSystem.deleteFileFragment(file, 'property', property)
  }

    onCreate = async (payload: {file: AFile}) => {
      
      if (payload.file.isFolder){
        this.spaceManager.onSpaceCreated(payload.file.path)
      } else {
        this.spaceManager.onPathCreated(payload.file.path)
      }
      };
    
      onDelete = (payload: {file: AFile}) => {

        if (!payload.file) return;
        if (!payload.file.isFolder && payload.file.extension != "mdb") {
          this.spaceManager.onPathDeleted(payload.file.path)
        } else if (payload.file.isFolder) {
          this.spaceManager.onSpaceDeleted(payload.file.path)
        }
      };
      
      onRename = (payload: {file: AFile, oldPath: string}) => {
        if (!payload.file) return;
        if (!payload.file.isFolder && payload.file.extension != "mdb") {
          this.spaceManager.onPathChanged(payload.file.path, payload.oldPath)
        } else if (payload.file.isFolder) 
        {
          this.spaceManager.onSpaceRenamed(payload.file.path, payload.oldPath)
        }
        }

      
    public authorities = ['vault'];


    public allSpaces ()  {
        const getAllTagContextFiles = () : SpaceInfo[] => this.readTags().map(f => fileSystemSpaceInfoFromTag(this.spaceManager, tagPathToTag(f))) as SpaceInfo[] ?? [];
          
          const getAllFolderContextFiles = () => {
            const folders = this.allPaths(['folder']).filter(f => !f.startsWith(this.spaceManager.superstate.settings.spacesFolder+'/#'))
            
            return folders.map(f => fileSystemSpaceInfoFromFolder(this.spaceManager, f));
          }
          const allTagSpaces = this.spaceManager.superstate.settings.enableTagSpaces && this.spaceManager.superstate.settings.enableDefaultSpaces ? getAllTagContextFiles() : [];
          const allFolders = getAllFolderContextFiles();
           return [...allTagSpaces, ...allFolders]
    }

    public readTags () {
      return this.fileSystem.allTags();
    }

    //Local SpaceInfo for Path
    public spaceInfoForPath (path: string) {
        return fileSystemSpaceInfoByPath(this.spaceManager, path);
    }

    public allCaches () {
        return this.fileSystem.allCaches();
    }

    public async spaceDefForSpace (path: string) {
        const space = this.spaceInfoForPath(path)
        if (!space) return null;
        const defFile = await this.fileSystem.getFile(space.defPath);
        const metaCache = defFile ? this.fileSystem.getFileCache(defFile.path)?.frontmatter : null;
        const spaceDef = metaCache ?? {};
        return parseSpaceMetadata(spaceDef, this.spaceManager.superstate.settings);
    }

    public async createSpace (name: string, parentPath: string, definition: SpaceDefinition) {
      const spaceInfo = this.spaceInfoForPath(parentPath)

      const newPath = spaceInfo.folderPath == '/' ? name : spaceInfo.folderPath+'/'+name;
      await this.fileSystem.createFolder(newPath);
      return this.saveSpace(newPath, () => definition);
    }

    public async saveSpace (path: string, definitionFn: (def: SpaceDefinition) => SpaceDefinition, properties?: Record<string, any>) {
      const metadata = definitionFn(await this.spaceDefForSpace(path)) ?? {};

      const spaceInfo = this.spaceInfoForPath(path);
      let file = await this.fileSystem.getFile(spaceInfo.defPath)

      if (!file) {
        file = await this.fileSystem.newFile(spaceInfo.folderPath, spaceInfo.name, "md")

      }

      await this.fileSystem.saveFileFragment(file, "frontmatter", null, (frontmatter) => ({
        [spaceFilterKey(this.spaceManager.superstate.settings)] : metadata.filters,
        [spaceContextsKey(this.spaceManager.superstate.settings)] : metadata.contexts,
        [spaceLinksKey(this.spaceManager.superstate.settings)] : metadata.links,
        [spaceSortKey(this.spaceManager.superstate.settings)] : metadata.sort,
        ...(properties ?? {})
      }))
    await this.spaceManager.onPathPropertyChanged(file.path);
      await this.spaceManager.onSpaceCreated(path);
      return;
    }

    public renameSpace (oldPath: string, newPath: string) {
      const spaceInfo = this.spaceInfoForPath(oldPath);
      const newSpaceInfo = this.spaceInfoForPath(newPath);
      this.fileSystem.renameFile(spaceInfo.folderPath, newSpaceInfo.folderPath);
    }
    public deleteSpace (path: string) {

      const spaceCache = this.spaceInfoForPath(path)
        const spaceInfo = fileSystemSpaceInfoFromTag(this.spaceManager, spaceCache.name);
        this.fileSystem.deleteFile(spaceInfo.folderPath);
    }

    public childrenForSpace (path: string) {
        return [] as any[]
    }

    public addTag (path: string, tag: string) {
      this.fileSystem.addTagToFile(path, tag);
      
    }

    public renameTag (path: string, tag: string, newTag: string) {
      this.fileSystem.renameTagForFile(path, tag, newTag)
    }

    public deleteTag (path: string, tag: string) {
      this.fileSystem.removeTagFromFile(path, tag)
      
    }

    public pathsForTag (tag: string) {
      return this.fileSystem.filesForTag(tag)
    }

    public resolvePath (path: string, source: string) {
      return this.fileSystem.resolvePath(path, source)
    }

}