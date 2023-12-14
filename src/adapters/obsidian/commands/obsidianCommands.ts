import { CommandAdapter, CommandsManager } from "core/middleware/commands";
import MakeMDPlugin from "main";

export class ObsidianCommands implements CommandAdapter {
    constructor (public plugin: MakeMDPlugin) {
    }
    manager: CommandsManager;
    public allCommands = () => {
        return Object.values(this.plugin.app.commands.commands).map(f =>({name: f.name, value: f.id}))
       }
  
       public runCommand = async (command: string, parameters?: {[key: string]: any}) => {
        if (this.plugin.app.commands.commands[command].callback) {
           this.plugin.app.commands.commands[command].callback()
       } else if (this.plugin.app.commands.commands[command].checkCallback) {
           this.plugin.app.commands.commands[command].checkCallback(false);
       }
       }
}