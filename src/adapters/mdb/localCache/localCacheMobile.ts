
import { dbResultsToDBTables, getZippedDB, replaceDB, saveZippedDBFile, saveZippedDBToPath, selectDB } from "adapters/mdb/db/db";
import { MDBFileTypeAdapter } from "adapters/mdb/mdbAdapter";
import { debounce } from "lodash";
import { CacheDBSchema } from "schemas/cache";
import { DBRow } from "types/mdb";
import { LocalCachePersister } from "../../../core/middleware/types/persister";


/** Simpler wrapper for a file-backed cache for arbitrary metadata. */
export class MobileCachePersister implements LocalCachePersister {
    public indexVersion = Date.now().toString();
    private maps : Record<string, Map<string, DBRow>>;
    public constructor( public storageDBPath: string, private mdbAdapter: MDBFileTypeAdapter, private types: string[]) {

    }

    public async getDB (){
        return await getZippedDB(this.mdbAdapter, await this.mdbAdapter.sqlJS(), this.storageDBPath);
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
            this.mdbAdapter.plugin.superstate.ui.error(e);
            tables = [];
            }
        if (tables.length == 0) {
            replaceDB(db, this.types.reduce((acc, type) => ({...acc, [type]: CacheDBSchema}), {}));
            await saveZippedDBFile(this.mdbAdapter, this.storageDBPath, db.export().buffer)
        }
        this.maps = this.types.reduce((p, type) => ({...p, [type]: new Map((selectDB(db, type)?.rows ?? []).map(f => [f.path, f]))}), {});
        db.close();
        
    }
public async reset() {
    const db = await this.getDB();
    replaceDB(db, this.types.reduce((acc, type) => ({...acc, [type]: CacheDBSchema}), {}));
            await saveZippedDBFile(this.mdbAdapter, this.storageDBPath, db.export().buffer)
            this.maps = this.types.reduce((acc, type) => ({...acc, [type]: new Map((selectDB(db, type)?.rows ?? []).map(f => [f.path, f]))}), {});
            db.close();
}

    /** Store file metadata by path. */
    public async store(path: string, cache: string, type: string): Promise<void> {
        this.maps[type].set(path, {path, cache, version: this.indexVersion});
        this.debounceSaveSpaceDatabase(this.maps);
        return;
    }
    public async remove(path: string, type: string): Promise<void> {
        this.maps[type].delete(path)
        this.debounceSaveSpaceDatabase(this.maps);
        return;
    }
    public async cleanType (type: string) {
        this.maps[type] = new Map( [...this.maps[type]]
            .filter(([k, f]) => f.version == this.indexVersion))
        this.debounceSaveSpaceDatabase(this.maps);
        return;
    }
    private debounceSaveSpaceDatabase = debounce(
        (maps: Record<string, Map<string, DBRow>>) => {
            const tables = Object.keys(maps).reduce((p,c) => {
                return {...p, 
                    [c] : {
                        ...CacheDBSchema,
                        rows: [...this.maps[c].values()]
                    }
                }
            }, {})
            saveZippedDBToPath(this.mdbAdapter, this.storageDBPath, tables)
    }, 2000,
    {
        leading: false,
      })

    /** Obtain a list of all persisted files. */
    public async loadAll(type: string): Promise<DBRow[]> {
        return [...this.maps[type].values()] ?? []
    }

}