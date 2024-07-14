import { ActionInstance } from "core/types/actions";
import { parseURI } from "core/utils/uri";
import { Superstate } from "makemd-core";
import { Command, CommandWithPath } from "types/commands";
import { SpaceProperty } from "types/mdb";
import { URI } from "types/path";


export interface CLIAdapter {
    manager: CLIManager;
    scheme: string;
    commandForAction: (action: string) => Command;
    runCommand: (command: string, instance: ActionInstance) => Promise<any>;
    allCommands: () => CommandWithPath[];

}

type BuiltinCommand = {
    id: string;
    name: string;
    icon: string;
    description: string;
    fields: SpaceProperty[];
    
}


const builtinCommands : BuiltinCommand[] = [
    
//     {
//     id: 'loop',
//     icon: 'lucide//repeat',
//     description: 'Loop over a list',
//     name: 'Loop',
//     fields: [{
//         name: 'list',
//         type: 'object-multi',
//         schemaId: ''
//     }],
// },
{
    id: 'filter',
    icon: 'lucide//filter',
    description: 'Only continue if a condition is met',
    name: 'Filter',
    fields: [],
},
{
    id: 'formula',
    icon: 'lucide//sigma',
    description: 'Use a formula to calculate a result',
    name: 'Formula',
    fields: [],
}]




export class CLIManager {
public builtinCommands : Command[]
    mainTerminal: CLIAdapter;
    
    
    public static create(terminal: CLIAdapter, ): CLIManager {
        return new CLIManager(terminal,);
    }
    public terminals : CLIAdapter[] = [];
    public superstate: Superstate;
    private constructor(primaryTerminal : CLIAdapter,) {
        this.terminals = [primaryTerminal];
        //adapters
        primaryTerminal.manager = this;
        this.mainTerminal = primaryTerminal
        this.builtinCommands = builtinCommands.map(f => ({
            schema: {id: f.id,
            name: f.name,
            def: {
                icon: f.icon,
                description: f.description,
            },
            type: 'builtin',
            },
            fields: f.fields,
        }))
    }
    
    public terminalForURI = (uri: URI) => {
        if (!uri) return null;
        
        if (uri.scheme == null || uri.scheme == 'vault') {
            return this.mainTerminal;
        } 
        return this.terminals.find(f => f.scheme == uri.scheme)
    }

    public commandForAction = (action: string) => {
        if (!action) return null;
        const uri = parseURI(action);
        if (uri.scheme == 'builtin') {
            
            return this.builtinCommands.find(f => f.schema.id == uri.authority)
        }
        return this.terminalForURI(uri)?.commandForAction(action);
    }
        
    public runCommand = (action: string, instance: ActionInstance) => {
        if (!action) return;
        const uri = parseURI(action);
        if (uri.scheme == 'builtin') {
            return;
        }
        const result = this.terminalForURI(uri)?.runCommand(action, instance);
        
        return result
    }
    public allCommands  (): CommandWithPath[] {
        return [...this.builtinCommands.map(f => {
            return {
                scheme: 'builtin',
                path: 'builtin://' + f.schema.id,
                ...f
            }
        }), ...this.terminals.flatMap(f => f.allCommands())];
    }
    
}