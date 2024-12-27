import { showRowContextMenu } from "core/react/components/UI/Menus/contexts/rowContextMenu";
import { showPathContextMenu } from "core/react/components/UI/Menus/navigator/pathContextMenu";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { addRowInTable, updateTableRow, updateValueInContext } from "core/utils/contexts/context";
import { formatDate } from "core/utils/date";
import { runFormulaWithContext } from "core/utils/formula/parser";
import { parseContextNode, parseLinkedNode } from "core/utils/frames/frame";
import { SelectOption } from "makemd-core";
import { stickerForField } from "schemas/mdb";
import { defaultContextSchemaID } from "shared/schemas/context";
import { IAPI } from "shared/types/api";
import { PathPropertyName } from "shared/types/context";
import { FrameContexts } from "shared/types/frameExec";
import { DBRow, SpaceProperty, SpaceTableSchema } from "shared/types/mdb";
import { TargetLocation } from "shared/types/path";
import { windowFromDocument } from "shared/utils/dom";
import { sanitizeTableName } from "shared/utils/sanitizers";
import { parseMDBStringValue } from "utils/properties";
import { Superstate } from "./superstate";
import { newPathInSpace, saveProperties } from "./utils/spaces";




export class API implements IAPI {
    private superstate: Superstate;
    public constructor(superstate: Superstate) {
        this.superstate = superstate;
    }
    public frame = {
update: (property: string, value: string, path: string, saveState: (state: any) => void) => {
            if (property.startsWith("$contexts")) {
                const {context, prop} = parseContextNode(property)
                if (context && prop)
                this.context.update(context, path, prop, value)
            } else {
                const linkedNode = parseLinkedNode(property)
                if (linkedNode.node && linkedNode.prop)
                {
                    saveState({
                    [linkedNode.node]: {
                        props: {
                        [linkedNode.prop] : value
                        }
                    }
                })
            }
            }
        }
    }
    public properties = {
        color: (property: SpaceProperty, value: string) => {
            if (property?.type?.includes('option')) {
                const fields = parseFieldValue(property.value, property.type);
                const option = (fields.options as SelectOption[])?.find(f => f.value == value);
                if (option?.color.length > 0)
                return option.color
            }
            return 'var(--mk-ui-background-contrast)'
        },
        sticker: (property: SpaceProperty) => stickerForField(property),
        value: ( type: string, value: string) => {
            if (!type) return value
            return parseMDBStringValue(type, value, true)
        }
    }

    public path = 
    {
        label:  (path: string) => {
            return this.superstate.pathsIndex.get(path)?.label;
        },
        open: (path: string, target?: TargetLocation) => {
            
            this.superstate.ui.openPath(path, target)
        },
        create: (name: string, space: string, type: string, content?: Promise<string> | string) => {
            if (content instanceof Promise) {
                return content.then(c => {
                    newPathInSpace(this.superstate, this.superstate.spacesIndex.get(space), type, name, true, c)
                })
            }
            return newPathInSpace(this.superstate, this.superstate.spacesIndex.get(space), type, name, true, content)
        },
        setProperty: (path: string, property: string, value:  Promise<string> | string) => {
            if (value instanceof Promise) {
                value.then(v => {
                    saveProperties(this.superstate, path, {
                        [property]: v
                    })
                })
                return
            }
            saveProperties(this.superstate, path, {
                    [property]: value
                })
        },
        contextMenu: (e: React.MouseEvent, path: string) => {
            showPathContextMenu(this.superstate, path, null, { x: e.clientX, y: e.clientY, width: 0, height: 0 }, windowFromDocument(e.view.document))
        }
    }
    public commands = {
        run : (action: string, parameters?: { [key: string]: any; }, contexts?: FrameContexts) => {
            return this.superstate.cli.runCommand(action,  {instanceProps: {...parameters, $api: this, $contexts: contexts}, props: {}, iterations: 0})
        },
        formula: (formula: string, parameters: { [key: string]: any; }, contexts?: FrameContexts) => {
            return runFormulaWithContext(this.superstate.formulaContext, this.superstate.pathsIndex, this.superstate.spacesMap, formula, contexts.$properties, parameters, contexts?.$contexts?.$space?.path)
        }
    }
    
