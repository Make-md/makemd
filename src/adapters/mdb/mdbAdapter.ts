
import { mdbFrameToDBTables, mdbTablesToDBTables, saveDBToPath } from 'adapters/mdb/db/db';
import { deleteMDBTable, getMDB, getMDBTable, getMDBTableProperties, getMDBTableSchemas, getMDBTables } from 'adapters/mdb/utils/mdb';
import MakeMDPlugin from 'main';
import { AFile, FileTypeAdapter, FilesystemMiddleware } from 'makemd-core';
import { DBTable, DBTables, MDB, SpaceProperty, SpaceTable, SpaceTableSchema, SpaceTables } from 'types/mdb';
import { MDBFrame } from 'types/mframe';
import { loadSQL } from "./db/sqljs";
import { deletePropertyToDBTables, savePropertyToDBTables } from './utils/property';
import { saveSchemaToDBTables } from './utils/schema';
type MDBContent = {
    schema: SpaceTableSchema,
    schemas: SpaceTableSchema[],
    field: SpaceProperty,
    fields: SpaceProperty[],
    table: DBTable,
    tables: DBTables,
    mdbTable: SpaceTable,
    mdbTables: SpaceTables,
    mdbFrame: MDBFrame,
}

export class MDBFileTypeAdapter implements FileTypeAdapter<MDB, MDBContent> {

    constructor (public plugin: MakeMDPlugin) {
    }
    public async sqlJS() {
        // console.time("Loading SQlite");
        const sqljs = await loadSQL();
        // console.timeEnd("Loading SQlite");
        return sqljs;
      }
    public async newFile (parent: string, name: string, type: string, content?: DBTables) {
        const newPath = `${parent}/${name}.${type}`;
        await saveDBToPath(this, newPath, content);

        return this.middleware.getFile(newPath)
    }

    public supportedFileTypes = ['mdb'];
    public id = "mdb.make.md";
    public cache: Map<string, MDB>
    public middleware: FilesystemMiddleware;
    public initiate (middleware: FilesystemMiddleware) {
        this.middleware = middleware;
        this.cache = new Map();
    }
    
    public async parseCache (file: AFile, refresh: boolean) {    
        await getMDB(this, file.path).then(mdb => {
            this.cache.set(file.path, {
                schemas: mdb.schemas,
                fields: mdb.fields,
                tables: mdb.tables
            })
        })
        this.middleware.updateFileCache(file.path, this.cache.get(file.path), refresh);
    }
    
    public contentTypes (file: AFile) {
        return ['schemas', 'fields', 'tables', 'field', 'table', 'schema', 'field', 'mdbTable', 'mdbTables', 'mdbFrame'] as Array<keyof MDBContent>;
    }
    public cacheTypes (file: AFile) {
        return ['schemas', 'fields', 'tables'] as Array<keyof MDB>;
    }
    public getCacheTypeByRefString (file: AFile, refString: string) 
    {
        return null as any;
    }
    public getCache (file: AFile, fragmentType: keyof MDB, query?: string) {
        return this.cache.get(file.path)[fragmentType];
    }
    public async readContent (file: AFile, fragmentType: keyof MDBContent, fragmentId: any) : Promise<MDBContent[typeof fragmentType]> {

        if (fragmentType == 'table') {
        return this.cache.get(file.path)['tables'][fragmentId];
        }
        if (fragmentType == 'schema') {
            const schema =  this.cache.get(file.path)['schemas'].find(t => t.id == fragmentId);
            if (schema) {
                return schema;
            }
            return getMDBTableSchemas(this, file.path).then(f => f.find(t => t.id == fragmentId));
        }
        if (fragmentType == 'schemas') {
            return getMDBTableSchemas(this, file.path)
        // return this.cache.get(file.path)[fragmentType]
        }
        if (fragmentType == 'fields') {
        return getMDBTableProperties(this, file.path);
        }
        
        if (fragmentType == 'mdbTables') {
            return getMDBTables(this, file.path);
        }
        if (fragmentType == 'mdbTable') {
            return getMDBTable(this, file.path, fragmentId);
            
        //    const table = this.readFragment(file, 'table', fragmentId) as DBTable;
        //    const schema = this.readFragment(file, 'schema', fragmentId) as MDBSchema;
        //    const fields = this.readFragment(file, 'fields', fragmentId) as MDBField[];
        //     return dbTableToMDBTable(table, schema, fields)
        }
        
        if (fragmentType == 'mdbFrame') {
            return getMDBTable(this, file.path, fragmentId);
        }
    }
    public async newContent (file: AFile, fragmentType: keyof MDBContent, name: string, content: any, options: { [key: string]: any; }) {

        if (fragmentType == 'schema') {
            const dbTables = saveSchemaToDBTables(content, this.cache.get(file.path).schemas);
            return saveDBToPath(this, file.path, dbTables)
        }
        if (fragmentType == 'field') {
            
            const oldFields = await this.readContent(file, 'fields', null) as SpaceProperty[]
            const dbTables = savePropertyToDBTables(content, oldFields);
            return saveDBToPath(this, file.path, dbTables)
        }
        if (fragmentType == 'table') {
            return saveDBToPath(this, file.path, { [name]: content})
        }
        if (fragmentType == 'tables') {
            return saveDBToPath(this, file.path, content)
        }
        if (fragmentType == 'mdbTable') {
            return saveDBToPath(this, file.path, mdbTablesToDBTables({ [name]: content }))
        }
        if (fragmentType == 'mdbFrame') {
            return saveDBToPath(this, file.path, mdbFrameToDBTables({ [name]: content }))
        }
    }
    public async saveContent (file: AFile, fragmentType: keyof MDBContent, fragmentId: any, content: (prev: any) => any) {
        if (fragmentType == 'schema') {
            const schemas = await this.readContent(file, 'schemas', null) as SpaceTableSchema[];
            const dbTables = saveSchemaToDBTables(content(schemas.find(t => t.id == fragmentId)), schemas);
            return saveDBToPath(this, file.path, dbTables)
        }
        if (fragmentType == 'field') {
            const oldFields = await this.readContent(file, 'fields', null) as SpaceProperty[]
            const oldField = oldFields.find(t => t.name == fragmentId)
            const dbTables = savePropertyToDBTables(content(oldField), oldFields, oldField);
            return saveDBToPath(this, file.path, dbTables)
        }
        if (fragmentType == 'table') {
            return saveDBToPath(this, file.path, { [fragmentId]: content(this.cache.get(file.path)['tables'][fragmentId])})
        }
        if (fragmentType == 'mdbTable') {
            const mdbTable = await this.readContent(file, 'mdbTable', fragmentId);
            return saveDBToPath(this, file.path, mdbTablesToDBTables({ [fragmentId]: content(mdbTable) }))
        }
        if (fragmentType == 'mdbFrame') {
            const mdbTable = await this.readContent(file, 'mdbFrame', fragmentId);
            return saveDBToPath(this, file.path, mdbFrameToDBTables({ [fragmentId]: content(mdbTable) }))
        }
    }
    public deleteContent(file: AFile, fragmentType: keyof MDBContent, fragmentId: any) {
        if (fragmentType == 'schema') {
            return deleteMDBTable(this, fragmentId, file.path);
        }
        if (fragmentType == 'field') {
            const field = this.cache.get(file.path)['fields'].find(t => t.name == fragmentId);
            const dbTables = deletePropertyToDBTables(field, this.cache.get(file.path).fields);
            return saveDBToPath(this, file.path, dbTables)
        }
        if (fragmentType == 'table') {
            return deleteMDBTable(this, fragmentId, file.path);
        }
    }
    
}
