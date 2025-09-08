import { defaultTableDataForContext } from "core/utils/contexts/optionValuesForColumn";
import { mdbFrameToDBTables } from "core/utils/frames/frame";

import { FileCache, FilesystemMiddleware } from "core/middleware/filesystem";
import { AFile } from "shared/types/afile";
import { PathLabel } from "shared/types/caches";

import { DefaultEverViewTables, DefaultFolderNoteMDBTables, DefaultMDBTables } from "core/react/components/SpaceView/Frames/DefaultFrames/DefaultFrames";
import { fileSystemSpaceInfoByPath, fileSystemSpaceInfoFromFolder, fileSystemSpaceInfoFromTag } from "core/spaceManager/filesystemAdapter/spaceInfo";
import { parseSpaceMetadata } from "core/superstate/utils/spaces";
import { builtinSpaces, spaceContextsKey, spaceJoinsKey, spaceLinksKey, spaceSortKey, spaceTemplateKey, spaceTemplateNameKey } from "core/types/space";
import { linkContextRow, propertyDependencies } from "core/utils/contexts/linkContextRow";
import { runFormulaWithContext } from "core/utils/formula/parser";
import { executeCode } from "core/utils/frames/runner";
import { ensureArray, tagSpacePathFromTag } from "core/utils/strings";
import { defaultContextTable, defaultFramesTable, defaultTablesForContext } from "schemas/mdb";
import { builtinSpacePathPrefix } from "shared/schemas/builtin";
import { defaultContextDBSchema, defaultContextSchemaID } from "shared/schemas/context";
import { defaultFieldsForContext, fieldSchema } from "shared/schemas/fields";
import { Command, CommandResult, Library } from "shared/types/commands";
import { Focus } from "shared/types/focus";
import { Kit } from "shared/types/kits";
import { DBTables, SpaceProperty, SpaceTable, SpaceTables, SpaceTableSchema } from "shared/types/mdb";
import { MDBFrame, MDBFrames } from "shared/types/mframe";
import { SpaceDefinition } from "shared/types/spaceDef";
import { SpaceInfo } from "shared/types/spaceInfo";
import { SpaceAdapter } from "shared/types/spaceManager";
import { uniqueNameFromString } from "shared/utils/array";
import { safelyParseJSON } from "shared/utils/json";
import { movePath } from "shared/utils/uri";
import { excludeSpacesPredicate } from "utils/hide";
import { pathToString } from "utils/path";
import { tagPathToTag, tagToTagPath } from "utils/tags";
import { SpaceManager } from "../spaceManager";


//Space Adapter that works on a generic filesystem middleware
const defaultTemplatesFolder = 'templates';
const defaultKitsFolder = 'kits';
const defaultActionsFolder = 'actions';
export const defaultFocusFile = 'waypoints.json';


export class FilesystemSpaceAdapter implements SpaceAdapter {
    public constructor(public fileSystem: FilesystemMiddleware, public dataPath: string) {
        fileSystem.eventDispatch.addListener("onCreate", this.onCreate, 0, this)
        fileSystem.eventDispatch.addListener("onRename", this.onRename, 0, this)
        fileSystem.eventDispatch.addListener("onDelete", this.onDelete, 0, this)
        fileSystem.eventDispatch.addListener("onFocusesUpdated", this.onFocusesUpdated, 0, this)
        fileSystem.eventDispatch.addListener("onSpaceUpdated", this.onSpaceUpdated, 0, this)
        fileSystem.eventDispatch.addListener("onCacheUpdated", this.onMetadataChange, 0, this)

    }
  
   public spaceManager: SpaceManager;
   public schemes = ['spaces', 'vault']
    public initiateAdapter(manager: SpaceManager) {
      
      this.spaceManager = manager;
    }

    public onFocusesUpdated = () => {
      this.spaceManager.onFocusesUpdated()
    }

