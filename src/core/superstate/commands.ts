import { CLIManager } from "core/middleware/commands";
import { runActionString } from "core/utils/commands/actions";
import { runFormulaWithContext } from "core/utils/formula/parser";
import { executeCode } from "core/utils/frames/runner";
import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
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
        frame: {
            update: {
                schema: {
                    id: 'frame.update',
                    name: 'Update Frame Property',
                    type: 'api',
                    def: {
                        type: 'write',
                        description: 'Update a frame property value',
                        templateString: 'Update ${property} to ${value} in ${path}'
                    }
                },
                fields: [{
                    name: 'property',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.property
                    })
                }, {
                    name: 'value',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.value
                    })
                }, {
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: i18n.menu.path
                    })
                }],
            }
        },
        properties: {
            color: {
                schema: {
                    id: 'properties.color',
                    name: i18n.descriptions.getPropertyColor,
                    type: 'api',
                    def: {
                        type: 'get',
                        description: i18n.descriptions.getTheColorForAPropertyValue,
                        templateString: 'Get color for ${property} with value ${value}'
                    }
                },
                fields: [{
                    name: 'property',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.property
                    })
                }, {
                    name: 'value',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.value
                    })
                }],
            },
            sticker: {
                schema: {
                    id: 'properties.sticker',
                    name: i18n.descriptions.getPropertySticker,
                    type: 'api',
                    def: {
                        type: 'get',
                        description: i18n.descriptions.getTheStickericonForAProperty,
                        templateString: 'Get sticker for ${property}'
                    }
                },
                fields: [{
                    name: 'property',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.property
                    })
                }],
            },
            value: {
                schema: {
                    id: 'properties.value',
                    name: i18n.descriptions.parsePropertyValue,
                    type: 'api',
                    def: {
                        type: 'get',
                        description: 'Parse a property value according to its type',
                        templateString: 'Parse ${value} as ${type}'
                    }
                },
                fields: [{
                    name: 'type',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.labels.type
                    })
                }, {
                    name: 'value',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.value
                    })
                }],
            }
        },
        path: {
            contents: {
                schema: {
                    id: 'path.contents',
                    name: i18n.descriptions.getContentsOfPath,
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
                        alias: i18n.menu.path
                    })
                }],
            },
            properties: {
                schema: {
                    id: 'path.properties',
                    name: i18n.descriptions.getPropertiesOfPath,
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
                        alias: i18n.menu.path
                    })
                }],
            },
            label: {
                schema: {
                    id: 'path.label',
                    name: i18n.descriptions.getPathLabel,
                    type: 'api',
                    def: {
                        type: 'get',
                        description: i18n.descriptions.getTheLabelForAPath,
                        templateString: 'Get label for ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: i18n.menu.path
                    })
                }],
            },
            thumbnail: {
                schema: {
                    id: 'path.thumbnail',
                    name: i18n.descriptions.getPathThumbnail,
                    type: 'api',
                    def: {
                        type: 'get',
                        description: i18n.descriptions.getTheThumbnailForAPath,
                        templateString: 'Get thumbnail for ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: i18n.menu.path
                    })
                }],
            },
            write: {
                schema: {
                    id: 'path.write',
                    name: i18n.descriptions.writeToPath,
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
                        alias: i18n.menu.path
                    })
                },
                {
                    name: 'text',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.fieldTypes.text
                    })
                },
                {
                    name: 'append',
                    type: 'option',
                    value: JSON.stringify({
                        alias: i18n.descriptions.mode,
                        options: [
                            { name: i18n.descriptions.append, value: 'true' },
                            { name: i18n.descriptions.replace, value: 'false' },
                        ],
                    })
                }],
            },
            items: {
                schema: {
                    id: 'path.items',
                    name: i18n.descriptions.getItemsInsideOfPath,
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
                        alias: i18n.menu.path
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
                    name: i18n.descriptions.writeToFile,
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
                        alias: i18n.menu.name
                    })
                }],
            },
            setProperty: {
                schema: {
                    id: 'path.setProperty',
                    name: i18n.descriptions.setPathProperty,
                    type: 'api',
                    def: {
                        type: 'write',
                        description: i18n.descriptions.setAPropertyOnAPath,
                        templateString: 'Set ${property} to ${value} on ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: i18n.menu.path
                    })
                }, {
                    name: 'property',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.property
                    })
                }, {
                    name: 'value',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.value
                    })
                }],
            },
            contextMenu: {
                schema: {
                    id: 'path.contextMenu',
                    name: i18n.descriptions.showPathContextMenu,
                    type: 'api',
                    def: {
                        type: 'action',
                        description: i18n.descriptions.showContextMenuForAPath,
                        templateString: 'Show context menu for ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: i18n.menu.path
                    })
                }],
            }
        },
        commands: {
            run: {
                schema: {
                    id: 'commands.run',
                    name: 'Run Command',
                    type: 'api',
                    def: {
                        type: 'action',
                        description: 'Execute a command with parameters',
                        templateString: 'Run ${action} command'
                    }
                },
                fields: [{
                    name: 'action',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.labels.action
                    })
                }],
            },
            formula: {
                schema: {
                    id: 'commands.formula',
                    name: 'Run Formula',
                    type: 'api',
                    def: {
                        type: 'action',
                        description: i18n.descriptions.executeAFormulaWithParameters,
                        templateString: 'Run formula ${formula}'
                    }
                },
                fields: [{
                    name: 'formula',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.descriptions.formula
                    })
                }],
            }
        },
        table: {
            select: {
                schema: {
                    id: 'table.select',
                    name: 'Select Table Rows',
                    type: 'api',
                    def: {
                        type: 'get',
                        description: 'Get rows from a table',
                        templateString: 'Select rows from ${table} in ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: i18n.menu.path
                    })
                }, {
                    name: 'table',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.table
                    })
                }],
            },
            update: {
                schema: {
                    id: 'table.update',
                    name: 'Update Table Row',
                    type: 'api',
                    def: {
                        type: 'write',
                        description: 'Update a row in a table',
                        templateString: 'Update row ${index} in ${table} at ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: i18n.menu.path
                    })
                }, {
                    name: 'table',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.table
                    })
                }, {
                    name: 'index',
                    type: 'number',
                    value: JSON.stringify({
                        alias: i18n.descriptions.index
                    })
                }],
            },
            insert: {
                schema: {
                    id: 'table.insert',
                    name: 'Insert Table Row',
                    type: 'api',
                    def: {
                        type: 'write',
                        description: 'Insert a new row into a table',
                        templateString: 'Insert row into ${schema} at ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: i18n.menu.path
                    })
                }, {
                    name: 'schema',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.descriptions.schema
                    })
                }],
            },
            create: {
                schema: {
                    id: 'table.create',
                    name: 'Create Table',
                    type: 'api',
                    def: {
                        type: 'write',
                        description: i18n.descriptions.createANewTable,
                        templateString: 'Create table ${table} at ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: i18n.menu.path
                    })
                }, {
                    name: 'table',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.table
                    })
                }],
            },
            open: {
                schema: {
                    id: 'table.open',
                    name: i18n.descriptions.openTableRow,
                    type: 'api',
                    def: {
                        type: 'open',
                        description: i18n.descriptions.openATableRow,
                        templateString: 'Open row ${index} from ${table} in ${space}'
                    }
                },
                fields: [{
                    name: 'space',
                    type: 'link',
                    value: JSON.stringify({
                        alias: 'Space'
                    })
                }, {
                    name: 'table',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.table
                    })
                }, {
                    name: 'index',
                    type: 'number',
                    value: JSON.stringify({
                        alias: i18n.descriptions.index
                    })
                }],
            },
            contextMenu: {
                schema: {
                    id: 'table.contextMenu',
                    name: i18n.descriptions.showTableRowContextMenu,
                    type: 'api',
                    def: {
                        type: 'action',
                        description: i18n.descriptions.showContextMenuForATableRow,
                        templateString: 'Show context menu for row ${index} in ${table}'
                    }
                },
                fields: [{
                    name: 'space',
                    type: 'link',
                    value: JSON.stringify({
                        alias: 'Space'
                    })
                }, {
                    name: 'table',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.table
                    })
                }, {
                    name: 'index',
                    type: 'number',
                    value: JSON.stringify({
                        alias: i18n.descriptions.index
                    })
                }],
            },
            editModal: {
                schema: {
                    id: 'table.editModal',
                    name: i18n.descriptions.openTableRowEditModal,
                    type: 'api',
                    def: {
                        type: 'action',
                        description: i18n.descriptions.openEditModalForATableRow,
                        templateString: 'Edit row ${index} in ${table} at ${space}'
                    }
                },
                fields: [{
                    name: 'space',
                    type: 'link',
                    value: JSON.stringify({
                        alias: 'Space'
                    })
                }, {
                    name: 'table',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.table
                    })
                }, {
                    name: 'index',
                    type: 'number',
                    value: JSON.stringify({
                        alias: i18n.descriptions.index
                    })
                }],
            },
            createModal: {
                schema: {
                    id: 'table.createModal',
                    name: i18n.descriptions.openTableRowCreateModal,
                    type: 'api',
                    def: {
                        type: 'action',
                        description: i18n.descriptions.openCreateModalForANewTableRow,
                        templateString: 'Create new row in ${table} at ${space}'
                    }
                },
                fields: [{
                    name: 'space',
                    type: 'link',
                    value: JSON.stringify({
                        alias: 'Space'
                    })
                }, {
                    name: 'table',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.table
                    })
                }],
            }
        },
        context: {
            select: {
                schema: {
                    id: 'context.select',
                    name: 'Select Context Rows',
                    type: 'api',
                    def: {
                        type: 'get',
                        description: 'Get rows from a context',
                        templateString: 'Select rows from ${table} in ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: i18n.menu.path
                    })
                }, {
                    name: 'table',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.table
                    })
                }],
            },
            update: {
                schema: {
                    id: 'context.update',
                    name: 'Update Context Value',
                    type: 'api',
                    def: {
                        type: 'write',
                        description: 'Update a value in a context',
                        templateString: 'Update ${field} to ${value} for ${file} in ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: i18n.menu.path
                    })
                }, {
                    name: 'file',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.fieldTypes.file
                    })
                }, {
                    name: 'field',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.descriptions.field
                    })
                }, {
                    name: 'value',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.value
                    })
                }],
            },
            insert: {
                schema: {
                    id: 'context.insert',
                    name: 'Insert Context Item',
                    type: 'api',
                    def: {
                        type: 'write',
                        description: 'Insert a new item into a context',
                        templateString: 'Insert ${name} into ${schema} at ${path}'
                    }
                },
                fields: [{
                    name: 'path',
                    type: 'link',
                    value: JSON.stringify({
                        alias: i18n.menu.path
                    })
                }, {
                    name: 'schema',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.descriptions.schema
                    })
                }, {
                    name: 'name',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.menu.name
                    })
                }],
            }
        },
        date: {
            parse: {
                schema: {
                    id: 'date.parse',
                    name: 'Parse Date',
                    type: 'api',
                    def: {
                        type: 'get',
                        description: i18n.descriptions.parseADateString,
                        templateString: 'Parse date ${date}'
                    }
                },
                fields: [{
                    name: 'date',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.fieldTypes.date
                    })
                }],
            },
            daysInMonth: {
                schema: {
                    id: 'date.daysInMonth',
                    name: i18n.descriptions.daysInMonth,
                    type: 'api',
                    def: {
                        type: 'get',
                        description: i18n.descriptions.getNumberOfDaysInAMonth,
                        templateString: 'Get days in month for ${date}'
                    }
                },
                fields: [{
                    name: 'date',
                    type: 'date',
                    value: JSON.stringify({
                        alias: i18n.fieldTypes.date
                    })
                }],
            },
            format: {
                schema: {
                    id: 'date.format',
                    name: 'Format Date',
                    type: 'api',
                    def: {
                        type: 'get',
                        description: i18n.descriptions.formatADateWithAPattern,
                        templateString: 'Format ${date} as ${format}'
                    }
                },
                fields: [{
                    name: 'date',
                    type: 'date',
                    value: JSON.stringify({
                        alias: i18n.fieldTypes.date
                    })
                }, {
                    name: 'format',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.descriptions.format
                    })
                }],
            },
            component: {
                schema: {
                    id: 'date.component',
                    name: i18n.descriptions.getDateComponent,
                    type: 'api',
                    def: {
                        type: 'get',
                        description: i18n.descriptions.getAComponentOfADate,
                        templateString: 'Get ${component} from ${date}'
                    }
                },
                fields: [{
                    name: 'date',
                    type: 'date',
                    value: JSON.stringify({
                        alias: i18n.fieldTypes.date
                    })
                }, {
                    name: 'component',
                    type: 'option',
                    value: JSON.stringify({
                        alias: i18n.descriptions.component,
                        options: [
                            { name: i18n.timeUnits.year, value: 'year' },
                            { name: i18n.timeUnits.month, value: 'month' },
                            { name: i18n.timeUnits.day, value: 'day' },
                            { name: i18n.descriptions.dayOfWeek, value: 'dayOfWeek' },
                            { name: i18n.timeUnits.hour, value: 'hour' },
                            { name: i18n.timeUnits.minute, value: 'minute' },
                            { name: i18n.timeUnits.second, value: 'second' },
                        ],
                    })
                }],
            },
            offset: {
                schema: {
                    id: 'date.offset',
                    name: 'Offset Date',
                    type: 'api',
                    def: {
                        type: 'get',
                        description: i18n.descriptions.offsetADateByAnAmount,
                        templateString: 'Offset ${date} by ${offset} ${type}'
                    }
                },
                fields: [{
                    name: 'date',
                    type: 'date',
                    value: JSON.stringify({
                        alias: i18n.fieldTypes.date
                    })
                }, {
                    name: 'offset',
                    type: 'number',
                    value: JSON.stringify({
                        alias: i18n.descriptions.offset
                    })
                }, {
                    name: 'type',
                    type: 'option',
                    value: JSON.stringify({
                        alias: i18n.labels.type,
                        options: [
                            { name: i18n.timeUnits.day, value: 'day' },
                            { name: i18n.timeUnits.month, value: 'month' },
                            { name: i18n.timeUnits.year, value: 'year' },
                        ],
                    })
                }],
            },
            now: {
                schema: {
                    id: 'date.now',
                    name: 'Current Date',
                    type: 'api',
                    def: {
                        type: 'get',
                        description: i18n.descriptions.getTheCurrentDate,
                        templateString: i18n.descriptions.getCurrentDate
                    }
                },
                fields: [],
            },
            range: {
                schema: {
                    id: 'date.range',
                    name: 'Date Range',
                    type: 'api',
                    def: {
                        type: 'get',
                        description: i18n.descriptions.getARangeOfDates,
                        templateString: 'Get dates from ${start} to ${end}'
                    }
                },
                fields: [{
                    name: 'start',
                    type: 'date',
                    value: JSON.stringify({
                        alias: 'Start Date'
                    })
                }, {
                    name: 'end',
                    type: 'date',
                    value: JSON.stringify({
                        alias: 'End Date'
                    })
                }, {
                    name: 'format',
                    type: 'text',
                    value: JSON.stringify({
                        alias: i18n.descriptions.format
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
