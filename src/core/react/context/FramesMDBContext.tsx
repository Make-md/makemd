import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultFrameListViewSchema } from "schemas/mdb";

import { Superstate, i18n } from "makemd-core";
import { defaultPredicate } from "shared/schemas/predicate";
import {
  DBTable,
  SpaceProperty,
  SpaceTable,
  SpaceTableSchema,
} from "shared/types/mdb";
import { FrameSchema, MDBFrame, MDBFrames } from "shared/types/mframe";
import { uniqueNameFromString } from "shared/utils/array";
import {
  frameSchemaToTableSchema,
  mdbSchemaToFrameSchema,
} from "shared/utils/makemd/schema";
import { sanitizeColumnName, sanitizeTableName } from "shared/utils/sanitizers";
import { SpaceContext } from "./SpaceContext";
import { useSpaceManager } from "./SpaceManagerContext";
type FramesMDBContextProps = {
  frameSchemas: FrameSchema[];
  frames: FrameSchema[];
  tableData: MDBFrame | null;
  saveFrame: (newFrame: MDBFrame) => Promise<void>;
  frameSchema: FrameSchema;
  setFrameSchema: (schema: FrameSchema) => void;
  saveSchema: (schema: FrameSchema) => Promise<void>;
  deleteSchema: (schema: FrameSchema) => Promise<void>;
  saveProperty: (column: SpaceProperty, oldColumn?: SpaceProperty) => boolean;
  newProperty: (column: SpaceProperty) => boolean;
  delProperty: (column: SpaceProperty) => void;
  getMDBData: () => Promise<MDBFrames>;
  undoLastAction?: () => void;
  redoAction?: () => void;
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
  saveProperty: () => false,
  newProperty: () => false,
  delProperty: () => null,
  getMDBData: () => null,
  undoLastAction: () => null,
  redoAction: () => null,
});

export const FramesMDBProvider: React.FC<
  React.PropsWithChildren<{
    superstate: Superstate;
    contextSchema?: string;
    schema?: string;
    path?: string;
  }>
