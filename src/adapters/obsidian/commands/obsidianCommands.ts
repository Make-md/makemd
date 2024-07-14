import { CLIAdapter, CLIManager } from "core/middleware/commands";
import { parseURI } from "core/utils/uri";
import MakeMDPlugin from "main";
import { Command as ObsidianCommand } from "obsidian";
import { CommandWithPath } from "types/commands";

const obsidianCommandToCommand = (command: ObsidianCommand) : CommandWithPath => {
    if (!command) return null;
    return {
        scheme: 'obsidian',
        schema: {
            id: command.id,
            name: command.name,
            type: 'command',
        },
        path: 'obsidian://' + command.id,
        fields: [],
        code: command.callback,
        codeType: "closure"
    }
}

export class ObsidianCommands implements CLIAdapter {
    constructor (public plugin: MakeMDPlugin) {
    }

    manager: CLIManager;
    scheme = "obsidian";
    public allCommands = () => {
        return Object.values(this.plugin.app.commands.commands).map(f => obsidianCommandToCommand(f));
       }
  
    public commandForAction = (action: string) => {

        if (!action) return null;
        const uri = parseURI(action);
        return obsidianCommandToCommand(this.plugin.app.commands.commands[uri.authority]);
    }
       public runCommand = async (action: string, parameters?: {[key: string]: any}) => {
        if (!action) return;
        const uri = parseURI(action);
        const command = uri.authority
        if (this.plugin.app.commands.commands[command]?.callback) {
           this.plugin.app.commands.commands[command].callback()
       } else if (this.plugin.app.commands.commands[command].checkCallback) {
           this.plugin.app.commands.commands[command].checkCallback(false);
       }
       }
}