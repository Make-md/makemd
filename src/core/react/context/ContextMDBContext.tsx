import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  defaultContextSchemaID,
  defaultContextTable,
  defaultTableFields,
} from "schemas/mdb";

import { DBTable, SpaceTable, SpaceTableSchema, SpaceTables } from "types/mdb";
import { uniqueNameFromString } from "utils/array";

import { Superstate } from "core/superstate/superstate";
import { PathPropertyName } from "core/types/context";
import { sanitizeTableName } from "utils/sanitizers";
import { SpaceContext } from "./SpaceContext";
type ContextMDBContextProps = {
  dbSchemas: SpaceTableSchema[];
  tableData: SpaceTable | null;
  contextTable: SpaceTables;
  setContextTable: React.Dispatch<React.SetStateAction<SpaceTables>>;
  saveDB: (newTable: SpaceTable) => Promise<void>;
  saveContextDB: (newTable: SpaceTable, context: string) => Promise<void>;
  dbSchema: SpaceTableSchema;
  setDBSchema: (schema: SpaceTableSchema) => void;
  saveSchema: (schema: SpaceTableSchema) => Promise<void>;
  deleteSchema: (schema: SpaceTableSchema) => Promise<void>;
};

export const ContextMDBContext = createContext<ContextMDBContextProps>({
  dbSchemas: [],
  tableData: null,
  contextTable: {},
  setContextTable: () => null,
  saveDB: () => null,
  saveContextDB: () => null,
  dbSchema: null,
  setDBSchema: () => null,
  saveSchema: () => null,
  deleteSchema: () => null,
});

export const ContextMDBProvider: React.FC<
  React.PropsWithChildren<{
    superstate: Superstate;
    schema?: string;
    path?: string;
  }>
