
import { Component } from "obsidian";
import { vaultItemForPath } from "superstate/spacesStore/spaces";
import { Superstate } from "superstate/superstate";
import { WorkerJobType } from "types/superstate";
import { mdbContextByPath } from "utils/contexts/contexts";
import { getMDBTable } from "utils/contexts/mdb";
import { folderNoteCache, getAbstractFileAtPath, tFileToAFile } from "utils/file";
import { stringifyJob } from "utils/superstate/serializer";
//@ts-ignore
import SuperstateWorker from "./entry.worker";

/** Callback when a file is resolved. */
type FileCallback = (p: any) => void;


/** Multi-threaded file parser which debounces rapid file requests automatically. */
export class Manager extends Component {
    /* Background workers which do the actual file parsing. */
    workers: Worker[];
    /** Tracks which workers are actively parsing a file, to make sure we properly delegate results. */
    busy: boolean[];
    /** List of files which have been queued for a reload. */
    reloadQueue: WorkerJobType[];
    /** Fast-access set which holds the list of files queued to be reloaded; used for debouncing. */
    reloadSet: Set<string>;
    /** Paths -> promises for file reloads which have not yet been queued. */
    callbacks: Map<string, [FileCallback, FileCallback][]>;

    public constructor(public numWorkers: number, public cache: Superstate) {
        super();
        this.workers = [];
        this.busy = [];

        this.reloadQueue = [];
        this.reloadSet = new Set();
        this.callbacks = new Map();

        for (let index = 0; index < numWorkers; index++) {
            let worker = new SuperstateWorker({ name: "Make.md Superstate Indexer " + (index + 1) });

            worker.onmessage = (evt: Partial<any>) => this.finish(evt.data.job, evt.data.result, index);
            this.workers.push(worker);
            this.register(() => worker.terminate());
            this.busy.push(false);
        }
    }

    /**
     * Queue the given file for reloading. Multiple reload requests for the same file in a short time period will be de-bounced
     * and all be resolved by a single actual file reload.
     */
    public reload<T>(jerb: WorkerJobType): Promise<T> {
        const jobKey = stringifyJob(jerb)
        let promise: Promise<T> = new Promise((resolve, reject) => {
            if (this.callbacks.has(jobKey)) this.callbacks.get(jobKey)?.push([resolve, reject]);
            else this.callbacks.set(jobKey, [[resolve, reject]]);
        });
        // De-bounce repeated requests for the same file.
        if (this.reloadSet.has(jobKey)) return promise;
        this.reloadSet.add(jobKey);

        // Immediately run this task if there are available workers; otherwise, add it to the queue.
        let workerId = this.nextAvailableWorker();
        if (workerId !== undefined) {
            this.send(jerb, workerId);
        } else {
            this.reloadQueue.push(jerb);
        }

        return promise;
    }

    /** Finish the parsing of a file, potentially queueing a new file. */
    private finish(jerb: WorkerJobType, data: any, index: number) {
        const jobKey = stringifyJob(jerb)
        // Cache the callbacks before we do book-keeping.
        let calls = ([] as [FileCallback, FileCallback][]).concat(this.callbacks.get(jobKey) ?? []);
        // Book-keeping to clear metadata & allow the file to be re-loaded again.
        this.reloadSet.delete(jobKey);
        this.callbacks.delete(jobKey);

        // Notify the queue this file is available for new work.
        this.busy[index] = false;

        // Queue a new job onto this worker.
        let job = this.reloadQueue.shift();
        if (job !== undefined) this.send(job, index);

        // Resolve promises to let users know this file has finished.
        if ("$error" in data) {
            for (let [_, reject] of calls) reject(data["$error"]);
        } else {
            for (let [callback, _] of calls) callback(data);
        }
    }

    /** Send a new task to the given worker ID. */
    private send(job: WorkerJobType, workerId: number) {
        
        if (job.type == 'file')
        {
            const file = tFileToAFile(getAbstractFileAtPath(app, job.path));
            if (!file)
            return;
            
            const folderNote = this.cache.plugin.settings.enableFolderNote ? folderNoteCache(this.cache.plugin, file) : null;
            const metadataPath = folderNote && file.isFolder ? folderNote.folderNotePath : file.path
            this.workers[workerId].postMessage({
                job, 
                payload:{
                    file,
                    settings: this.cache.plugin.settings, 
                    contextsCache: this.cache.contextsIndex,
                    spacesCache: this.cache.spacesIndex, 
                    vaultItem: vaultItemForPath(this.cache.plugin, job.path), 
                    metadataCache: app.metadataCache.getCache(metadataPath),
                    resolvedLinks: app.metadataCache.resolvedLinks,
                    folderNote: folderNote,
                    oldMetadata: this.cache.filesIndex.get(job.path)
                }
            })
            this.busy[workerId] = true;
        }
        if (job.type == 'context')
        {
            const context = mdbContextByPath(this.cache.plugin, job.path)
            if (!context) {
                return;
            }
            getMDBTable(this.cache.plugin, context, 'files').then(mdbTable => {
                this.workers[workerId].postMessage({
                job, 
                payload:{
                    context,
                    mdbTable,
                    oldCache: this.cache.contextsIndex.get(job.path)
                }
            })
            this.busy[workerId] = true;
        })}
    }

    /** Find the next available, non-busy worker; return undefined if all workers are busy. */
    private nextAvailableWorker(): number | undefined {
        let index = this.busy.indexOf(false);
        return index == -1 ? undefined : index;
    }
}