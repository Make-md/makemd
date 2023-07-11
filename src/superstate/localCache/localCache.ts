
import localforage from "localforage";


type PersistentType = "file" | "space" | "icon"
/** Simpler wrapper for a file-backed cache for arbitrary metadata. */
export class LocalStorageCache {
    public persister: LocalForage;

    public constructor(public appId: string, public version: string) {
        this.persister = localforage.createInstance({
            name: "superstate/" + appId,
            driver: [localforage.INDEXEDDB],
            description: "Superstate Index",
        });
    }


    /** Drop the entire cache instance and re-create a new fresh instance. */
    public async recreate() {
        await localforage.dropInstance({ name: "superstate/" + this.appId });
        this.persister = localforage.createInstance({
            name: "superstate/" + this.appId,
            driver: [localforage.INDEXEDDB],
            description: "Superstate Index",
        });
        
    }

    /** Load file metadata by path. */
    public async load(path: string, type: PersistentType): Promise<string | null | undefined> {
        return this.persister.getItem(this.keyForType(path, type)).then(raw => {
            let result = raw as any as string;
            return result;
        });
    }

    /** Store file metadata by path. */
    public async store(path: string, data: string, type: PersistentType): Promise<void> {
        await this.persister.setItem(this.keyForType(path, type), data);
    }
    public async remove(path: string, type: PersistentType): Promise<void> {
        await this.persister.removeItem(this.keyForType(path, type));
    }

    /** Drop old file keys that no longer exist. */
    public async synchronize(existing: string[] | Set<string>): Promise<Set<string>> {
        let keys = new Set(await this.allFiles());
        for (let exist of existing) keys.delete(exist);

        // Any keys remaining after deleting existing keys are non-existent keys that should be cleared from cache.
        for (let key of keys) await this.persister.removeItem(this.keyForType(key, "file"));

        return keys;
    }

    /** Obtain a list of all metadata keys. */
    public async allKeys(): Promise<string[]> {
        return this.persister.keys();
    }

    /** Obtain a list of all persisted files. */
    public async allFiles(): Promise<string[]> {
        let keys = await this.allKeys();
        return keys.filter(k => k.startsWith("file:")).map(k => k.substring(5));
    }

    public keyForType(path: string, type: PersistentType): string {
        return  type+":" + path;
    }
}