> = (props) => {
  const [schemaTable, setSchemaTable] = useState<DBTable>(null);
  const schemas = (schemaTable?.rows as SpaceTableSchema[]) ?? [];
  const [tableData, setTableData] = useState<SpaceTable | null>(null);
  const [dbSchema, setDBSchema] = useState<SpaceTableSchema>(null);
  const [contextTable, setContextTable] = useState<SpaceTables>({});

  const defaultSchema = defaultContextTable;
  const {
    spaceInfo,
    readMode,
    spaceState: spaceCache,
  } = useContext(SpaceContext);
  const contexts = spaceCache?.contexts ?? [];
  const deleteSchema = async (table: SpaceTableSchema) => {
    if (table.primary) return;

    await props.superstate.spaceManager.deleteTable(spaceInfo.path, table.id);
    const newSchemaTable = {
      ...schemaTable,
      rows: schemaTable.rows.filter((f) => f.id != table.id),
    };
    setSchemaTable(newSchemaTable);
  };
  const saveSchema = async (table: SpaceTableSchema) => {
    if (spaceInfo.readOnly) return;
    await props.superstate.spaceManager.saveTableSchema(
      spaceInfo.path,
      table.id,
      () => table
    );
    const newSchema = schemaTable.rows.some((f) => f.id == table.id);
    const newSchemaTable: DBTable = newSchema
      ? {
          ...schemaTable,
          rows: schemaTable.rows.map((f) => (f.id == table.id ? table : f)),
        }
      : {
          ...schemaTable,
          rows: [...schemaTable.rows, table],
        };

    if (table.id == dbSchema?.id) {
      setDBSchema(table);
      setTableData((f) => ({
        ...f,
        schema: table,
      }));
    }
    setSchemaTable(newSchemaTable);
  };

  useEffect(() => {
    if (schemaTable) {
      if (props.schema) {
        const preselectSchema = schemaTable.rows.find(
          (g) => g.id == props.schema
        ) as SpaceTableSchema;
        if (preselectSchema) {
          if (preselectSchema.type == "db") {
            setDBSchema(preselectSchema);
            return;
          } else {
            const preselectDBSchema = schemaTable.rows.find(
              (g) => g.id == preselectSchema.def
            ) as SpaceTableSchema;
            if (preselectDBSchema) {
              setDBSchema(preselectDBSchema);
              return;
            }
          }
        } else {
          const newSchema: SpaceTableSchema = {
            id: uniqueNameFromString(
              sanitizeTableName(props.schema),
              schemaTable.rows.map((g) => g.id)
            ),
            name: props.schema,
            type: "db",
          };
          setDBSchema(newSchema);
          saveSchema(newSchema).then(() => {
            saveDB({
              schema: newSchema,
              cols: defaultTableFields.map((g) => ({
                ...g,
                schemaId: newSchema.id,
              })),
              rows: [],
            });
          });
        }
      } else {
        if (!dbSchema) {
          setDBSchema(
            schemaTable.rows?.find(
              (g) => g.id == defaultContextSchemaID
            ) as SpaceTableSchema
          );
        } else {
          setDBSchema(
            schemaTable.rows?.find(
              (g) => g.id == dbSchema.id
            ) as SpaceTableSchema
          );
        }
      }
    }
  }, [schemaTable]);

  const loadTables = async () => {
    if (!spaceInfo) return;
    const schemas = await props.superstate.spaceManager.tablesForSpace(
      spaceInfo.path
    );
    if (schemas)
      setSchemaTable(() => ({
        ...defaultSchema,
        rows: schemas,
      }));
  };

  const loadContextFields = useCallback(async (tag: string) => {
    props.superstate.spaceManager
      .contextForSpace(props.superstate.spaceManager.spaceInfoForPath(tag).path)
      .then((f) => {
        setContextTable((t) => ({
          ...t,
          [tag]: f,
        }));
      });
  }, []);

  const retrieveCachedTable = () => {
    props.superstate.spaceManager
      .readTable(spaceInfo.path, dbSchema.id)
      .then((f) => {
        if (f) {
          if (dbSchema.primary) {
            for (const c of contexts) {
              loadTagContext(c);
            }
          }
          setTableData(f);
        }
      });
  };

  useEffect(() => {
    const refreshMDB = (payload: { path: string }) => {
      if (dbSchema?.primary != "true") {
        return;
      }

      if (payload.path == spaceInfo.path) {
        if (dbSchema) {
          loadTables();
        }
      } else {
        const tag = Object.keys(contextTable).find(
          (t) =>
            props.superstate.spaceManager.spaceInfoForPath(t).path ==
            payload.path
        );
        if (tag) loadContextFields(tag);
      }
    };
    const refreshPath = (payload: { path: string }) => {
      if (payload.path == props.path && dbSchema) {
        retrieveCachedTable();
      } else if (
        dbSchema?.primary == "true" &&
        tableData?.rows.some((f) => f[PathPropertyName] == payload.path)
      ) {
        retrieveCachedTable();
      }
    };
    props.superstate.eventsDispatcher.addListener(
      "contextStateUpdated",
      refreshMDB
    );
    props.superstate.eventsDispatcher.addListener(
      "spaceStateUpdated",
      refreshMDB
    );
    props.superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      refreshPath
    );

    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "contextStateUpdated",
        refreshMDB
      );
      props.superstate.eventsDispatcher.removeListener(
        "spaceStateUpdated",
        refreshMDB
      );
      props.superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        refreshPath
      );
    };
  }, [
    contextTable,
    dbSchema,
    props.path,
    retrieveCachedTable,
    spaceInfo,
    tableData,
  ]);

  useEffect(() => {
    loadTables();
  }, [spaceInfo]);
  const saveDB = async (newTable: SpaceTable) => {
    if (spaceInfo.readOnly) return;
    await props.superstate.spaceManager
      .saveTable(spaceInfo.path, newTable, true)
      .then((f) => {
        setTableData(newTable);
      });
  };

  useEffect(() => {
    if (!schemaTable || !dbSchema) return;

    retrieveCachedTable();
  }, [dbSchema]);

  useEffect(() => {
    if (tableData) getContextTags(tableData);
  }, [tableData]);

  const getContextTags = async (_tableData: SpaceTable) => {
    //load contextfields
    const contextFields = _tableData.cols
      .filter((f) => f.type.contains("context"))
      .map((f) => f.value)
      .filter((f) => !contexts.some((g) => g == f));
    for (const c of contextFields) {
      loadContextFields(c);
    }
  };

  const loadTagContext = async (tag: string) => {
    props.superstate.spaceManager
      .contextForSpace(props.superstate.spaceManager.spaceInfoForPath(tag).path)
      .then((f) => {
        if (f) {
          const contextFields = f.cols
            .filter((g) => g.type.contains("context"))
            .map((g) => g.value)
            .filter((g) => !contexts.some((h) => h == g));
          for (const c of contextFields) {
            loadContextFields(c);
          }
          setContextTable((t) => ({
            ...t,
            [tag]: f,
          }));
        }
      });
  };

  const saveContextDB = async (newTable: SpaceTable, tag: string) => {
    const context = props.superstate.spaceManager.spaceInfoForPath(tag);
    await props.superstate.spaceManager
      .saveTable(context.path, newTable, true)
      .then((f) => {
        setContextTable((t) => ({
          ...t,
          [tag]: newTable,
        }));
      });
  };

  return (
    <ContextMDBContext.Provider
      value={{
        tableData,
        contextTable,
        setContextTable,
        saveDB,
        saveContextDB,
        dbSchemas: schemas,
        saveSchema,
        deleteSchema,
        dbSchema,
        setDBSchema,
      }}
    >
      {props.children}
    </ContextMDBContext.Provider>
  );
};
