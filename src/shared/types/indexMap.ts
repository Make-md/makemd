//https://github.com/blacksmithgu/obsidian-dataview

export class IndexMap {
    /** Maps key -> values for that key. */
    map: Map<string, Set<string>>;
    /** Cached inverse map; maps value -> keys that reference that value. */
    invMap: Map<string, Set<string>>;

    /** Create a new, empty index map. */
    public constructor() {
        this.map = new Map();
        this.invMap = new Map();
    }

    /** Returns all values for the given key. */
    public get(key: string): Set<string> {
        const result = this.map.get(key);
        if (result) {
            return new Set(result);
        } else {
            return new Set();
        }
    }

    /** Returns all keys that reference the given key. Mutating the returned set is not allowed. */
    public getInverse(value: string): Readonly<Set<string>> {
        return this.invMap.get(value) || IndexMap.EMPTY_SET;
    }

    /** Sets the key to the given values; this will delete the old mapping for the key if one was present. */
    public set(key: string, values: Set<string>): this {
        if (!values.size) {
            // no need to store if no values
            this.delete(key);
            return this;
        }
        const oldValues = this.map.get(key);
        if (oldValues) {
            for (const value of oldValues) {
                // Only delete the ones we're not adding back
                if (!values.has(key)) this.invMap.get(value)?.delete(key);
            }
        }
        this.map.set(key, values);
        for (const value of values) {
            if (!this.invMap.has(value)) this.invMap.set(value, new Set([key]));
            else this.invMap.get(value)?.add(key);
        }
        return this;
    }

    /** Sets the key to the given values; this will delete the old mapping for the key if one was present. */
    public setInverse(key: string, values: Set<string>): this {
        if (!values.size) {
            // no need to store if no values
            this.deleteInverse(key);
            return this;
        }
        const oldValues = this.invMap.get(key);
        if (oldValues) {
            for (const value of oldValues) {
                // Only delete the ones we're not adding back
                if (!values.has(key)) this.map.get(value)?.delete(key);
            }
        }
        this.invMap.set(key, values);
        for (const value of values) {
            if (!this.map.has(value)) this.map.set(value, new Set([key]));
            else this.map.get(value)?.add(key);
        }
        return this;
    }

    /** Clears all values for the given key so they can be re-added. */
    public delete(key: string): boolean {
        const oldValues = this.map.get(key);
        if (!oldValues) return false;

        this.map.delete(key);
        for (const value of oldValues) {
            this.invMap.get(value)?.delete(key);
        }

        return true;
    }

    public deleteInverse(key: string): boolean {
        const oldValues = this.invMap.get(key);
        if (!oldValues) return false;

        this.invMap.delete(key);
        for (const value of oldValues) {
            this.map.get(value)?.delete(key);
        }

        return true;
    }

    /** Rename all references to the given key to a new value. */
    public rename(oldKey: string, newKey: string): boolean {
        const oldValues = this.map.get(oldKey);
        if (!oldValues) return false;

        this.delete(oldKey);
        this.set(newKey, oldValues);
        return true;
    }

    /** Rename all references to the given key to a new value. */
    public renameInverse(oldKey: string, newKey: string): boolean {
        const oldValues = this.invMap.get(oldKey);
        if (!oldValues) return false;

        this.deleteInverse(oldKey);
        this.setInverse(newKey, oldValues);
        return true;
    }

    /** Clear the entire index. */
    public clear() {
        this.map.clear();
        this.invMap.clear();
    }

    static EMPTY_SET: Readonly<Set<string>> = Object.freeze(new Set<string>());
}

