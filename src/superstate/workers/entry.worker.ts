import { parseContext, parseFile } from "./impl";

const ctx: Worker = self as any;

ctx.onmessage = async evt => {
    let { payload, job } = evt.data;
        let result;
        if (job.type == 'file') {
            result = parseFile(payload);
        } else if (job.type == 'context') {
            result = parseContext(payload)
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