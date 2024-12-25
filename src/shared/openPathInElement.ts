import { App, WorkspaceLeaf } from "obsidian";
import { FlowEditor, FlowEditorParent } from "./FlowEditor";




export const openPathInElement = (
  app: App,
  parentLeaf: WorkspaceLeaf,
  initiatingEl?: HTMLElement,
  fileName?: string,
  onShowCallback?: (leaf: FlowEditor) => Promise<unknown>
) => {
  const parent = (parentLeaf ?? app.workspace.getLeaf()) as unknown as FlowEditorParent;
  if (!initiatingEl) initiatingEl = parent.containerEl;
  const hoverPopover = new FlowEditor(
    parent,
    initiatingEl!,
    app,
    undefined,
    onShowCallback
  );

  // plugin.attachPortal(hoverPopover);
  if (fileName)
    hoverPopover.titleEl.textContent = fileName.substring(
      0,
      fileName.lastIndexOf(".")
    );
};
