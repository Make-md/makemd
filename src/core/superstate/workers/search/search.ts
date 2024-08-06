
import { Superstate } from "core/superstate/superstate";
import { WorkerJobType } from "core/types/superstate";
import { stringifyJob } from "core/utils/superstate/serializer";
//@ts-ignore
import SearchWorker from "./search.worker";
/** Callback when a file is resolved. */
type FileCallback = (p: any) => void;


/** Multi-threaded file parser which debounces rapid file requests automatically. */
export class Searcher {
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
            const worker = new SearchWorker({ name: "Make.md Superstate Indexer " + (index + 1) });

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
    public run<T>(jerb: WorkerJobType): Promise<T> {
        
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
        if (job.type == 'search') {
                this.message(workerId, {
                job, 
                payload:{
                    queries: job.payload.queries,
                    pathsIndex: this.cache.pathsIndex,
                    count: job.payload.count,
                }
            })
            this.busy[workerId] = true;
        }
        if (job.type == 'fastSearch') {
            this.message(workerId, {
                job, 
                payload:{
                    query: job.payload.query,
                    pathsIndex: this.cache.pathsIndex,
                    count: job.payload.count,
                }
            })
            this.busy[workerId] = true
        }

    

}
    private message(workerId: number, message: {job: WorkerJobType, payload: any}) {
        this.workers[workerId].postMessage(
            message
        )

    }
    /** Find the next available, non-busy worker; return undefined if all workers are busy. */
    private nextAvailableWorker(): number | undefined {
        const index = this.busy.indexOf(false);
        return index == -1 ? undefined : index;
    }
}