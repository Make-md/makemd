import { defaultContextDBSchema } from "shared/schemas/context";
import { SpaceTable } from "shared/types/mdb";

type Page = {
    title: string;
    contexts: string[];
    subpages: Page[];
}

type Line = {
    isTask: boolean;
    value: string;
}

export const markdownToTable = (markdown: string) => {
    const lines : Line[] = []
    const table : SpaceTable = {
        schema: defaultContextDBSchema,
        cols: [],
        rows: []
    }
return lines;
}

export const markdownToPage = (markdown: string) : Page => {
    const lineIsTodo = true;
    if (lineIsTodo) {
        
    }
    return {
        title: '',
        contexts: [],
        subpages: []
    }
}