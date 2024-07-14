import { Superstate } from "makemd-core";
import { parseMultiString, safelyParseJSON } from "utils/parsers";
import { fieldTypeForType } from "../../schemas/mdb";

export const allActions = (superstate: Superstate, path: string) => {
  const stringForType = (type: string) => {
    if (type == "builtin") {
      return "Builtin";
    }
    if (type == "api") {
      return "Spaces";
    }
    return "Action";
  }
  return [...(superstate.actionsIndex.get(path) ?? []).map(g => ({name: g.schema.name, description: 'Action', value: `${path}/#;${g.schema.id}`, section: 'Action'})) ?? [], ...[...superstate.cli.allCommands()].map(g => ({name: g.schema.name, description: stringForType(g.schema.type), value: g.path, section: stringForType(g.schema.type)}))]

}

export const allActionSections = (superstate: Superstate, path: string) => {
const actions = allActions(superstate, path);
return [...new Set(actions.map(f => f.section))];
}

type FilePropValue = {
  value: string;
  type: string;
}

const convertFileProp = ({field, value} : {field: string, value: string}) : FilePropValue => {
  if (value == 'ctime')
  return { value: `parseDate(prop('File')['metadata']['ctime'])`, type: 'date' };
  return { value: ``, type: 'string'};
}

export const parseFieldValue = (
  value: string,
  type: string,
  superstate?: Superstate,
  path?: string,
): Record<string, any> => {
  let valueProp = safelyParseJSON(value);
  if (valueProp) {
    if (type == 'fileprop') {
      if (valueProp.field)
      return convertFileProp(valueProp);
    }
    if (type == 'option' && valueProp.source?.length > 0) {
      if (valueProp.source == '$commands') {
        valueProp.options =  superstate.cli.allCommands()
    } else if (valueProp.source == '$links') {
        valueProp.options = superstate.spaceManager.allPaths().map(f =>({name: f, value: f}))
    } else if (valueProp.source == '$super') {
      valueProp.options = allActions(superstate,path)
    } else if (valueProp.source == '$properties') {
      valueProp.options = (superstate.contextsIndex.get(path)?.contextTable?.cols?.map(f => ({name: f.name, value: f.name}))) ?? []
    
    }
  }
    return [...(fieldTypeForType(type).configKeys ?? []), 'alias', 'default'].reduce((p, c) => ({ ...p, [c]: valueProp[c] }), {});
  }
  if (!type) return {};
  if (!valueProp) {
    if (type == "context") {
      if (value?.length > 0) {
        valueProp = {
          space: value,
        };
      } else {
        valueProp = {};
      }
    } else if (type.startsWith("date")) {
      if (value?.length > 0) {
        valueProp = {
          format: value,
        };
      } else {
        valueProp = {};
      }
    } else if (type.startsWith("fileprop")) {
      if (value?.length > 0) {
        const [field, val] = value.split(".");
        valueProp = convertFileProp({field, value: val})
      } else {
        valueProp = {};
      }
    } else if (type.startsWith('option')) {
      if (value?.length > 0) {
        const options = parseMultiString(value).map(f => ({ name: f, value: f }));
        valueProp = {
          options
        };
      } else {
        valueProp = {};
      }
    }
  }
  
  return valueProp ?? {};
};
