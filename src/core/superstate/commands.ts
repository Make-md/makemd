
import { CLIAdapter, CLIManager } from "core/middleware/commands";
import { ActionInstance } from "core/types/actions";
import { runActionString } from "core/utils/commands/actions";
import { runFormulaWithContext } from "core/utils/formula/parser";
import { executeCode } from "core/utils/frames/runner";
import { parseURI } from "core/utils/uri";
import { Superstate } from "makemd-core";
import { Command, CommandWithPath } from "types/commands";



export class SpacesCommandsAdapter implements CLIAdapter {
    manager: CLIManager;
    scheme = 'spaces';

    constructor(manager: CLIManager, private superstate: Superstate) {
        this.manager = manager;   
    }

    public apiCommands : {[key: string]: {[key: string]: Command}} = {
        
        path:
        {
            
            open: {
                schema: {
                    id: 'path.open',
                    name: 'Open Path',
                    type: 'api'
                },
                fields: [{
                    name: 'path',
                    type: 'link'
                }],
            },
            create: {
                schema: {
                    id: 'path.create',
                    name: 'Create Item',
                    type: 'api'
                },
                fields: [{
                    name: 'name',
                    type: 'text'
                }, {
                    name: 'space',
                    type: 'space'
                }, {
                    name: 'content',
                    type: 'text'
                }],
            },
            setProperty: {
                schema: {
                    id: 'path.setProperty',
                    name: 'Save Property',
                    type: 'api'
                },
                fields: [
                    {
                        name: 'path',
                        type: 'link'
                    },
                    {
                    name: 'property',
                    type: 'option',
                    value: JSON.stringify({
                        source: "$properties"
                    })
                }, {
                    name: 'value',
                    type: 'text'
                }],
            },
            
        },
        table: {
            select: {
                schema: {
                    id: 'table.select',
                    name: 'Get All List Items from Table',
                    type: 'api'
                },
                fields: [{
                    name: 'path',
                    type: 'link'
                }, {
                    name: 'table',
                    type: 'text'
                }],
            },
            update: {
                schema: {
                    id: 'table.update',
                    name: 'Update List Item in Table',
                    type: 'api'
                },
                fields: [
                    {
                        name: 'path',
                        type: 'link'
                    },
                    {
                    name: 'table',
                    type: 'text'
                }, {
                    name: 'index',
                    type: 'number'
                }, {
                    name: 'row',
                    type: 'object'
                }],
            },
            insert: {
                schema: {
                    id: 'table.insert',
                    name: 'Insert List Item into Table',
                    type: 'api'
                },
                fields: [{
                    name: 'path',
                    type: 'link'
                }, {
                    name: 'schema',
                    type: 'text'
                }, {
                    name: 'row',
                    type: 'object'
                }],
            }
        },
        context: {
            select: {
                schema: {
                    id: 'context.select',
                    name: 'Select Items from Context',
                    type: 'api'
                },
                fields: [{
                    name: 'path',
                    type: 'link'
                }, {
                    name: 'table',
                    type: 'text'
                }],
            },
            update: {
                schema: {
                    id: 'context.update',
                    name: 'Update Item in Context',
                    type: 'api'
                },
                fields: [{
                    name: 'path',
                    type: 'space'
                }, {
                    name: 'file',
                    type: 'link'
                }, {
                    name: 'field',
                    type: 'text'
                }, {
                    name: 'value',
                    type: 'text'
                }],
            },
            insert: {
                schema: {
                    id: 'context.insert',
                    name: 'Insert Item into Context',
                    type: 'api'
                },
                fields: [
                    {
                        name: 'path',
                        type: 'link'
                    },
                    {
                    name: 'schema',
                    type: 'text'
                }, {
                    name: 'name',
                    type: 'text'
                }, {
                    name: 'row',
                    type: 'object'
                }
                ],
            }
        },    
}

    public commandForAction (action: string) {
        if (!action) return null;
        const uri = parseURI(action);
        if (uri.authority == '$api') {
            return this.apiCommands[uri.path]?.[uri.ref]
        } else if (uri.authority == '$actions') {
            return this.superstate.actions.get(uri.path)?.find(f => f.schema.id == uri.ref)
        } else {
            return this.superstate.actionsIndex.get(uri.path)?.find(f => f.schema.id == uri.ref)
        }
    }

    public runCommand (action: string, instance: ActionInstance) {
        
        const command = this.commandForAction(action);

        let result;
        let error
        try {
            if (command.schema.type == 'api') {
                const [namespace, method] = command.schema.id.split('.')
                result = (this.superstate.api as {[key: string]: any})[namespace]?.[method]?.(...command.fields.map(f => instance.instanceProps[f.name]));
            }
            if (command.schema.type == 'actions')
            result = runActionString(this.superstate, command.code, instance)
            if (command.schema.type == 'script')
            result = executeCode(command.code, instance.instanceProps)
          if (command.schema.type == 'formula')
            result = runFormulaWithContext(this.superstate.formulaContext,this.superstate.pathsIndex, command.code, command.fields.reduce((p, c) => ({ ...p, [c.name]: c }), {}), instance.instanceProps)
          } catch (e) {
            error = e
          }
          console.log(result, error)
        return result;
    }

    allCommands(): CommandWithPath[] {
        const apiCommands = Object.keys(this.apiCommands).flatMap(f => Object.keys(this.apiCommands[f]).map(g => ({ scheme: 'spaces',  path: `spaces://$api/${f}/#;${g}`, ...this.apiCommands[f][g]})))
        const actionCommands = [...this.superstate.actions.entries()].flatMap(f => f[1].map( g => ({ scheme: 'spaces', path: `spaces://$api/${f[0]}/#;${g.schema.id}`, ...g})))
        return [...apiCommands, ...actionCommands];
        // Implement the logic to retrieve all available commands
        // Return an array of all available commands
    }

}