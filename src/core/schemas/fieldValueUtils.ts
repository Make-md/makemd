import { SelectOption } from "makemd-core";
import i18n from "shared/i18n";
import { ISuperstate as Superstate } from "shared/types/superstate";
import { parseFieldValue } from "./parseFieldValue";


export const allActions = (superstate: Superstate, path: string) => {
  const stringForType = (type: string) => {
    if (type == "builtin") {
      return "Builtin";
    }
    if (type == "api") {
      return "Spaces";
    }
    return i18n.labels.action;
  };
  return [...(superstate.actionsIndex.get(path) ?? []).map(g => ({ name: g.schema.name, description: i18n.labels.action, value: `${path}/#;${g.schema.id}`, section: i18n.labels.action })) ?? [], ...[...superstate.cli.allCommands()].map(g => ({ name: g.schema.name, description: stringForType(g.schema.type), value: g.path, section: stringForType(g.schema.type) }))];

};

export const allActionSections = (superstate: Superstate, path: string) => {
  const actions = allActions(superstate, path);
  return [...new Set(actions.map(f => f.section))];
};



export const parseSourceOptions = (superstate: Superstate, source: string, context: string, path: string, schemaId: string, sourceProps: Record<string, any>) => {
  const options: SelectOption[] = [];
  if (source == "$commands") {
    return superstate.cli.allCommands().map((f) => {
      return {
        name: f.schema.name,
        value: f.path,
        section: f.schema.type,
      };
    });
  } else if (source == "$links") {
    return superstate.spaceManager
      .allPaths()
      .map((f) => ({ name: f, value: f }));
  } else if (source == "$super") {
    return allActions(superstate, context);
  } else if (source == "$properties") {
    if (sourceProps?.type?.length > 0) {
      options.push(
        ...(superstate.contextsIndex
          .get(path)
          ?.mdb?.[schemaId]?.cols?.filter((f) => {
            if (f.type == sourceProps?.type) {
              if (sourceProps?.type == "object") {
                if (sourceProps?.typeName) {
                  return (
                    parseFieldValue(f.value, f.type)?.typeName ==
                    sourceProps?.typeName
                  );
                }
              }
              return true;
            }
            return false;
          })
          .map((f) => ({ name: f.name, value: f.name })) ?? [])
      );
    } else {
      options.push(
        ...(superstate.contextsIndex
          .get(path)
          ?.mdb?.[schemaId]?.cols?.map((f) => ({
            name: f.name,
            value: f.name,
          })) ?? [])
      );
    }
    options.unshift({ name: i18n.labels.none, value: "" });
  }
  return options;
};