    public onSpaceUpdated = (payload: {path: string, type: string}) => {
      if (payload.type == 'views.mdb') {
        this.spaceManager.onSpaceUpdated(payload.path, 'frame')
      } else if (payload.type == 'context.mdb') {
        this.spaceManager.onSpaceUpdated(payload.path, 'context')
      } else if (payload.type == 'commands.mdb') {
        this.spaceManager.onSpaceUpdated(payload.path, 'action')
      }
    }
    public loadPath = async (path: string)  => {
      return this.fileSystem.loadPath(path)
    }

    public async readTemplates (path: string) : Promise<string[]> {
      return (await this.childrenForPath(`${path}/${this.spaceManager.superstate.settings.spaceSubFolder}/templates`)).filter(f => !f.startsWith('.')).map(f => f.split('/').pop())
    }

    public async saveTemplate (path: string, space: string) {
      return this.copyPath(path, `${space}/${this.spaceManager.superstate.settings.spaceSubFolder}/templates`)
    }
    public deleteTemplate (path: string, space: string) {
      return this.deletePath(`${space}/${this.spaceManager.superstate.settings.spaceSubFolder}/templates/${path}`)
    }
    public async readFocuses () : Promise<Focus[]> {
      if (!await this.fileSystem.fileExists(this.dataPath)) {
        await this.fileSystem.createFolder(this.dataPath)
      }
      if (!await this.fileSystem.fileExists(`${this.dataPath}/${defaultFocusFile}`)) {
        return [];
      }
      return  this.fileSystem.readTextFromFile(`${this.dataPath}/${defaultFocusFile}`).then(f => ensureArray(safelyParseJSON(f)))
    }
    public async saveFocuses (focuses: Focus[]) {
      if (!await this.fileSystem.fileExists(this.dataPath)) {
        await this.fileSystem.createFolder(this.dataPath)
      }
      return this.fileSystem.writeTextToFile(`${this.dataPath}/${defaultFocusFile}`, JSON.stringify(focuses))
    }

    public async readTemplate (name: string) {
      const g = `${this.dataPath}/${defaultTemplatesFolder}/${name}`;
      if ( await this.fileSystem.fileExists(g)) {
        return this.fileSystem.readFileFragments({
          path: `${g}/${this.spaceManager.superstate.settings.spaceSubFolder}/views.mdb`,
          name: 'views',
          filename: 'views.mdb',
          parent: g,
          isFolder: false,
          extension: 'mdb'
        }, 'mdbTables') as Promise<MDBFrames>
      }
    }
    
    public async readAllKits () : Promise<Kit[]> {
      const strings = (await this.childrenForPath(`${this.dataPath}/${defaultKitsFolder}`)).map(f => f.split('/').pop());
      const kits = Promise.all(strings.map(async f => {
        const frames = await this.readKitFrames(f);
        return {
          id: f,
          name: f,
          colors: {},
          frames: Object.values(frames ?? {})
        }
      }));
      return kits
    }

    public async readAllTemplates () : Promise<{[key: string]: MDBFrames}> {
      const strings = (await this.childrenForPath(`${this.dataPath}/${defaultTemplatesFolder}`)).map(f => f.split('/').pop());
      const templates : {[key: string]: MDBFrames} = {};
      for (const string of strings) {
       const template = await this.readTemplate(string);
       if (template) {
        templates[string] = template;
       }
      }
      return templates;
    }
    public async readKitFrames (name: string) : Promise<MDBFrames> {
      return this.fileSystem.readFileFragments({
        path: `${this.dataPath}/${defaultKitsFolder}/${name}/kit.mdb`,
        name: 'kit',
        filename: 'kit.mdb',
        parent: `${this.dataPath}/${defaultKitsFolder}/${name}`,
        isFolder: false,
        extension: 'mdb'
      }, 'mdbTables') as Promise<MDBFrames>
      
    }
    public async saveFrameKit (frames: MDBFrame, name: string) {
      const mdbFile = {
        path: `${this.dataPath}/${defaultKitsFolder}/${name}/kit.mdb`,
        name: 'kit',
        filename: 'kit.mdb',
        parent: `${this.dataPath}/${defaultKitsFolder}/${name}`,
        isFolder: false,
        extension: 'mdb'
      };
      await this.fileSystem.saveFileFragment(mdbFile, 'schema', frames.schema.id, () => frames.schema)
      this.fileSystem.saveFileFragment(mdbFile, 'mdbFrame', frames.schema.id, () => frames)
    }
    public async saveSpaceTemplate (frames: MDBFrames, name: string) {
      let templateName = name;
      if (await this.fileSystem.fileExists(`${this.dataPath}/${defaultTemplatesFolder}`)) {
        const paths = await this.childrenForPath(`${this.dataPath}/${defaultTemplatesFolder}/${name}`);
        templateName = uniqueNameFromString(templateName, paths)
      }
      await this.fileSystem.newFile(`${this.dataPath}/${defaultTemplatesFolder}/${templateName}/${this.spaceManager.superstate.settings.spaceSubFolder}`, 'view', 'mdb', frames)
    }

