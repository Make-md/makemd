
import { dbResultsToDBTables, getDB, replaceDB, saveDBFile, saveDBToPath, selectDB } from "adapters/mdb/db/db";
import { MDBFileTypeAdapter } from "adapters/mdb/mdbAdapter";
import { debounce } from "lodash";
import { CacheDBSchema } from "schemas/cache";
import { DBRow, DBTables } from "types/mdb";
import { LocalCachePersister } from "./localCache";


/** Simpler wrapper for a file-backed cache for arbitrary metadata. */
export class MobileCachePersister implements LocalCachePersister {
    public indexVersion = Date.now().toString();
    private cache : DBTables;
    public constructor( public storageDBPath: string, private mdbAdapter: MDBFileTypeAdapter, private types: string[]) {

    }

    public async getDB (){
        return await getDB(this.mdbAdapter, await this.mdbAdapter.sqlJS(), this.storageDBPath);
    }
    public async initialize () {
        const db = await this.getDB();
        let tables;
        try {
            tables =  dbResultsToDBTables(
                db.exec(
                    "SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%';"
                    )
            );
            } catch (e) {
            console.log(e)
            tables = [];
            }
        if (tables.length == 0) {
            replaceDB(db, this.types.reduce((acc, type) => ({...acc, [type]: CacheDBSchema}), {}));
            await saveDBFile(this.mdbAdapter, this.storageDBPath, db.export().buffer)
        }
        this.cache = this.types.reduce((acc, type) => ({...acc, [type]: {...CacheDBSchema, rows: selectDB(db, type)?.rows ?? []}}), {});
        db.close();
        
    }


    /** Store file metadata by path. */
    public async store(path: string, cache: string, type: string): Promise<void> {
        this.cache[type].rows = [...this.cache[type].rows.filter(f => f.path != path), {path, cache, version: this.indexVersion}];
        this.debounceSaveSpaceDatabase(this.cache);
        return;
    }
    public async remove(path: string, type: string): Promise<void> {
        this.cache[type].rows = this.cache[type].rows.filter(f => f.path != path)
        this.debounceSaveSpaceDatabase(this.cache);
        return;
    }
    public async cleanType (type: string) {
        this.cache[type].rows = this.cache[type].rows.filter(f => f.version == this.indexVersion)
        this.debounceSaveSpaceDatabase(this.cache);
        return;
    }
    private debounceSaveSpaceDatabase = debounce(
        (tables) => {
            saveDBToPath(this.mdbAdapter, this.storageDBPath, tables)
    }, 2000,
    {
        leading: false,
      })

    /** Obtain a list of all persisted files. */
    public async loadAll(type: string): Promise<DBRow[]> {
        return this.cache[type].rows ?? []
    }

}