import { CLIManager } from "core/middleware/commands";
import { runActionString } from "core/utils/commands/actions";
import { runFormulaWithContext } from "core/utils/formula/parser";
import { executeCode } from "core/utils/frames/runner";
import { Superstate } from "makemd-core";
import { ActionInstance, ActionTree, CLIAdapter } from "shared/types/actions";
import { Command, CommandWithPath } from "shared/types/commands";
import { parseURI } from "shared/utils/uri";

export class SpacesCommandsAdapter implements CLIAdapter {
    manager: CLIManager;
    scheme = 'spaces';

    constructor(manager: CLIManager, private superstate: Superstate) {
        this.manager = manager;   
    }

    public async reloadCommands() {
        // API commands are static, no need to reload
    }

    public apiCommands : {[key: string]: {[key: string]: Command}} = {
        path: {
            contents: {
                schema: {
                    id: 'path.contents',
                    name: 'Get Contents of Path',
                    type: 'api',
                    def: {
                        type: 'get',
                        description: '',
                        templateString: 'Get contents of ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: 'Path'
                    })
                }],
            },
            properties: {
                schema: {
                    id: 'path.properties',
                    name: 'Get Properties of Path',
                    type: 'api',
                    def: {
                        type: 'get',
                        description: '',
                        templateString: 'Get properties of ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: 'Path'
                    })
                }],
            },
            write: {
                schema: {
                    id: 'path.write',
                    name: 'Write to Path',
                    type: 'api',
                    def: {
                        type: 'write',
                        description: '',
                        templateString: '${append} ${text} to ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: 'Path'
                    })
                },
                {
                    name: 'text',
                    type: 'text',
                    value: JSON.stringify({
                        alias: 'Text'
                    })
                },
                {
                    name: 'append',
                    type: 'option',
                    value: JSON.stringify({
                        alias: 'Mode',
                        options: [
                            { name: 'Append', value: 'true' },
                            { name: 'Replace', value: 'false' },
                        ],
                    })
                }],
            },
            items: {
                schema: {
                    id: 'path.items',
                    name: 'Get Items Inside of Path',
                    type: 'api',
                    def: {
                        type: 'get',
                        description: '',
                        templateString: 'Get list of items in ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link'
                }],
            },
            pin: {
                schema: {
                    id: 'path.pin',
                    name: 'Add Path to Space',
                    type: 'api',
                    def: {
                        type: 'add',
                        description: '',
                        templateString: 'Add path to ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: 'Path'
                    })
                },
                {
                    name: 'space',
                    type: 'space',
                    value: JSON.stringify({
                        alias: 'Space'
                    })
                }]
            },
            move: {
                schema: {
                    id: 'path.move',
                    name: 'Move Path',
                    type: 'api',
                    def: {
                        type: 'path',
                        description: ''
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link'
                },
                {
                    name: 'space',
                    type: 'space'
                }]
            },
            copy: {
                schema: {
                    id: 'path.copy',
                    name: 'Copy Path',
                    type: 'api',
                    def: {
                        type: 'write',
                        description: ''
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link'
                },
                {
                    name: 'space',
                    type: 'space'
                }]
            },
            open: {
                schema: {
                    id: 'path.open',
                    name: 'Open Path',
                    type: 'api',
                    def: {
                        type: 'open',
                        description: '',
                        templateString: 'Open ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link'
                }],
            },
            create: {
                schema: {
                    id: 'path.create',
                    name: 'Write to file',
                    type: 'api',
                    def: {
                        type: 'write',
                        description: '',
                        templateString: 'Write new ${type} ${space} ${content} with name ${name}'
                    }
                },
                fields: [{
                    name: 'name',
                    type: 'text',
                    value: JSON.stringify({
                        alias: 'Name'
                    })
                }],
            }
        }
    }

    public commandForAction(action: string): Command | null {
        if (!action) return null;
        const uri = parseURI(action);
        
        if (uri.authority === '$api') {
            const apiCommand = this.apiCommands[uri.path]?.[uri.ref];
            return apiCommand || null;
        } else if (uri.authority === '$actions') {
            return this.superstate.actions.get(uri.path)?.find(f => f.schema.id == uri.ref) || null;
        } else {
            return this.superstate.actionsIndex.get(uri.path)?.find(f => f.schema.id == uri.ref) || null;
        }
    }

    public async runCommand(action: string, instance: ActionInstance): Promise<ActionInstance> {
        const uri = parseURI(action);
        
        if (uri.authority !== '$api') {
            const command = this.commandForAction(action);
            if (!command) {
                return {...instance, error: new Error(`Command not found for action: ${action}`)};
            }

            let newInstance = instance;
            try {
                if (command.schema.type === 'actions') {
                    newInstance = await runActionString(this.superstate, command.code || "", instance);
                } else if (command.schema.type === 'script') {
                    newInstance.result = await executeCode(command.code, {...instance.instanceProps, $prev: instance.result});
                } else if (command.schema.type === 'formula') {
                    newInstance.result = runFormulaWithContext(
                        this.superstate.formulaContext,
                        this.superstate.pathsIndex,
                        this.superstate.spacesMap,
                        command.code,
                        command.fields.reduce((p, c) => ({ ...p, [c.name]: c }), {$prev: instance.result}),
                        instance.instanceProps
                    );
                }
            } catch (e) {
                newInstance.error = e;
            }
            return newInstance;
        }
        
        const command = this.commandForAction(action);
        
        if (!command) {
            return {...instance, error: new Error(`Command not found for action: ${action}`)};
        }
        
        let newInstance = instance;
        let result;
        
        try {
            if (command.schema.type === 'api') {
                const [namespace, method] = command.schema.id.split('.');
                const api = this.superstate.api as unknown as Record<string, any>;
                const namespaceMethods = api[namespace];
                
                if (namespaceMethods && typeof namespaceMethods[method] === 'function') {
                    result = await namespaceMethods[method](...command.fields.map(f => instance.instanceProps[f.name]));
                }
            }
        } catch (e) {
            newInstance.error = e;
        }
        
        if (command.schema.type === 'api' && result !== undefined) {
            newInstance = {...newInstance, result};
        }
        
        return newInstance;
    }

    allCommands(): CommandWithPath[] {
        const apiCommands: CommandWithPath[] = [];
        
        Object.keys(this.apiCommands).forEach(namespace => {
            Object.keys(this.apiCommands[namespace]).forEach(method => {
                apiCommands.push({
                    scheme: 'spaces',
                    path: `spaces://$api/${namespace}/#;${method}`,
                    ...this.apiCommands[namespace][method]
                });
            });
        });
        
        for (const [path, commands] of this.superstate.actions) {
            commands.forEach(command => {
                apiCommands.push({
                    scheme: 'spaces',
                    path: `spaces://$actions/${path}/#;${command.schema.id}`,
                    ...command
                });
            });
        }
        
        for (const [path, commands] of this.superstate.actionsIndex) {
            commands.forEach(command => {
                apiCommands.push({
                    scheme: 'spaces',
                    path: `spaces://${path}/#;${command.schema.id}`,
                    ...command
                });
            });
        }
        
        return apiCommands;
    }
}
