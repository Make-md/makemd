import { EditorView } from "@codemirror/view";
import { eventTypes, PortalType } from "types/types";

export const createFlowEditorInElement = (
  id: string,
  el: HTMLElement,
  type: PortalType,
  file?: string,
  ref?: string,
  from?: number,
  to?: number
) => {
  const evt = new CustomEvent(eventTypes.spawnPortal, {
    detail: { id, el, file, from, to, ref, type },
  });
  activeWindow.dispatchEvent(evt);
};

export const loadFlowEditorByDOM = (
  el: HTMLElement,
  view: EditorView,
  id: string
) => {
  const evt = new CustomEvent(eventTypes.loadPortal, {
    detail: { id, el, view },
  });
  activeWindow.dispatchEvent(evt);
};

export const focusFlowEditor = (id: string, top: boolean) => {
  const evt = new CustomEvent(eventTypes.focusPortal, {
    detail: { id, parent: false, top },
  });
  activeWindow.dispatchEvent(evt);
};

export const focusFlowEditorParent = (id: string, top: boolean) => {
  const evt = new CustomEvent(eventTypes.focusPortal, {
    detail: { id, parent: true, top },
  });
  activeWindow.dispatchEvent(evt);
};

export const openFileFlowEditor = (file: string, source: string) => {
  const evt = new CustomEvent(eventTypes.openFilePortal, {
    detail: { file, source },
  });
  activeWindow.dispatchEvent(evt);
};
