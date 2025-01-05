import { PathState } from "shared/types/PathState";
import { safelyParseJSON } from "shared/utils/json";

export const parsePathState = (cache: string): PathState => {
    return safelyParseJSON(cache);
}