    public buttonCommand = (action: string, parameters: { [key: string]: any; }, contexts: FrameContexts, saveState: (state: any) => void) => {
        alert('Button actions have been upgraded, please rebind your buttons to use the new API.')
    }
    
    
    public table = {
        select: (path: string, table: string) => {
            return this.superstate.spaceManager.readTable(path, table)?.then(f => f?.rows)
        },
        update: (path: string, table:string, index: number, row: DBRow) => {
            const space = this.superstate.spacesIndex.get(path)
            if (space)
            return updateTableRow(this.superstate.spaceManager, space.space, table, index, row)
        },
        insert: (path: string, schema: string, row: DBRow) => {

            if (schema == defaultContextSchemaID) {
                this.context.insert(path, schema, row[PathPropertyName], row)
                return;
            }
            const space = this.superstate.spacesIndex.get(path)
            if (space)
            return addRowInTable(this.superstate.spaceManager, row, space.space, schema)
        return Promise.resolve()
        },
        
         create: (path: string, table: string, properties: SpaceProperty[]) => {
            const newSchema: SpaceTableSchema = {
                id: sanitizeTableName(table),
                name: table,
                type: "db",
              };
            this.superstate.spaceManager.createTable(
                path,
                newSchema
              );
        },
        open: async (space: string, table: string, index: number, target?: TargetLocation) => {
            const context = await this.superstate.spaceManager.readTable(space, table)
            if (table == defaultContextSchemaID) {
                const path = this.superstate.spaceManager.resolvePath(context?.rows[index]?.[PathPropertyName], space)
                this.superstate.ui.openPath(path, target)
            } else {

            }
        },
        contextMenu: async (e: React.MouseEvent, space: string, table: string, index: number) => {
            const context = await this.superstate.spaceManager.readTable(space, table);
            if (table == defaultContextSchemaID) {
                const path = context?.rows[index]?.[PathPropertyName]
                showPathContextMenu(this.superstate, path, space, { x: e.clientX, y: e.clientY, width: 0, height: 0 }, windowFromDocument(e.view.document))
            } else {
                showRowContextMenu(e, this.superstate, space, table, index)
            }
        }
    }
    public context = {
        select: (path: string, table: string) => {
            return this.superstate.spaceManager.readTable(path, table).then(f => f?.rows)
        },
        update: (path: string, file: string, field: string, value: string) => {

            const space = this.superstate.spacesIndex.get(path)
            if (space)
            updateValueInContext(this.superstate.spaceManager, file, field, value, space.space)
        },
        insert: async (path: string, schema: string, name: string, row: DBRow) => {
            if (schema == defaultContextSchemaID)
            {
                newPathInSpace(this.superstate, this.superstate.spacesIndex.get(path), "md", name, true).then(f =>
                {
                    if (row)
                    saveProperties(this.superstate, f, {
                        ...row,
                        [PathPropertyName]: f
                    })
                })
        } else {
            const table = await this.superstate.spaceManager.readTable(path, schema)
            
            if (table) {
                const prop = table.cols.find(f => f.primary == "true")
                
                const newRow = prop ? {
                    ...row, 
                    [prop.name]: name
                } : row
                this.table.insert(path, schema, newRow)
            }
                
        }
    }
    }

public date = {
    parse: (date: string) => {
        return new Date(date?.replace(/-/g, '\/').replace(/T.+/, ''));
    },
    daysInMonth: (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    },
    format: (date: Date, format?: string) => {
        return formatDate(this.superstate, date, format ?? 'yyyy-MM-dd')
    },
    component: (date: Date, component: string) => {
        if (component == 'year') return date.getFullYear()
        if (component == 'month') return date.getMonth() + 1
        if (component == 'day') return date.getDate()
        if (component == 'dayOfWeek') return date.getDay()
        if (component == "hour") return date.getHours()
        if (component == "minute") return date.getMinutes()
        if (component == "second") return date.getSeconds()
    },
    offset: (date: Date, offset: number, type: string) => {
        const newDate = new Date(date)
        if (type == 'day') newDate.setDate(newDate.getDate() + offset)
        if (type == 'month') newDate.setMonth(newDate.getMonth() + offset)
        if (type == 'year') newDate.setFullYear(newDate.getFullYear() + offset)
        return newDate
    },
    now: () => {
        return new Date();
    },
    range: (start: Date, end: Date, format?: string) => {
        const dates = []
        const current = new Date(start)
        while (current <= end) {
            dates.push(formatDate(this.superstate, current, format ?? 'yyyy-MM-dd'))
            current.setDate(current.getDate() + 1)
        }
        return dates;
    }
}

    

    
}