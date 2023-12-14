import { PathState } from "core/types/superstate";
import { safelyParseJSON } from "utils/parsers";

export const parsePathState = (cache: string): PathState => {
    return safelyParseJSON(cache);
}