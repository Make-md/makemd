
import { Command, CommandWithPath } from "./commands";
import { URI } from "./path";
import { ISuperstate } from "./superstate";



export interface CLIAdapter {
  manager: ICLIManager;
  scheme: string;
  commandForAction: (action: string) => Command;
  runCommand: (command: string, instance: ActionInstance) => Promise<any>;
  allCommands: () => CommandWithPath[];

}

export interface ICLIManager {
  builtinCommands: Command[];
  mainTerminal: CLIAdapter;
  terminals: CLIAdapter[];
  superstate: ISuperstate;
  terminalForURI(uri: URI): CLIAdapter | null;
  commandForAction(action: string): Command | null;
  runCommand(action: string, instance: ActionInstance): Promise<any> | void;
  allCommands(): CommandWithPath[];
}
export type ActionTree = {
  action: string;
  result?: string;
  linked?: { [key: string]: string };
  props: { [key: string]: any };
  propsValue: { [key: string]: any };
  children: ActionTree[];
};

export type ActionInstance = {
  props: { [key: string]: any };
  instanceProps: { [key: string]: any };
  result?: any;
  iterations: number;
  error?: any;
};
