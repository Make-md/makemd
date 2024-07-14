
import { dbResultsToDBTables, deleteFromDB, getZippedDB, insertIntoDB, replaceDB, saveZippedDBFile, selectDB } from "adapters/mdb/db/db";
import { MDBFileTypeAdapter } from "adapters/mdb/mdbAdapter";
import { debounce } from "lodash";
import { CacheDBSchema } from "schemas/cache";
import { Database } from "sql.js";
import { DBRow, DBTables } from "types/mdb";
import { LocalCachePersister } from "../../../core/middleware/types/persister";

/** Simpler wrapper for a file-backed cache for arbitrary metadata. */
export class LocalStorageCache implements LocalCachePersister {
    public db: Database;
    public indexVersion = Date.now().toString();
    private defaultTables : DBTables;
    public constructor( public storageDBPath: string, private mdbAdapter: MDBFileTypeAdapter, types: string[]) {
        this.defaultTables = types.reduce((acc, type) => ({...acc, [type]: CacheDBSchema}), {})
    }

    public async initialize () {

        this.db = await getZippedDB(this.mdbAdapter, await this.mdbAdapter.sqlJS(), this.storageDBPath);
        let tables;
        try {
            tables =  dbResultsToDBTables(
                this.db.exec(
                    "SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%';"
                    )
            );
            } catch (e) {
                this.mdbAdapter.plugin.superstate.ui.error(e);
            tables = [];
            }
        if (tables.length == 0) {
            replaceDB(this.db, this.defaultTables);
        }
    }

public reset() {
    replaceDB(this.db, this.defaultTables);
}
    /** Store file metadata by path. */
    public async store(path: string, cache: string, type: string): Promise<void> {
        if (!this.db) return;

        await insertIntoDB(this.db, {
            [type]: {...this.defaultTables[type], rows: [{ path, cache, version: this.indexVersion}]},
        }, true)
        this.debounceSaveSpaceDatabase();
        return;
    }
    public async remove(path: string, type: string): Promise<void> {
        if (!this.db) return;
        await deleteFromDB(this.db, type, `path='${path}'`)
        this.debounceSaveSpaceDatabase();
        return;
    }
    public cleanType (type: string) {
        if (!this.db) return;
        deleteFromDB(this.db, type, `version != '${this.indexVersion}'`)
        return;
    }
    private debounceSaveSpaceDatabase = debounce(
        () => {
             saveZippedDBFile(this.mdbAdapter, this.storageDBPath, this.db.export().buffer)
    }, 5000,
    {
        leading: false,
      })

    /** Obtain a list of all persisted files. */
    public async loadAll(type: string): Promise<DBRow[]> {
        if (!this.db) return;
        return selectDB(this.db, type)?.rows ?? []
    }

}