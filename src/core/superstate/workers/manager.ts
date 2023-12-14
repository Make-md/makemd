
import { Superstate } from "core/superstate/superstate";
import { WorkerJobType } from "core/types/superstate";
import { stringifyJob } from "core/utils/superstate/serializer";
//@ts-ignore
import SuperstateWorker from "./entry.worker";
import { BatchPathWorkerPayload, PathWorkerPayload } from "./impl";

/** Callback when a file is resolved. */
type FileCallback = (p: any) => void;


/** Multi-threaded file parser which debounces rapid file requests automatically. */
export class Manager {
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

        this.workers = [];
        this.busy = [];

        this.reloadQueue = [];
        this.reloadSet = new Set();
        this.callbacks = new Map();

        for (let index = 0; index < numWorkers; index++) {
            const worker = new SuperstateWorker({ name: "Make.md Superstate Indexer " + (index + 1) });

            worker.onmessage = (evt: Partial<any>) => this.finish(evt.data.job, evt.data.result, index);
            this.workers.push(worker);
            // this.register(() => worker.terminate());
            this.busy.push(false);
        }
    }

    /**
     * Queue the given file for reloading. Multiple reload requests for the same file in a short time period will be de-bounced
     * and all be resolved by a single actual file reload.
     */
    public reload<T>(jerb: WorkerJobType): Promise<T> {
        const jobKey = stringifyJob(jerb)
        const promise: Promise<T> = new Promise((resolve, reject) => {
            if (this.callbacks.has(jobKey)) this.callbacks.get(jobKey)?.push([resolve, reject]);
            else this.callbacks.set(jobKey, [[resolve, reject]]);
        });
        // De-bounce repeated requests for the same file.
        if (this.reloadSet.has(jobKey)) return promise;
        this.reloadSet.add(jobKey);

        // Immediately run this task if there are available workers; otherwise, add it to the queue.
        const workerId = this.nextAvailableWorker();
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
        const calls = ([] as [FileCallback, FileCallback][]).concat(this.callbacks.get(jobKey) ?? []);
        // Book-keeping to clear metadata & allow the file to be re-loaded again.
        this.reloadSet.delete(jobKey);
        this.callbacks.delete(jobKey);

        // Notify the queue this file is available for new work.
        this.busy[index] = false;

        // Queue a new job onto this worker.
        const job = this.reloadQueue.shift();
        if (job !== undefined) this.send(job, index);

        // Resolve promises to let users know this file has finished.
        if ("$error" in data) {
            for (const [_, reject] of calls) reject(data["$error"]);
        } else {
            for (const [callback, _] of calls) callback(data);
        }
    }

    /** Send a new task to the given worker ID. */
    private async send(job: WorkerJobType, workerId: number) {
        if (job.type == 'paths') {
            const payload : BatchPathWorkerPayload = {
                    settings: this.cache.settings, 
                    spacesCache: this.cache.spacesIndex, 
                    pathCache: this.cache.spaceManager.allCaches(),
                    oldMetadata: this.cache.pathsIndex
            }
            this.workers[workerId].postMessage({
                job, 
                payload: payload
            })
            this.busy[workerId] = true;
            return;
        }
        if (job.type == 'path')
        {
            const cachePath = this.cache.spacesIndex.get(job.path)?.defPath ?? job.path;
            const pathMetadata = await this.cache.spaceManager.readPathCache(cachePath) ?? await this.cache.spaceManager.readPathCache(job.path);
            const label = pathMetadata.label
            const parent = await this.cache.spaceManager.parentForPath(job.path)
            const type = this.cache.spacesIndex.has(job.path) ? 'space' : pathMetadata?.file?.extension
            const payload : PathWorkerPayload = {
                path: job.path,
                    settings: this.cache.settings, 
                    spacesCache: this.cache.spacesIndex, 
                    pathMetadata,
                    label,
                    parent,
                    type,
                    oldMetadata: this.cache.pathsIndex.get(job.path)
            }
            this.workers[workerId].postMessage({
                job, 
                payload: payload
            })
            this.busy[workerId] = true;
            return;
        }
        if (job.type == 'context')
        {
            const space = this.cache.spacesIndex.get(job.path)?.space
            if (!space || !space.path) {
                this.workers[workerId].postMessage({
                    job, 
                    payload:{
                        space,
                        mdb: null,
                        paths: [...this.cache.spacesMap.getInverse(job.path)],
                        oldCache: this.cache.contextsIndex.get(job.path),
                    }
                })
                this.busy[workerId] = true;
                return;
            }
            this.cache.spaceManager.readAllTables(space.path).then(mdb => {
                this.workers[workerId].postMessage({
                job, 
                payload:{
                    space,
                    mdb,
                    paths: [...this.cache.spacesMap.getInverse(job.path)],
                    oldCache: this.cache.contextsIndex.get(job.path),
                }
            })
            this.busy[workerId] = true;
        })
        return;
    }
        if (job.type == 'frames')
        {
            const space = this.cache.spacesIndex.get(job.path)?.space

            if (!space) {
                this.workers[workerId].postMessage({
                    job, 
                    payload:{
                        space,
                        mdb: null,
                        oldCache: this.cache.framesIndex.get(job.path),
                    }
                })
                this.busy[workerId] = true;
                return;
            }
            this.cache.spaceManager.readAllFrames(space.path).then(mdb => {

                this.workers[workerId].postMessage({
                job, 
                payload:{
                    space,
                    mdb,
                    oldCache: this.cache.framesIndex.get(job.path),
                }
            })
            this.busy[workerId] = true;
        })
        return;
    }
    }

    /** Find the next available, non-busy worker; return undefined if all workers are busy. */
    private nextAvailableWorker(): number | undefined {
        const index = this.busy.indexOf(false);
        return index == -1 ? undefined : index;
    }
}