import { TFile } from "obsidian";
import { SpawnPortalEvent, eventTypes, PortalType } from "types/types";
import { EditorView } from '@codemirror/view'

export const createFlowEditorInElement = (
  id: string,
  el: HTMLElement,
  type: PortalType,
  file?: string,
  from?: number,
  to?: number
) => {
  let evt = new CustomEvent(eventTypes.spawnPortal, {
    detail: { id, el, file, from, to, type },
  });
  activeWindow.dispatchEvent(evt);
};

export const loadFlowEditorByDOM = (
  el: HTMLElement,
  view: EditorView,
  id: string,
) => {
  let evt = new CustomEvent(eventTypes.loadPortal, {
    detail: { id, el, view },
  });
  activeWindow.dispatchEvent(evt);
}

export const focusFlowEditor = (id: string, top: boolean) => {
  let evt = new CustomEvent(eventTypes.focusPortal, {
    detail: { id, parent: false, top },
  });
  activeWindow.dispatchEvent(evt);
};

export const focusFlowEditorParent = (id: string, top: boolean) => {
  let evt = new CustomEvent(eventTypes.focusPortal, {
    detail: { id, parent: true, top },
  });
  activeWindow.dispatchEvent(evt);
};

export const openFileFlowEditor = (file: string, source: string) => {
  let evt = new CustomEvent(eventTypes.openFilePortal, {
    detail: { file, source },
  });
  activeWindow.dispatchEvent(evt);
};
