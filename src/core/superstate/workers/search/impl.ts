

import { pathByDef } from "core/utils/spaces/query";
import Fuse from "fuse.js";
import { PathState } from "shared/types/PathState";
import { SpaceDefGroup } from "shared/types/spaceDef";

export function fastSearch (payload: { query: string, pathsIndex: Map<string, PathState>, count: number}) {
    const { query, pathsIndex, count } = payload;

    const paths = [];

    const fuseOptions = {
      // isCaseSensitive: false,
      // includeScore: false,
      shouldSort: true,
      // includeMatches: false,
      // findAllMatches: false,
      // minMatchCharLength: 1,
      // location: 0,
      threshold: 0,
      // distance: 100,
      // useExtendedSearch: false,
      ignoreLocation: true,
      // ignoreFieldNorm: false,
      // fieldNormWeight: 1,
      keys: [{ name: 'name', weight: 2 }, "path", 'label.preview', { name: 'spaceNames', weight: 0.5 }],
    };
    const fuse = new Fuse([...pathsIndex.values()].filter(f => f.hidden == false), fuseOptions);
    return fuse.search(query).map((result) => result.item).slice(0, count);

}

export function searchPath (payload: { queries: SpaceDefGroup[], pathsIndex: Map<string, PathState>, count: number}) {
    const { queries, pathsIndex, count } = payload;
    const paths = [];

    for (const [k, f] of pathsIndex) {
      if (!f.hidden && pathByDef(queries, f, {})) {
        paths.push(f);
      }
    }
    return paths.slice(0, count);

}
