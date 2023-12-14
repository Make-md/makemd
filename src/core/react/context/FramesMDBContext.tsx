import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultFrameListViewSchema, defaultFramesTable } from "schemas/mdb";

import { Superstate } from "core/superstate/superstate";
import {
  frameSchemaToMDBSchema,
  mdbSchemaToFrameSchema,
} from "core/utils/frames/nodes";
import { DBTable, SpaceTable, SpaceTableSchema, SpaceTables } from "types/mdb";
import { FrameSchema, MDBFrame } from "types/mframe";
import { uniqueNameFromString } from "utils/array";
import { sanitizeTableName } from "utils/sanitizers";
import { ContextMDBContext } from "./ContextMDBContext";
import { SpaceContext } from "./SpaceContext";
type FramesMDBContextProps = {
  frameSchemas: FrameSchema[];
  frames: FrameSchema[];
  tableData: SpaceTable | null;
  saveFrame: (newFrame: MDBFrame) => Promise<void>;
  frameSchema: FrameSchema;
  setFrameSchema: (schema: FrameSchema) => void;
  saveSchema: (schema: FrameSchema) => Promise<void>;
  deleteSchema: (schema: FrameSchema) => Promise<void>;

  getMDBData: () => Promise<SpaceTables>;
};

export const FramesMDBContext = createContext<FramesMDBContextProps>({
  frameSchemas: [],
  frames: [],
  tableData: null,
  saveFrame: () => null,
  frameSchema: null,
  setFrameSchema: () => null,
  saveSchema: () => null,
  deleteSchema: () => null,

  getMDBData: () => null,
});

export const FramesMDBProvider: React.FC<
  React.PropsWithChildren<{
    superstate: Superstate;
    schema?: string;
    path?: string;
  }>
> = (props) => {
  const [schemaTable, setSchemaTable] = useState<DBTable>(null);
  const schemas = useMemo(
    () =>
      ((schemaTable?.rows ?? []).map((f) =>
        mdbSchemaToFrameSchema(f as SpaceTableSchema)
      ) as FrameSchema[]) ?? [],
    [schemaTable]
  );
  const frames = schemas.filter((f) => f.type == "frame");
  const [frameData, setFrameData] = useState<SpaceTables | null>(null);
  const [frameSchema, setFrameSchema] = useState<FrameSchema>(null);
  const tableData = useMemo(() => {
    return frameData?.[frameSchema?.id];
  }, [frameData, frameSchema]);

  const defaultSchema = defaultFramesTable;

  const { spaceInfo, readMode } = useContext(SpaceContext);
  const { dbSchemas, setDBSchema, dbSchema } = useContext(ContextMDBContext);

  const deleteSchema = async (table: FrameSchema) => {
    if (table.primary) return;

    await props.superstate.spaceManager.deleteFrame(spaceInfo.path, table.id);
    const newSchemaTable = {
      ...schemaTable,
      rows: schemaTable.rows.filter((f) => f.id != table.id),
    };
    setSchemaTable(newSchemaTable);
  };
  const saveSchema = async (table: FrameSchema) => {
    const newSchema = schemaTable.rows.find((f) => f.id == table.id)
      ? true
      : false;

    const newSchemaTable: DBTable = newSchema
      ? {
          ...schemaTable,
          rows: schemaTable.rows.map((f) =>
            f.id == table.id ? frameSchemaToMDBSchema(table) : f
          ),
        }
      : {
          ...schemaTable,
          rows: [...schemaTable.rows, frameSchemaToMDBSchema(table)],
        };

    if (!spaceInfo.readOnly) {
      await props.superstate.spaceManager.saveFrameSchema(
        spaceInfo.path,
        table.id,
        () => frameSchemaToMDBSchema(table)
      );
    }

    if (table.id == frameSchema?.id) {
      setFrameSchema(table);
      setFrameData((f) => ({
        ...f,
        [table.id]: {
          ...f[table.id],
          schema: frameSchemaToMDBSchema(table),
        },
      }));
    }
    setSchemaTable(newSchemaTable);
  };

  useEffect(() => {
    if (schemaTable)
      getMDBData().then((f) => {
        if (f && Object.keys(f).length > 0) {
          setFrameData(f);
        }
      });
  }, [schemaTable]);
  useEffect(() => {
    if (schemaTable) {
      if (props.schema) {
        if (frameSchema?.id != props.schema) {
          const preselectSchema = schemaTable.rows.find(
            (g) => g.id == props.schema
          ) as SpaceTableSchema;
          if (preselectSchema) {
            if (
              preselectSchema.type == "frame" ||
              preselectSchema.type == "listitem"
            ) {
              setFrameSchema(mdbSchemaToFrameSchema(preselectSchema));
              return;
            } else {
              if (dbSchemas) {
                const preselectDBSchema = dbSchemas.find(
                  (g) => g.id == preselectSchema.def
                ) as SpaceTableSchema;
                if (preselectDBSchema) {
                  setFrameSchema(mdbSchemaToFrameSchema(preselectSchema));
                  if (preselectDBSchema.id != dbSchema.id) {
                    setDBSchema(preselectDBSchema);
                  }
                  return;
                }
              }
            }
          } else {
            if (props.schema == defaultFrameListViewSchema.id) {
              setFrameSchema(defaultFrameListViewSchema);
              return;
            }
            const newSchema = {
              id: uniqueNameFromString(
                sanitizeTableName(props.schema),
                schemaTable.rows.map((g) => g.id)
              ),
              name: props.schema,
              type: "frame",
            };

            setFrameSchema(newSchema);
          }
        }
      } else {
        if (!frameSchema) {
          setFrameSchema(
            mdbSchemaToFrameSchema(
              schemaTable.rows?.find(
                (g) => g.type == "frame"
              ) as SpaceTableSchema
            )
          );
        } else {
          setFrameSchema(
            mdbSchemaToFrameSchema(
              schemaTable.rows?.find(
                (g) => g.id == frameSchema.id
              ) as SpaceTableSchema
            )
          );
        }
      }
    }
  }, [schemaTable]);
  const loadTables = useCallback(async () => {
    if (!spaceInfo) return;
    props.superstate.spaceManager.framesForSpace(spaceInfo.path).then((f) => {
      if (f)
        setSchemaTable((prev) => ({
          ...defaultSchema,
          rows: f,
        }));
    });
  }, [defaultSchema, props.schema, spaceInfo]);

  const refreshSpace = useCallback(
    async (payload: { path: string }) => {
      if (payload.path == spaceInfo.path) {
        loadTables();
        return;
      }
    },
    [spaceInfo, loadTables]
  );

  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "frameStateUpdated",
      refreshSpace
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "frameStateUpdated",
        refreshSpace
      );
    };
  }, [refreshSpace]);
  const getMDBData = async () => {
    return await props.superstate.spaceManager.readAllFrames(spaceInfo.path);
    // return DefaultMDBTables;
  };

  useEffect(() => {
    loadTables();
  }, [spaceInfo, props.schema]);

  const saveFrame = async (newTable: MDBFrame) => {
    if (spaceInfo.readOnly) return;
    await props.superstate.spaceManager
      .saveFrame(spaceInfo.path, newTable)
      .then((f) => {
        setFrameData((p) => ({
          ...p,
          [newTable.schema.id]: newTable,
        }));
      });
  };

  return (
    <FramesMDBContext.Provider
      value={{
        frames,
        tableData,
        saveFrame,
        frameSchemas: schemas,
        saveSchema,
        deleteSchema,

        frameSchema,
        setFrameSchema,
        getMDBData,
      }}
    >
      {props.children}
    </FramesMDBContext.Provider>
  );
};
