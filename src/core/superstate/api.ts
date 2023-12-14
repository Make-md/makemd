import { updateValueInContext } from "core/utils/contexts/context";
import { formatDate } from "core/utils/date";
import { TargetLocation } from "types/path";
import { Superstate } from "./superstate";

export class API {
    private superstate: Superstate;
    public constructor(superstate: Superstate) {
        this.superstate = superstate;
    }

    public buttonCommand = (action: string, actionValue: string) => {

        if (action == '$commands') {
            this.superstate.commands.runCommand(actionValue)
        }
        if (action == '$links') {
            this.openLink(actionValue, false)
        }
    }
    
    
    public formatDate = (date: Date, format?: string) => {
        return formatDate(this.superstate, date, format ?? 'yyyy-MM-dd')
    }

    public now = () => {
        return new Date();
    }
    public openLink (path: string, target: TargetLocation) {
        this.superstate.ui.openPath(path, target)
    }

    public getLocalFile (path: string) {
        return this.superstate.ui.getUIPath(path)
    }

    public getContext(path: string, table: string) {
        return this.superstate.contextsIndex.get(path)?.tables[table]
    }

    public setContextValue(path: string, file: string, field: string, value: string) {
        const space = this.superstate.spacesIndex.get(path)
        if (space)
        updateValueInContext(this.superstate.spaceManager, file, field, value, space.space)
    }
    
}