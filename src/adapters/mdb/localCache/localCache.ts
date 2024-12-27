
import { dbResultsToDBTables, deleteFromDB, getZippedDB, insertIntoDB, replaceDB, saveZippedDBFile, selectDB } from "adapters/mdb/db/db";
import { MDBFileTypeAdapter } from "adapters/mdb/mdbAdapter";
import { debounce } from "lodash";
import { CacheDBSchema } from "schemas/cache";
import { DBRow, DBTables } from "shared/types/mdb";
import { sanitizeSQLStatement } from "shared/utils/sanitizers";
import { Database } from "sql.js";
import { LocalCachePersister } from "../../../shared/types/persister";

/** Simpler wrapper for a file-backed cache for arbitrary metadata. */
export class LocalStorageCache implements LocalCachePersister {
    public db: Database;
    private initialized: boolean;
    public indexVersion = Date.now().toString();
    private defaultTables : DBTables;
    public constructor( public storageDBPath: string, private mdbAdapter: MDBFileTypeAdapter, types: string[]) {
        this.defaultTables = types.reduce((acc, type) => ({...acc, [type]: CacheDBSchema}), {})
    }

    public async unload() {
        this.initialized = false;
        this.db?.close();
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
        this.initialized = true;
    }

    public isInitialized() {
        return this.initialized;
    }
public reset() {
    if (!this.initialized) return;
    replaceDB(this.db, this.defaultTables);
}
    /** Store file metadata by path. */
    public async store(path: string, cache: string, type: string): Promise<void> {
        if (!this.initialized) return;
        if (!this.db) return;

        await insertIntoDB(this.db, {
            [type]: {...this.defaultTables[type], rows: [{ path, cache, version: this.indexVersion}]},
        }, true)
        this.debounceSaveSpaceDatabase();
        return;
    }
    public async remove(path: string, type: string): Promise<void> {
        if (!this.initialized) return;
        if (!this.db) return;
        await deleteFromDB(this.db, type, `path='${sanitizeSQLStatement(path)}'`)
        this.debounceSaveSpaceDatabase();
        return;
    }
    public cleanType (type: string) {
        if (!this.initialized) return;
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
        if (!this.initialized) return [];
        if (!this.db) return [];
        return selectDB(this.db, type)?.rows ?? []
    }

}