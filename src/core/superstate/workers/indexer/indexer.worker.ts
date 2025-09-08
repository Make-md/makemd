import { formulas } from "core/utils/formula/formulas";
import * as math from 'mathjs';
import { indexAllPaths, parseAllContexts, parseAllPaths, parseContext, parsePath } from "./impl";
const ctx: Worker = self as any;

const all = {
    ...math.all,
    createAdd: math.factory('add', [], () => function add (a: any, b: any) {
        return a + b
      }),
      createEqual: math.factory('equal', [], () => function equal (a: any, b: any) {
        return a == b
      }),
      createUnequal: math.factory('unequal', [], () => function unequal (a: any, b: any) {
        return a != b
      })
    
}
const config :math.ConfigOptions = {
    matrix: "Array"
}
const runContext = math.create(all, config)
runContext.import(formulas, { override: true })

ctx.onmessage = async evt => {
    const { payload, job } = evt.data;
        let result;
        if (job.type == 'path') {
            result = parsePath(payload);
        } else if (job.type == 'context') {
            result = parseContext(payload, runContext)
        } else if (job.type == 'contexts') {
            result = parseAllContexts(payload, runContext)
        } else if (job.type == 'paths') {
            result = parseAllPaths(payload)
        } else if (job.type == 'index') {
            result = indexAllPaths(payload);
        }
    try {
        (postMessage as any)({ job, result });
    } catch (error) {
        (postMessage as any)({
            job,
            result: {
                $error: `Failed to index ${job.type} ${job.path}: ${error}`,
            },
        });
    }
};