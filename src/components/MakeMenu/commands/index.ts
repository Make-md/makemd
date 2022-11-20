import MakeMDPlugin from "main"
import React from "react"
import defaultCommands from "./default"

export type Command = {
    label: string
    value: string
    offset?: [number, number]
    icon: string
}

export function resolveCommands(plugin: MakeMDPlugin) : Command[] {
    return defaultCommands
}
