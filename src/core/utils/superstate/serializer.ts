import { PathState, WorkerJobType } from "core/types/superstate";

export const serializePathState = (pathState: PathState) => {
    return JSON.stringify(pathState);
}

export const stringifyJob = (job: WorkerJobType) => `${job.type}:${job.path}`