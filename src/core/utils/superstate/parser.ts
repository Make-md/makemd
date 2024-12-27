import { PathState } from "shared/types/PathState";
import { safelyParseJSON } from "utils/parsers";

export const parsePathState = (cache: string): PathState => {
    return safelyParseJSON(cache);
}