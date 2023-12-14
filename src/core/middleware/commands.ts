import { SpaceProperty } from "types/mdb";


  export type Command = {
    name: string;
    value: string;
    properties?: SpaceProperty[]
  };

  
export interface CommandAdapter {
    manager: CommandsManager;
    runCommand: (command: string, parameters?: {[key: string]: any}) => Promise<any>;
    allCommands: () => Command[];
}
export class CommandsManager {

    mainTerminal: CommandAdapter;
    
    public static create(terminal: CommandAdapter, terminals?: CommandAdapter[]): CommandsManager {
        return new CommandsManager(terminal, terminals);
    }
    public terminals : CommandAdapter[] = [];
    private constructor(primaryTerminal : CommandAdapter, terminals?: CommandAdapter[]) {
        this.terminals = terminals ?? [];
        //adapters
        primaryTerminal.manager = this;
        this.mainTerminal = primaryTerminal
    }
    
    public runCommand (command: string, parameters?: {[key: string]: any}) {
        return this.mainTerminal.runCommand(command, parameters);
    }
    public allCommands () {
        return this.mainTerminal.allCommands();
    }
    
}