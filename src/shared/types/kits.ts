import { SpaceDefinition } from "shared/types/spaceDef";
import { SpaceTables } from "./mdb";
import { MDBFrame } from "./mframe";

export type Kit = {
    id: string,
    name: string,
    colors: {[key: string]: string},
    frames: MDBFrame[],
}

export type Note = {
    name: string;
    properties: Record<string, string>;
    content: string;
}
export type Assets = {
    name: string;
    path: string;
    payload?: string;
    type?: string
}

export type SpaceKit = {
    name: string;
    path: string;
    definition: SpaceDefinition;
    properties: Record<string, string>;
    context: SpaceTables;
    frames: SpaceTables;
    children: SpaceKit[];
    notes: Note[];
    assets: Assets[];
    templates: TemplateKit[];
    content: string;
}

export type TemplateKit = {
    name: string;
    type: string;
    content: string | SpaceKit;
}