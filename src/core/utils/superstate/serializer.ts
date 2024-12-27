import { PathState, WorkerJobType } from "shared/types/PathState";

export const serializePathState = (pathState: PathState) => {
    return JSON.stringify(pathState);
}

export const stringifyJob = (job: WorkerJobType) => `${job.type}:${job.path}`