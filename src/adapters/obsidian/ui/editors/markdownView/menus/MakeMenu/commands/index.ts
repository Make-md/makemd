import MakeMDPlugin from "main";
import { safelyParseJSON } from "utils/parsers";
import defaultCommands from "./default";

export type Command = {
  label: string;
  value: string;
  offset?: [number, number];
  icon: string;
};

export function resolveCommands(plugin: MakeMDPlugin): Command[] {
  const allFrames = plugin.superstate.settings.quickFrames.flatMap(f => plugin.superstate.framesIndex.get(f)?.schemas.map(g => ({...g, path: f}))).map(f => ({
    label: f.name,
    value: `![![${f.path}#*${f.id}]]`,
    icon: safelyParseJSON(f.def)?.icon
  }))
  return [...defaultCommands];
}