    private async onMetadataChange(payload: {path: string}) {
      if (!payload.path) return;
      if (payload.path.endsWith('.json')) {
        const spacePathFromDef = payload.path.split('/').slice(0, -2).join('/');
        this.spaceManager.onPathPropertyChanged(spacePathFromDef)
        return;
      }
      const path = this.spaceManager.superstate.pathsIndex.get(payload.path);
      
      if (path?.metadata.spacePath?.length > 0) {
        this.spaceManager.onPathPropertyChanged(path?.metadata.spacePath)
        return;
      }
      this.spaceManager.onPathPropertyChanged(payload.path)
    }
    
    public uriByPath (path: string) {
      return this.spaceManager.uriByString(path);
    }
    public allPaths (type?: string[]) {
      
      return [...this.fileSystem.allFiles().filter(f =>  type ? type.some(g =>  g == 'folder' ? f.isFolder : f.extension == g) : true).map(g => g.path).filter(f => !excludeSpacesPredicate(this.spaceManager.superstate.settings, f))];
    }
    public async pathExists (path: string) {
      const uri = this.uriByPath(path);
        if (uri.scheme == 'spaces') {
          if (uri.authority.charAt(0) == '$') {
          const builtIn = Object.keys(builtinSpaces).find(f => f == uri.authority.slice(1));
            if (builtIn) {
              return true;
            }
          }
            
          if (uri.authority.charAt(0) == '#')
          {
            return true;
          }
          if (path == '/') {
            return true;
          }
        
      }
      return this.fileSystem.fileExists(path)
    }
  public async createItemAtPath (parent: string, type: string, name: string, content?: any) {

    const parentURI = await this.getPathInfo(parent);
    if (!parentURI) {
      await this.fileSystem.createFolder(parent)
    } else if (!parentURI?.isFolder) {
      const file = await this.fileSystem.getFile(parent)
      if (!file) return null;
      return this.fileSystem.newFileFragment(file, type, name, content)?.then(f => file.path)
    }
    return this.fileSystem.newFile(parent, name, type, content).then(f => f?.path);
  }
  public async renamePath (oldPath: string, path: string) : Promise<string> {

    const uri = this.uriByPath(oldPath);
    const newUri = this.uriByPath(path);
    const file = await this.fileSystem.getFile(uri.path);
    if (uri.refStr) {
      const refType = await this.fileSystem.getFileCacheTypeByRefString(file, uri.refStr);
      await this.fileSystem.saveFileFragment(file, refType, uri.refStr, () => newUri.refStr);
      return path;
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

  public async getPathInfo (path: string) {
    const uri = this.uriByPath(path);
    const file = await this.fileSystem.getFile(uri.path);
    if (uri.refStr) {
      const type = this.fileSystem.getFileCacheTypeByRefString(file, uri.refStr);
    }
    return file as Record<string, any>;
  }

  
  public keysForCacheType (path: string) {
    return this.fileSystem.keysForCacheType(path)
  }

  public async readPathCache (path: string) : Promise<FileCache> {
    const uri = this.uriByPath(path);
    if (uri.scheme == 'spaces') {
      if (uri.authority.charAt(0) == '$') {
      const builtIn = Object.keys(builtinSpaces).find(f => f == uri.authority.slice(1));
        if (builtIn) {
          return {
            file: null,
            metadata: null,
            label: {
              name: builtinSpaces[builtIn].name,
              sticker: builtinSpaces[builtIn].icon,
              color: ''
            },
            readOnly: false,
            type: 'space',
            parent: '',
            tags: []
            } as FileCache
        }
      }
        
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
          tags: [],
          readOnly: false
          } as FileCache
        } 
      }
      if (path == '/') {
        return {
          file: {
            name: this.spaceManager.superstate.settings.systemName,
            path: '/',
            isFolder: true
          },
          metadata: {},
          label: {
            name: this.spaceManager.superstate.settings.systemName,
            sticker: '',
            color: ''
          },
          type: 'space',
          subtype: 'folder',
          parent: '',
          tags: [],
          readOnly: false
          } as FileCache
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
  public async copyPath (path: string, newPath: string, newName?: string) {
    const uri = this.uriByPath(path);
    const file = await this.fileSystem.getFile(uri.path);
    
    return this.fileSystem.copyFile(file.path, newPath, newName);
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
  
  public async childrenForPath (path: string, type?: string) {
    if (await this.fileSystem.fileExists(path))
    return this.fileSystem.childrenForFolder(path, type);
  return []
  }

  public parentPathForPath (path: string) {
    // const uri = this.uriByPath(path);
    // const file = await this.fileSystem.getFile(uri.path);
    // if (uri.refStr) {
    //   return file.path
    // }
    return this.fileSystem.parentPathForPath(path);
  }
  public async readFrame (path: string, schema: string) : Promise<MDBFrame> {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).framePath)

    if (!mdbFile) {
      const defaultTemplate = this.defaultFrame(path);
      if (Object.keys(defaultTemplate).some(f => f == schema))
      { const defaultTable = defaultTemplate[schema];
      return defaultTable
      }
    }
    return this.fileSystem.readFileFragments(mdbFile, 'mdbTable', schema)
  }

  public async readAllFrames (path: string) : Promise<MDBFrames> {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).framePath)
    if (!mdbFile) {
      return this.defaultFrame(path);
    }
    return this.fileSystem.readFileFragments(mdbFile, 'mdbTables')
  }
  
  public async readTable (path: string, schema: string) {
    const spaceInfo = this.spaceInfoForPath(path);
    const mdbFile = await this.fileSystem.getFile(spaceInfo.dbPath)
    let table : SpaceTable;
    if (!mdbFile && schema == defaultContextDBSchema.id) {
      table = defaultTableDataForContext(this.spaceManager.superstate, spaceInfo);
      
    } else {
      table = await this.fileSystem.readFileFragments(mdbFile, 'mdbTable', schema) as SpaceTable
      if (!table && schema == defaultContextDBSchema.id)
      {
        table = defaultTableDataForContext(this.spaceManager.superstate, spaceInfo);
      }
    }
    const dependencies = propertyDependencies(table.cols);
    const rows = table.rows.map(f => linkContextRow(this.spaceManager.superstate.formulaContext, this.spaceManager.superstate.pathsIndex,  this.spaceManager.superstate.contextsIndex, this.spaceManager.superstate.spacesMap, f, table.cols, this.spaceManager.superstate.pathsIndex.get(path), this.spaceManager.superstate.settings, dependencies))
    return {...table, rows}
  }
  public async spaceInitiated (path: string) {
    return true;
  }
