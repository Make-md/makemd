import { DBRow } from "types/mdb";


export abstract class LocalCachePersister {
    public abstract initialize(): Promise<void>;
    public abstract store(path: string, cache: string, type: string): Promise<void>;
    public abstract reset(): void;
    public abstract remove(path: string, type: string): Promise<void>;
    public abstract cleanType(type: string): void;
    public abstract loadAll(type: string): Promise<DBRow[]>;
}
