

import { PathState } from "core/types/superstate";
import { pathByDef } from "core/utils/spaces/query";

export function searchPath (payload: { queries: [], pathsIndex: Map<string, PathState>, count: number}) {
    const { queries, pathsIndex, count } = payload;

    const paths = [];

    for (const [k, f] of pathsIndex) {
      if (!f.hidden && pathByDef(queries, f, {})) {
        paths.push(f);
      }
    }
    return paths.slice(0, count);

}