> = (props) => {
  const [history, setHistory] = useState<MDBFrame[]>([]);
  const [future, setFuture] = useState<MDBFrame[]>([]);

  const spaceManager = useSpaceManager() || props.superstate.spaceManager;

  // Initialize schema table as null - SpaceManager will load data
  const [schemaTable, setSchemaTable] = useState<DBTable>(null);

  const schemas = useMemo(() => {
    // Compute schemas from schemaTable
    const computedSchemas =
      ((schemaTable?.rows ?? []).map((f) =>
        mdbSchemaToFrameSchema(f as SpaceTableSchema)
      ) as FrameSchema[]) ?? [];

    return computedSchemas;
  }, [schemaTable]);

  const frames = schemas.filter((f: FrameSchema) => f.type == "frame");
  const [frameData, setFrameData] = useState<MDBFrames | null>(null);
  const [frameSchema, setFrameSchema] = useState<FrameSchema>(null);

  const tableData = useMemo(() => {
    return frameData?.[frameSchema?.id];
  }, [frameData, frameSchema]);

  const { spaceInfo, readMode } = useContext(SpaceContext);
  const deleteSchema = async (table: FrameSchema) => {
    if (table.primary) return;
    if (spaceInfo?.readOnly) return; // Skip if in read-only mode

    await spaceManager.deleteFrame(spaceInfo.path, table.id);
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
            f.id == table.id ? frameSchemaToTableSchema(table) : f
          ),
        }
      : {
          ...schemaTable,
          rows: [...schemaTable.rows, frameSchemaToTableSchema(table)],
        };

    if (!spaceInfo.readOnly) {
      await spaceManager.saveFrameSchema(spaceInfo.path, table.id, () =>
        frameSchemaToTableSchema(table)
      );
    }

    if (table.id == frameSchema?.id) {
      setFrameSchema(table);
      setFrameData((f) => ({
        ...f,
        [table.id]: {
          ...f[table.id],
          schema: frameSchemaToTableSchema(table),
        },
      }));
    }
    setSchemaTable(newSchemaTable);
  };

  useEffect(() => {
    // Load data regardless of read-only mode

    if (schemaTable) {
      getMDBData()
        .then((f) => {
          if (f && Object.keys(f).length > 0) {
            setFrameData(f);
            // if (f[frameSchema?.id]) {
            //   setHistory((prev) => [...prev, f[frameSchema?.id] as MDBFrame]);
            // }
          } else {
          }
        })
        .catch((error) => {});
    }
  }, [schemaTable, spaceManager]);
  useEffect(() => {
    if (schemaTable) {
      setFrameSchema((p) => {
        if (props.schema) {
          const preselectSchema = mdbSchemaToFrameSchema(
            schemaTable.rows.find(
              (g) => g.id == props.schema
            ) as SpaceTableSchema
          ) as FrameSchema;
          if (preselectSchema) {
            return preselectSchema;
          } else {
            if (props.schema == defaultFrameListViewSchema.id) {
              return mdbSchemaToFrameSchema(defaultFrameListViewSchema);
            }
            const newSchema = {
              id: uniqueNameFromString(
                sanitizeTableName(props.schema),
                schemaTable.rows.map((g) => g.id)
              ),
              name: props.schema,
              type: "frame",
            };

            return newSchema;
          }
        } else {
          if (p) {
            return mdbSchemaToFrameSchema(
              schemaTable.rows?.find((g) => g.id == p.id) as SpaceTableSchema
            );
          } else {
            if (props.contextSchema) {
              return mdbSchemaToFrameSchema({
                id: uniqueNameFromString(
                  props.contextSchema,
                  schemaTable?.rows.map((f) => f.id) ?? []
                ),
                name: "Table",
                type: "view",
                predicate: JSON.stringify({
                  ...defaultPredicate,
                  view: "table",
                }),
                def: JSON.stringify({
                  db: props.contextSchema,
                  icon: "ui//table",
                }),
              });
            } else {
              return mdbSchemaToFrameSchema(defaultFrameListViewSchema);
            }
          }
        }
        return p;
      });
    }
  }, [schemaTable, props.contextSchema, props.schema]);
  const loadTables = useCallback(async () => {
    // Don't load if no spaceInfo
    if (!spaceInfo) {
      return;
    }

    try {
      const frameSchemas = await spaceManager.framesForSpace(spaceInfo.path);

      if (frameSchemas) {
        setSchemaTable((prev) => {
          const newSchemaTable: DBTable = {
            uniques: [],
            cols: ["id", "name", "type", "def", "predicate", "primary"],
            rows: frameSchemas,
          };
          return newSchemaTable;
        });
      } else {
      }
    } catch (error) {}
  }, [props.schema, spaceInfo, spaceManager]);
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
    // Skip event listeners in read-only mode
    if (spaceInfo?.readOnly) return;

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
  const getMDBData = async (): Promise<MDBFrames> => {
    // Return empty if no spaceInfo
    if (!spaceInfo) {
      return {};
    }

    try {
      const tables = await spaceManager.readAllFrames(spaceInfo.path);
      return tables || {};
    } catch (error) {
      return {};
    }
  };

  useEffect(() => {
    loadTables();
  }, [spaceInfo, props.schema]);

  const saveFrame = async (newTable: MDBFrame, track = true) => {
    if (spaceInfo?.readOnly) return;
    if (spaceInfo?.readOnly) return; // Skip if in read-only mode

    if (track) {
      setHistory((prevHistory) => [...prevHistory, newTable]);
      setFuture([]);
    }
    await spaceManager.saveFrame(spaceInfo.path, newTable).then((f) => {
      setFrameData((p) => ({
        ...p,
        [newTable.schema.id]: newTable,
      }));
    });
  };
  const undoLastAction = () => {
    if (history.length === 0) return;

    // Remove the last element from the history
    const newHistory = history.slice(0, -1);
    const undoneState = history[history.length - 1];
    setHistory(newHistory);
    setFuture((prevFuture) => [undoneState, ...prevFuture]);

    // Restore the frameData to the last state in the new history
    if (newHistory.length > 0) {
      const lastState = newHistory[newHistory.length - 1];
      saveFrame(lastState, false);
    }
  };
  const redoAction = () => {
    if (future.length === 0) return;

    // Remove the last undone state from the future and add it to the history
    const newFuture = future.slice(1);
    const redoneState = future[0];
    setFuture(newFuture);
    setHistory((prevHistory) => [...prevHistory, redoneState]);

    // Restore the frameData to the redone state
    saveFrame(redoneState, false);
  };
  const delProperty = (column: SpaceProperty) => {
    const mdbtable: SpaceTable = tableData;

    const newFields: SpaceProperty[] = mdbtable.cols.filter(
      (f, i) => f.name != column.name
    );
    const newTable = {
      ...mdbtable,
      cols: newFields ?? [],
    };
    saveFrame(newTable as MDBFrame);
  };

  const newProperty = (col: SpaceProperty): boolean => {
    return saveProperty(col);
  };

  const saveProperty = (
    newColumn: SpaceProperty,
    oldColumn?: SpaceProperty
  ): boolean => {
    const column = {
      ...newColumn,
      name: sanitizeColumnName(newColumn.name),
    };
    const mdbtable = tableData;

    if (column.name == "") {
      if (!spaceInfo?.readOnly) {
        props.superstate.ui.notify(i18n.notice.noPropertyName);
      }
      return false;
    }
    if (
      (!oldColumn &&
        mdbtable.cols.find(
          (f) => f.name.toLowerCase() == column.name.toLowerCase()
        )) ||
      (oldColumn &&
        oldColumn.name != column.name &&
        mdbtable.cols.find(
          (f) => f.name.toLowerCase() == column.name.toLowerCase()
        ))
    ) {
      if (!spaceInfo?.readOnly) {
        props.superstate.ui.notify(i18n.notice.duplicatePropertyName);
      }
      return false;
    }
    const oldFieldIndex = oldColumn
      ? mdbtable.cols.findIndex((f) => f.name == oldColumn.name)
      : -1;
    const newFields: SpaceProperty[] =
      oldFieldIndex == -1
        ? [...mdbtable.cols, column]
        : mdbtable.cols.map((f, i) => (i == oldFieldIndex ? column : f));
    const newTable = {
      ...mdbtable,
      cols: newFields ?? [],
    };
    saveFrame(newTable as MDBFrame);
    return true;
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
        saveProperty,
        newProperty,
        delProperty,
        frameSchema,
        setFrameSchema,
        getMDBData,
        undoLastAction,
        redoAction,
      }}
    >
      {props.children}
    </FramesMDBContext.Provider>
  );
};
