import { Superstate } from "makemd-core";
import { ensureTag } from "utils/tags";
import { metadataPathForSpace } from "./spaces";

export const deleteTagFromPath = (superstate: Superstate, path: string, tag: string) => {
    if (superstate.spacesIndex.has(path)) {
        return superstate.spaceManager.deleteTag(metadataPathForSpace(superstate, superstate.spacesIndex.get(path).space), tag);
    }
    return superstate.spaceManager.deleteTag(path, tag);
};


export const addTagToPath = (superstate: Superstate, path: string, tag: string) => {

    if (superstate.spacesIndex.has(path)) {
        return superstate.spaceManager.addTag(metadataPathForSpace(superstate, superstate.spacesIndex.get(path).space), tag);
    }
    return superstate.spaceManager.addTag(path, tag);
};

export const addTag = (superstate: Superstate, tag: string) => {
    return superstate.spaceManager.createSpace(ensureTag(tag), superstate.settings.spacesFolder, null);
}