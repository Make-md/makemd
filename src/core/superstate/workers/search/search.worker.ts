import { searchPath } from "./impl";
const ctx: Worker = self as any;

ctx.onmessage = async evt => {
    const { payload, job } = evt.data;
        let result;
         if (job.type == 'search') {
            result = searchPath(payload)
        } 
    try {
        (postMessage as any)({ job, result });
    } catch (error) {
        console.log(error);
        (postMessage as any)({
            job,
            result: {
                $error: `Failed to run ${job.type} ${job.path}: ${error}`,
            },
        });
    }
};