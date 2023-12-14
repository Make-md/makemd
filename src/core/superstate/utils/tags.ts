import { Superstate } from "makemd-core";

export const deleteTagFromPath = (superstate: Superstate, path: string, tag: string) => {
    if (superstate.spacesIndex.has(path)) {
        return superstate.spaceManager.deleteTag(superstate.spacesIndex.get(path).defPath, tag);
    }
    return superstate.spaceManager.deleteTag(path, tag);
};


export const addTagToPath = (superstate: Superstate, path: string, tag: string) => {
    if (superstate.spacesIndex.has(path)) {
        return superstate.spaceManager.addTag(superstate.spacesIndex.get(path).defPath, tag);
    }
    return superstate.spaceManager.addTag(path, tag);
};