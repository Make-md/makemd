import { parseFieldValue } from "core/schemas/parseFieldValue";
import { Superstate } from "core/superstate/superstate";
import { PathPropertyName } from "core/types/context";
import { appendPathsMetaData } from "core/utils/contexts/lookup";
import { defaultContextSchemaID } from "schemas/mdb";
import { DBRow, DBRows, SpaceProperty } from "types/mdb";
import { uniq } from "utils/array";
import { serializeMultiString } from "utils/serializers";
import { parseMultiString } from "../../../utils/parsers";





export const linkContextProp = (
  propType: string,
  rows: string,
  contextTableRows: DBRows
) => {
  const contextRows = contextTableRows.filter((f) =>
    parseMultiString(rows).contains(f[PathPropertyName])
  );
  return serializeMultiString(uniq(contextRows.map((f) => f[propType]).filter((f) => f)));
};

export const linkContextRow = (
  superstate: Superstate,
  row: DBRow,
  fields: SpaceProperty[]
) => {
  return {
    ...row,
    ...fields
      .filter((f) => f.type == "fileprop" || f.name == 'tags')
      .reduce((p, c) => {
        if (c.name == 'tags') {
          return { ...p, 'tags': serializeMultiString([...(superstate.tagsMap.get(row[PathPropertyName]) ?? [])]) };
        }
        const { field, value } = parseFieldValue(c.value, c.type);
        const col = fields.find((f) => f.name == field);
        if (!col || !value) {
          return p;
        }
        if (col.type == "file" || col.type == "link") {
          return {
            ...p,
            [c.name]: appendPathsMetaData(superstate, value, row[col.name]),
          };
        }

        if (col.type.includes("context")) {
          const context = col.value;
          const contextCache = superstate.contextsIndex.get(context);
          if (contextCache.tables[defaultContextSchemaID]) {
            return {
              ...p,
              [c.name]: linkContextProp(
                value,
                row[col.name],
                contextCache.tables[defaultContextSchemaID].rows
              ),
            };
          }
        }
        return p;
      }, {}),
  };
};
