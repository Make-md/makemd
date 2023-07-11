import { FileMetadataCache } from "types/cache";
import { WorkerJobType } from "types/superstate";

export const serializeFileCache = (fileCache: FileMetadataCache) => {
    return JSON.stringify(fileCache);
}

export const stringifyJob = (job: WorkerJobType) => `${job.type}:${job.path}`