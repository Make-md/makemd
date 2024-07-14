import { IndexMap } from "core/types/indexMap";
import { Note, SpaceKit } from "types/kits";
import { WebSpaceAdapter } from "./webAdapter";

export class WebCacher {
    cache: Map<string, SpaceKit>;
    notes: Map<string, Note>;
    loading: Record<string, boolean>;
    parentMap: IndexMap;
    constructor(public adapter: WebSpaceAdapter) {
        this.cache = new Map();
        this.notes = new Map();
        this.loading = {};
        this.parentMap = new IndexMap();
    }
    async loadedKit (basePath: string, path: string, kit: SpaceKit) {
        if (!kit) return;
        this.cache.set(path, {...kit, path: path});
        this.notes.set(path + '/.def', { name: kit.name, properties: kit.properties, content: kit.content})
        await this.adapter.onNoteCreate(path + '/.def', kit.content)
        await this.adapter.onCreate(path, kit);
        
        for (const child of kit.notes) {
            const notePath = path + '/' + child.name+'.md';
            this.notes.set(notePath, { name: child.name, properties: child.properties, content: child.content})
            this.parentMap.set(notePath, new Set([path]));
            await this.adapter.onNoteCreate(notePath, kit.content)
        }
        for (const child of kit.children) {
            const childPath = basePath + '/' + child.path;
            this.parentMap.set(childPath, new Set([path]));
            await this.loadedKit(basePath, childPath, child);
        }
        
    }
    async load(path: string) : Promise<SpaceKit> {
        if (this.cache.has(path)){
            return this.cache.get(path)
        }
        this.loading[path] = true;
        return new Promise((resolve, reject) => {
            return fetch(path).then((response) => {  
                
                this.loading[path] = false;
                if (response.status !== 200) {
                    return reject(response.statusText);
                }
                return response.json()}).then(f => {
                const kit = f as SpaceKit;
                return this.loadedKit(path, path, kit).then(g => f)
                }).then((kit) => {
                return resolve(kit);
            })
            
        });
    }
    

}