public async contextInitiated (path: string) {
  const spaceInfo = this.spaceInfoForPath(path);
  return await this.fileSystem.fileExists(spaceInfo.dbPath)
}
  public async tablesForSpace (path: string) {
    const spaceInfo = this.spaceInfoForPath(path);
    const mdbFile = await this.fileSystem.getFile(spaceInfo.dbPath)
    if (!mdbFile) {
      return defaultContextTable.rows
    }
    const schemas = await this.fileSystem.readFileFragments(mdbFile, 'schemas', null)
    if (schemas.length == 0) {
      return defaultContextTable.rows
    }
    return schemas;
    
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
  public defaultFrame  (path: string): MDBFrames {
    if (path.startsWith(builtinSpacePathPrefix)) {
      if (path == builtinSpacePathPrefix + 'overview') {
        return DefaultEverViewTables
      }
    }
    if (this.spaceManager.superstate.settings.defaultSpaceTemplate.length > 0 && this.spaceManager.superstate.templateCache.has(this.spaceManager.superstate.settings.defaultSpaceTemplate)) {
      return this.spaceManager.superstate.templateCache.get(this.spaceManager.superstate.settings.defaultSpaceTemplate)
    }
    if (this.spaceManager.superstate.settings.enableFolderNote) {
      return DefaultFolderNoteMDBTables;
    }
    return DefaultMDBTables
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
const defaultSpaceTemplate = this.defaultFrame(path);
    const dbField : DBTables=  {
          ...mdbFrameToDBTables(defaultSpaceTemplate),
          m_schema: defaultFramesTable,

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
        return false;
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
      const frames = this.defaultFrame(path);
      return Object.values(frames).map(f => f.schema)
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

  public async createDefaultCommands (path: string) {
    const dbField : DBTables=  {
      m_fields: {
        uniques: fieldSchema.uniques,
        cols: fieldSchema.cols,
        rows: [],
      },
      m_schema: {uniques: [],
        cols: ["id", "name", "type", "def", "predicate", "primary"],
        rows: [],}
    };
      const dbPath = this.spaceInfoForPath(path).commandsPath
      const extension = dbPath.split('.').pop();
      const folder = dbPath.split('/').slice(0, -1).join('/');
      const filename = dbPath.split('/').pop().split('.')[0];
      return this.fileSystem.newFile(folder, filename, extension, dbField)
  }

  public async commandsForSpace (path: string) : Promise<Command[]> {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).commandsPath)
    if (!mdbFile) {
      return []
    }
    return this.fileSystem.readFileFragments(mdbFile, 'mdbCommands', null)
  }

  public async runCommand (path: string, name: string, args: any) : Promise<CommandResult> {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).commandsPath)
    if (!mdbFile) {
      return { result: null, error: 'No commands file found' }
    }
    const command = await this.fileSystem.readFileFragments(mdbFile, 'mdbCommand', name) as Command
    if (!command) {
      return { result: null, error: 'No command found' }
    }
    let result;
    let error;
    try {
      if (command.schema.type == 'script')
      result = executeCode(command.code, args)
    if (command.schema.type == 'formula')
    result = runFormulaWithContext(this.spaceManager.superstate.formulaContext,this.spaceManager.superstate.pathsIndex, this.spaceManager.superstate.spacesMap, command.code, command.fields.reduce((p, c) => ({ ...p, [c.name]: c }), {}), args, this.spaceManager.superstate.pathsIndex.get(path))
    } catch (e) {
      error = e
    }
    return { result, error }
  }
  public async createCommand (path: string, schema: SpaceTableSchema) {
    let mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).commandsPath)

    if (!mdbFile) {
      mdbFile = await this.createDefaultCommands(path)
    }
    
    return this.fileSystem.newFileFragment(mdbFile, 'schema', schema.id, schema)
  
  }

  public async readSystemCommands (): Promise<Library[]> {
    const strings = (await this.childrenForPath(`${this.dataPath}/${defaultActionsFolder}`, 'folder')).map(f => f.split('/').pop());
      const kits = Promise.all(strings.map(async f => {
        const frames = await this.readLibraryCommands(f);
        return {
          name: f,
          commands: Object.values(frames ?? {})
        }
      }));
      return kits
  }

  public async readLibraryCommands (name: string) : Promise<Command[]> {
    return this.fileSystem.readFileFragments({
      path: `${this.dataPath}/${defaultActionsFolder}/${name}/commands.mdb`,
      name: 'commands',
      filename: 'commands.mdb',
      parent: `${this.dataPath}/${defaultActionsFolder}/${name}`,
      isFolder: false,
      extension: 'mdb'
    }, 'mdbCommands') as Promise<Command[]>
    
  }

  public async saveSystemCommand (lib: string, command: Command) {
    const mdbFile = {
      path: `${this.dataPath}/${defaultActionsFolder}/${lib}/commands.mdb`,
      name: 'commands',
      filename: 'commands.mdb',
      parent: `${this.dataPath}/${defaultActionsFolder}/${lib}`,
      isFolder: false,
      extension: 'mdb'
    };
    if (command) {
      await this.fileSystem.saveFileFragment(mdbFile, 'schema', command.schema.id, () => command.schema)
      await this.fileSystem.saveFileFragment(mdbFile, 'mdbCommand', command.schema.id, () => command)
    } else {
      const dbField : DBTables=  {
        m_fields: {
          uniques: fieldSchema.uniques,
          cols: fieldSchema.cols,
          rows: [],
        },
        m_schema: {uniques: [],
          cols: ["id", "name", "type", "def", "predicate", "primary"],
          rows: [],}
      };
        const dbPath = mdbFile.path
        const extension = dbPath.split('.').pop();
        const folder = dbPath.split('/').slice(0, -1).join('/');
        const filename = dbPath.split('/').pop().split('.')[0];
        await this.fileSystem.newFile(folder, filename, extension, dbField)
    }
  }
  public async deleteCommand (path: string, name: string) {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).commandsPath)
    return this.fileSystem.deleteFileFragment(mdbFile, 'mdbCommand', name)
  }
  public async saveCommand (path: string, schemaId: string, saveCommand: (prev: Command) => Command) {
    let mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).commandsPath)
    if (!mdbFile) {
      mdbFile = await this.createDefaultCommands(path)
    }
    return this.fileSystem.saveFileFragment(mdbFile, 'mdbCommand', schemaId, saveCommand)
  }

  public async contextForSpace (path: string) : Promise<SpaceTable> {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).dbPath)
    if (!mdbFile) {
      return defaultTableDataForContext(this.spaceManager.superstate, this.spaceInfoForPath(path))
    }
    return this.fileSystem.readFileFragments(mdbFile, 'mdbTable', defaultContextSchemaID)
  }
  
  public async addSpaceProperty (path: string, property: SpaceProperty) {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path)?.dbPath)

    if (!mdbFile) {
      await this.createDefaultTable(path)
    }
    return this.fileSystem.newFileFragment(mdbFile, 'field', property.name, property)
  }
  public async deleteSpaceProperty (path: string, property: SpaceProperty) {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).dbPath)
    return this.fileSystem.deleteFileFragment(mdbFile, 'field', property)
  }
  
  public async saveSpaceProperty (path: string, property: SpaceProperty, oldProperty: SpaceProperty) {
    const mdbFile = await this.fileSystem.getFile(this.spaceInfoForPath(path).dbPath)
    if (!mdbFile) {
      await this.createDefaultTable(path)
    }
    return this.fileSystem.saveFileFragment(mdbFile, 'field', oldProperty, (prev) => ({...prev, ...property}))
  }
  public async addProperty (path: string, property: SpaceProperty) {
    const file = await this.fileSystem.getFile(path)
    this.fileSystem.newFileFragment(file, 'property', property.name, property)
  }
  public async saveProperties (path: string, properties:  {[key:string]: any}) {
    const file = await this.fileSystem.getFile(path)

    return this.fileSystem.saveFileFragment(file, 'property', null, (prev) => ({...prev, ...properties}))
  }

  public async readLabel (path: string) {
    
    const pathCache = this.fileSystem.getFileCache(path)?.label as PathLabel;
    if (!pathCache) {
      const file = await this.fileSystem.getFile(path);
      if (file)
      {
        return this.fileSystem.readFileFragments(file, 'label', null)
      }
      return {};
    }
    return pathCache;
  }

  public async saveLabel (path: string, label: keyof PathLabel, value: any) {
    
    if (this.spaceManager.superstate.spacesIndex.has(path)) {
      const spaceInfo = this.spaceInfoForPath(path);
      let defFile = await this.fileSystem.getFile(spaceInfo.defPath)
      let noteFile = await this.fileSystem.getFile(spaceInfo.notePath)
      if (this.spaceManager.superstate.settings.enableFolderNote) {
        if (!noteFile)
          noteFile = await this.fileSystem.newFile(spaceInfo.folderPath, spaceInfo.name, "md")
      } else {
        if (!defFile) {
          const defPath = this.spaceInfoForPath(path).defPath
          const extension = defPath.split('.').pop();
          const folder = defPath.split('/').slice(0, -1).join('/');
          const filename = defPath.split('/').pop().split('.')[0];
  
          defFile = await this.fileSystem.newFile(folder, filename, extension)
        }
        noteFile = defFile;
      }
      await this.fileSystem.saveFileLabel(noteFile, label, value)
      
      return;
    }
    
    const file = await this.fileSystem.getFile(path)
    this.fileSystem.saveFileLabel(file, label, value)
  }

  public async renameProperty (path: string, property: string, newProperty: string) {

      const file = await this.fileSystem.getFile(path)
      this.fileSystem.saveFileFragment(file, 'property', null, (prev: {[key: string]: any}) => {
       const { [property]: value, ...properties} =  prev;
       if (!value) return prev;
       return {...properties, [newProperty]: value}
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
      
          const getAllFolderContextFiles = () => {
            const folders = this.allPaths(['folder']).filter(f => !excludeSpacesPredicate(this.spaceManager.superstate.settings, f))
            
            return folders.map(f => fileSystemSpaceInfoFromFolder(this.spaceManager, f));
          }
          
          const allFolders = getAllFolderContextFiles();
          if (this.spaceManager.superstate.settings.enableDefaultSpaces) {
            const builtins = Object.keys(builtinSpaces).map(f => this.spaceManager.spaceInfoForPath(`spaces://$${f}`));
    
            const getAllTagContextFiles = () : SpaceInfo[] => this.readTags().map(f => fileSystemSpaceInfoFromTag(this.spaceManager, tagPathToTag(f))) as SpaceInfo[] ?? [];
            const allTagSpaces = getAllTagContextFiles();
            return [...builtins, ...allTagSpaces, ...allFolders]
          }
          return allFolders;
           
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
        
        const metaCache = space.defPath ? await this.fileSystem.readTextFromFile(space.defPath) : null;
        if (!metaCache) {
          const defFile = await this.fileSystem.getFile(space.notePath);
          const metaCache = defFile ? this.fileSystem.getFileCache(defFile.path)?.frontmatter : null;
          const spaceDef = metaCache ?? {};
          return parseSpaceMetadata(spaceDef, this.spaceManager.superstate.settings);
        }
        const spaceDef = safelyParseJSON(metaCache) ?? {};
        return parseSpaceMetadata(spaceDef, this.spaceManager.superstate.settings);
    }

    public async createSpace (name: string, parentPath: string, definition: SpaceDefinition) {
      const spaceInfo = this.spaceInfoForPath(parentPath)

      const newPath = spaceInfo.folderPath == '/' ? name : spaceInfo.folderPath+'/'+name;
      await this.fileSystem.createFolder(newPath);
      if (Object.keys(definition ?? {}).length > 0)
        return this.saveSpace(newPath, () => definition);
      
    }

    public async saveSpace (path: string, definitionFn: (def: SpaceDefinition) => SpaceDefinition, properties?: Record<string, any>) {
      const metadata = definitionFn(await this.spaceDefForSpace(path)) ?? {};

      const spaceInfo = this.spaceInfoForPath(path);
      let defFile = await this.fileSystem.getFile(spaceInfo.defPath)
      

      if (!defFile) {
        const defPath = this.spaceInfoForPath(path).defPath
        const extension = defPath.split('.').pop();
        const folder = defPath.split('/').slice(0, -1).join('/');
        const filename = defPath.split('/').pop().split('.')[0];

        defFile = await this.fileSystem.newFile(folder, filename, extension)
      }
      let noteFile = await this.fileSystem.getFile(spaceInfo.notePath)
      if (this.spaceManager.superstate.settings.enableFolderNote) {
        if (!noteFile)
          noteFile = await this.fileSystem.newFile(spaceInfo.folderPath, pathToString(spaceInfo.notePath), "md")
      } else {
        noteFile = defFile;
      }
      if (properties) {
        await this.fileSystem.saveFileFragment(noteFile, "property", null, (frontmatter) => ({
          ...frontmatter,
          ...(properties ?? {})
        }))
      }
      await this.fileSystem.saveFileFragment(defFile, "definition", null, (frontmatter) => ({
        [spaceJoinsKey] : metadata.joins,
        [spaceContextsKey] : metadata.contexts,
        [spaceLinksKey] : metadata.links,
        [spaceSortKey] : metadata.sort,
        [spaceTemplateKey] : metadata.template,
        [spaceTemplateNameKey] : metadata.templateName,
        defaultSticker: metadata.defaultSticker,
        defaultColor: metadata.defaultColor,
        readMode: metadata.readMode,
        fullWidth: metadata.fullWidth,
      }))
    // await this.spaceManager.onPathPropertyChanged(file.path);
      // await this.spaceManager.onSpaceCreated(path);
      return;
    }

    public renameSpace (oldPath: string, newPath: string) {
      
      const spaceInfo = this.spaceInfoForPath(oldPath);
      const newSpaceInfo = this.spaceInfoForPath(newPath);
      return this.fileSystem.renameFile(spaceInfo.folderPath, newSpaceInfo.folderPath).then(f => 
      {
        if (this.spaceManager.superstate.settings.enableFolderNote)
          this.fileSystem.renameFile(movePath(spaceInfo.notePath, newSpaceInfo.path), newSpaceInfo.notePath)
        return f
      });
    }
    public deleteSpace (path: string) {

      const spaceCache = this.spaceInfoForPath(path)
        const spaceInfo = fileSystemSpaceInfoFromTag(this.spaceManager, spaceCache.name);
        this.fileSystem.deleteFile(spaceInfo.folderPath);
    }

    public childrenForSpace (path: string) {
      return this.fileSystem.allFiles().filter(f => f.parent == path).map(f => f.path)
    }

    public async addTag (path: string, tag: string) {
      const fileCache = this.fileSystem.getFileCache(path);
      
      if (fileCache.subtype == 'md' || fileCache.subtype == 'folder') {
        
        this.fileSystem.addTagToFile(path, tag);
        return;
      }
      const tagPath = tagSpacePathFromTag(tag);
      const metadata = await this.spaceDefForSpace(tagToTagPath(tag));
      const spaceExists = ensureArray(metadata.links) ?? []
      const pathExists = spaceExists.find((f) => f == path);
      if (!pathExists) {
        spaceExists.push(path)
      }
      
      const newMetadata = {...metadata, links: spaceExists}
      await this.saveSpace(tagPath, (oldMetadata) => ({...oldMetadata, ...newMetadata}));
      await this.spaceManager.superstate.updateSpaceMetadata(tagPath, newMetadata)
      this.spaceManager.superstate.reloadPath(path, true).then(f => this.spaceManager.superstate.dispatchEvent("pathStateUpdated", {path: path}))
      
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