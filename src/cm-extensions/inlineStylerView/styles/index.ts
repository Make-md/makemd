import MakeMDPlugin from "main"
import defaultStyles from "./default"

export type InlineStyle = {
    label: string,
    value: string,
    insertOffset: number,
    cursorOffset?: number,
    icon: string,
    mark?: string,
}

export function resolveStyles() {
    return defaultStyles
}
