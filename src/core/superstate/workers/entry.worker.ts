import { parseAllPaths, parseContext, parseFrames, parsePath } from "./impl";

const ctx: Worker = self as any;

ctx.onmessage = async evt => {
    const { payload, job } = evt.data;
        let result;
        if (job.type == 'path') {
            result = parsePath(payload);
        } else if (job.type == 'context') {
            result = parseContext(payload)
        }
        else if (job.type == 'frames') {
            result = parseFrames(payload)
        } else if (job.type == 'paths') {
            result = parseAllPaths(payload)
        }
    try {
        (postMessage as any)({ job, result });
    } catch (error) {
        console.log(error);
        (postMessage as any)({
            job,
            result: {
                $error: `Failed to index ${job.type} ${job.path}: ${error}`,
            },
        });
    }
};