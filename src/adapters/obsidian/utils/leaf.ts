import { App, WorkspaceLeaf } from "obsidian";

export const workspaceLeafForDom = (app: App, dom: HTMLElement) : WorkspaceLeaf => {
    const leafDom = dom.closest('.workspace-leaf');
    let foundLeaf: WorkspaceLeaf;
    app.workspace.iterateLeaves((leaf) => {
        if (leaf.containerEl == leafDom) {
            foundLeaf = leaf;
            return true;
        }
      }, app.workspace["rootSplit"]!);
    return foundLeaf;
}