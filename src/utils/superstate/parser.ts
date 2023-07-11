import { FileMetadataCache } from "types/cache";
import { safelyParseJSON } from "utils/json";

export const parseFileCache = (cache: string): FileMetadataCache => {
    return safelyParseJSON(cache);
}