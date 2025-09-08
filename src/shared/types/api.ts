import { FrameContexts } from "shared/types/frameExec";
import { PathLabel } from "./caches";
import { DBRow, SpaceProperty } from "./mdb";
import { TargetLocation } from "./path";

export interface IAPI {
    frame: {
        update: (property: string, value: string, path: string, saveState: (state: any) => void) => void;
    };
    properties: {
        color: (property: SpaceProperty, value: string) => string;
        sticker: (property: SpaceProperty) => string;
        value: (type: string, value: string) => string;
    };
    path: {
        label: (path: string) => PathLabel | undefined;
        thumbnail: (path: string) => string | undefined;
        open: (path: string, target?: TargetLocation) => void;
        create: (name: string, space: string, type: string, content?: Promise<string> | string) => void;
        setProperty: (path: string, property: string, value: Promise<string> | string) => void;
        contextMenu: (e: React.MouseEvent, path: string) => void;
    };
    commands: {
        run: (action: string, parameters?: { [key: string]: any }, contexts?: FrameContexts) => void;
        formula: (formula: string, parameters: { [key: string]: any }, contexts?: FrameContexts) => void;
    };
    buttonCommand: (action: string, parameters: { [key: string]: any }, contexts: FrameContexts, saveState: (state: any) => void) => void;
    table: {
        select: (path: string, table: string) => Promise<DBRow[] | undefined>;
        update: (path: string, table: string, index: number, row: DBRow) => void;
        insert: (path: string, schema: string, row: DBRow) => Promise<void>;
        create: (path: string, table: string, properties: SpaceProperty[]) => void;
        open: (space: string, table: string, index: number, target?: TargetLocation) => Promise<void>;
        contextMenu: (e: React.MouseEvent, space: string, table: string, index: number) => Promise<void>;
    };
    context: {
        select: (path: string, table: string) => Promise<DBRow[] | undefined>;
        update: (path: string, file: string, field: string, value: string) => void;
        insert: (path: string, schema: string, name: string, row: DBRow) => Promise<void>;
    };
    date: {
        parse: (date: string) => Date;
        daysInMonth: (date: Date) => number;
        format: (date: Date, format?: string) => string;
        component: (date: Date, component: string) => number | undefined;
        offset: (date: Date, offset: number, type: string) => Date;
        now: () => Date;
        range: (start: Date, end: Date, format?: string) => string[];
    };
}