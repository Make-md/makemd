import { SpaceProperty } from "./mdb";

export type Library = {
  name: string;
  commands: Command[];
}

export type CommandSchema = {
  id: string;
  name: string;
  type: string;
  //used for type definition
  //used for view options including filter, order and group
  predicate?: string;
  primary?: string;
    def?: {
      icon?: string
      type?: string
      description?: string
    }
}

export type CommandWithPath = {
  scheme: string;
  path: string;
} & Command;

export type Command = {
    schema: CommandSchema;

    fields: SpaceProperty[];
    code?: any;
    codeType?: string;
  }

  export type CommandResult = {
    result: any;
    error: any;
  }