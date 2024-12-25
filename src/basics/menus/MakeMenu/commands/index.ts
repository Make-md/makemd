import defaultCommands from "./default";

export enum CommandType {
  None,
  Command,
  Section
}

export type Command = {
  label: string;
  value: string;
  offset?: [number, number];
  icon: string;
  type?: CommandType
};

export function resolveCommands(): Command[] {
  
  return [...defaultCommands].map(f => ({...f, type: CommandType.Command}))
}
