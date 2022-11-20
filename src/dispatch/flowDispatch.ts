
import { TFile } from "obsidian";
import { SpawnPortalEvent, eventTypes, PortalType } from "types/types";

export const createFlowEditorInElement = (id: string, el: HTMLElement, type: PortalType, file?: string, from?: number, to?: number) => {
    let evt = new CustomEvent(eventTypes.spawnPortal, { detail: { id, el, file, from, to, type } });
    window.dispatchEvent(evt);
}

export const focusFlowEditor = (id: string, top: boolean) => {
    let evt = new CustomEvent(eventTypes.focusPortal, { detail: { id, parent: false, top } });
    window.dispatchEvent(evt);
}

export const focusFlowEditorParent = (id: string, top: boolean) => {
    let evt = new CustomEvent(eventTypes.focusPortal, { detail: { id, parent: true, top } });
    window.dispatchEvent(evt);
}

export const openFileFlowEditor = (file: string, source: string) => {
    let evt = new CustomEvent(eventTypes.openFilePortal, { detail: { file, source} });
    window.dispatchEvent(evt);
}