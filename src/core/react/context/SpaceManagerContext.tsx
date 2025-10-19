import { API, APISpaceManager } from "core/superstate/api";
import {
  linkContextRow,
  propertyDependencies,
} from "core/utils/contexts/linkContextRow";
import { formulas } from "core/utils/formula/formulas";
import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import * as math from "mathjs";
import { all } from "mathjs";
import React, { createContext, useCallback, useContext, useMemo } from "react";
import { IAPI } from "shared/types/api";
import { PathCache } from "shared/types/caches";
import { IndexMap } from "shared/types/indexMap";
import {
  SpaceProperty,
  SpaceTable,
  SpaceTables,
  SpaceTableSchema,
} from "shared/types/mdb";
import { MDBFrame, MDBFrames } from "shared/types/mframe";
import { URI } from "shared/types/path";
import { PathState } from "shared/types/PathState";
import { MakeMDSettings } from "shared/types/settings";
import { SpaceDefinition } from "shared/types/spaceDef";
import { SpaceInfo } from "shared/types/spaceInfo";
import { SpaceManagerInterface } from "shared/types/spaceManager";
import { ContextState } from "shared/types/superstate";
import { parseURI } from "shared/utils/uri";
import { useMKitPreviewContext } from "./MKitContext";

/**
 * Enhanced SpaceManager interface that handles both regular and MKit operations
 */
interface SpaceManagerContextType extends APISpaceManager {
  // Core data operations (MKit-aware)
  readTable(path: string, schema: string): Promise<SpaceTable | null>;
  saveTable(path: string, table: SpaceTable, force?: boolean): Promise<boolean>;
  readFrame(path: string, schema: string): Promise<MDBFrame | null>;
  saveFrame(path: string, frame: MDBFrame): Promise<void>;

  // Schema operations (MKit-aware)
  tablesForSpace(path: string): Promise<SpaceTableSchema[]>;
  framesForSpace(path: string): Promise<SpaceTableSchema[]>;

  // Path operations (MKit-aware)
  resolvePath(path: string, source?: string): string;
  uriByString(uri: string, source?: string): URI;
  pathExists(path: string): Promise<boolean>;

  // Space operations
  createSpace(
    name: string,
    parentPath: string,
    definition: SpaceDefinition
  ): void;
  deleteSpace(path: string): void;
  spaceInfoForPath(path: string): SpaceInfo;
  contextForSpace(path: string): Promise<SpaceTable>;

  // Property operations
  addSpaceProperty(path: string, property: SpaceProperty): Promise<boolean>;
  saveProperties(
    path: string,
    properties: Record<string, any>
  ): Promise<boolean>;
  deleteProperty(path: string, property: string): void;
  renameProperty(path: string, property: string, newProperty: string): void;

  // File operations
  createItemAtPath(
    parent: string,
    type: string,
    name: string,
    content?: any
  ): Promise<string>;
  deletePath(path: string): void;
  readPath(path: string): Promise<string>;
  writeToPath(path: string, content: any, binary?: boolean): Promise<void>;
  parentPathForPath(path: string): string;

  // Additional space operations
  allSpaces(): SpaceInfo[];
  childrenForSpace(path: string): string[];
  spaceInitiated(path: string): Promise<boolean>;
  contextInitiated(path: string): Promise<boolean>;
  readAllTables(path: string): Promise<SpaceTables>;
  readAllFrames(path: string): Promise<MDBFrames>;
  saveSpace(
    path: string,
    definition: (def: SpaceDefinition) => SpaceDefinition,
    properties?: Record<string, any>
  ): void;
  renameSpace(path: string, newPath: string): Promise<string>;
  spaceDefForSpace(path: string): Promise<SpaceDefinition>;

  // Additional path operations
  allPaths(type?: string[]): string[];
  renamePath(oldPath: string, newPath: string): Promise<string>;
  copyPath(
    source: string,
    destination: string,
    newName?: string
  ): Promise<string>;
  getPathInfo(path: string): Promise<Record<string, any>>;
  readPathCache(path: string): Promise<PathCache>;
  getPathState(path: string): PathState | null;
  getPathsIndexMap: () => Map<string, PathState>;
  childrenForPath(path: string, type?: string): Promise<string[]>;

  // Frame schema operations
  saveFrameSchema(
    path: string,
    schemaId: string,
    saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema
  ): Promise<void>;
  deleteFrame(path: string, name: string): Promise<void>;

  // MKit-specific utilities
  isPreviewMode: boolean;
  convertMKitPath(path: string): string;
  isMKitPath(path: string): boolean;

  // Context access map
  getContextsIndexMap: () => Map<string, ContextState>;

  // API reference
  api: IAPI;

  // Fallback to original spaceManager for uncovered methods
  spaceManager: SpaceManagerInterface;
}

const SpaceManagerContext = createContext<SpaceManagerContextType | null>(null);

interface SpaceManagerProviderProps {
  superstate: Superstate;
  children: React.ReactNode;
}

interface MKitSpaceManagerProviderProps {
  mkitContext: any;
  superstate: Superstate;
  children: React.ReactNode;
}

export const SpaceManagerProvider: React.FC<SpaceManagerProviderProps> = ({
  superstate,
  children,
}) => {
  const mkitContext = useMKitPreviewContext();

  // Create formula context for regular provider
  const formulaContext = useMemo(() => {
    // Use superstate's formula context if available, otherwise create one
    if (superstate?.formulaContext) {
      return superstate.formulaContext;
    }
    const config: math.ConfigOptions = {
      matrix: "Array",
    };
    const runContext = math.create(all, config);
    runContext.import(formulas, { override: true });
    return runContext;
  }, [superstate]);

  // MKit path utilities
  const isMKitPath = useCallback((path: string): boolean => {
    return path?.startsWith("mkit://preview/") || false;
  }, []);

  const convertMKitPath = useCallback(
    (path: string): string => {
      if (!isMKitPath(path)) {
        return path;
      }

      const pathAfterPrefix = path.replace("mkit://preview/", "");
      const kitId = mkitContext?.rootPath?.replace("mkit://preview/", "") || "";

      if (pathAfterPrefix === kitId || pathAfterPrefix === "") {
        return ".";
      } else if (pathAfterPrefix.startsWith(kitId + "/")) {
        let relativePath = pathAfterPrefix.slice((kitId + "/").length);
        // Remove trailing slashes
        relativePath = relativePath.replace(/\/+$/, "");
        return relativePath || ".";
      }

      // Remove trailing slashes from the result
      let result = pathAfterPrefix.replace(/\/+$/, "");
      return result || ".";
    },
    [mkitContext?.rootPath, isMKitPath]
  );

  // Define getContextsIndexMap before readTable to avoid reference errors
  const getContextsIndexMap = useCallback((): Map<string, ContextState> => {
    if (mkitContext?.isPreviewMode && mkitContext?.getContextsIndexMap) {
      // In MKit preview mode, use MKit context's map
      return mkitContext.getContextsIndexMap();
    } else if (superstate?.contextsIndex) {
      // In regular mode, return superstate's contexts index
      return superstate.contextsIndex;
    }
    // Fallback to empty map
    return new Map<string, ContextState>();
  }, [mkitContext, superstate]);

  // Define getPathsIndexMap before readTable to avoid reference errors
  const getPathsIndexMap = useCallback((): Map<string, PathState> => {
    if (mkitContext?.isPreviewMode && mkitContext?.getPathsIndexMap) {
      // In MKit preview mode, use MKit context's map
      return mkitContext.getPathsIndexMap();
    } else if (superstate?.pathsIndex) {
      // In regular mode, return superstate's paths index
      return superstate.pathsIndex;
    }
    // Fallback to empty map
    return new Map<string, PathState>();
  }, [mkitContext, superstate]);

  // Core data operations
  const readTable = useCallback(
    async (path: string, schema: string): Promise<SpaceTable | null> => {
      if (mkitContext?.isPreviewMode && isMKitPath(path)) {
        // Handle MKit preview mode
        const lookupPath = convertMKitPath(path);

        const mkitSpaceData =
          mkitContext.getSpaceByFullPath(lookupPath) ||
          mkitContext.getSpaceByRelativePath(lookupPath);

        if (mkitSpaceData?.contextTables?.[schema]) {
          const table = mkitSpaceData.contextTables[schema];

          // Apply linkContextRow for MKit data
          if (table.rows && table.cols && table.cols.length > 0) {
            // Use getPathsIndexMap and getContextsIndexMap from MKit context
            const pathsMap = mkitContext?.getPathsIndexMap
              ? mkitContext.getPathsIndexMap()
              : new Map<string, PathState>();
            const contextsMap = mkitContext?.getContextsIndexMap
              ? mkitContext.getContextsIndexMap()
              : new Map<string, ContextState>();
            const spacesMap = new IndexMap();

            // Calculate dependencies once
            const dependencies = propertyDependencies(table.cols);

            // Use superstate settings if available
            const settings = superstate?.settings || ({} as MakeMDSettings);

            // Apply linkContextRow to each row
            const processedRows = table.rows.map((row: any) =>
              linkContextRow(
                formulaContext,
                pathsMap,
                contextsMap,
                spacesMap,
                row,
                table.cols,
                mkitSpaceData.pathState,
                settings,
                dependencies
              )
            );

            return {
              ...table,
              rows: processedRows,
            };
          }

          return table;
        }
      }

      // Fallback to regular spaceManager
      if (superstate?.spaceManager) {
        const table = await superstate.spaceManager.readTable(path, schema);

        // Apply linkContextRow for regular data using getPathsIndexMap
        if (table && table.rows && table.cols && table.cols.length > 0) {
          // Use getPathsIndexMap and getContextsIndexMap for consistent access
          const pathsMap = getPathsIndexMap();
          const contextsMap = getContextsIndexMap();
          const pathState = pathsMap.get(path);

          if (pathState) {
            const dependencies = propertyDependencies(table.cols);
            const processedRows = table.rows.map((row: any) =>
              linkContextRow(
                formulaContext,
                pathsMap,
                contextsMap,
                superstate.spacesMap || new IndexMap(),
                row,
                table.cols,
                pathState,
                superstate.settings || ({} as MakeMDSettings),
                dependencies
              )
            );

            return {
              ...table,
              rows: processedRows,
            };
          }
        }

        return table;
      }

      return null;
    },
    [
      mkitContext,
      isMKitPath,
      convertMKitPath,
      superstate,
      formulaContext,
      getPathsIndexMap,
      getContextsIndexMap,
    ]
  );

  const saveTable = useCallback(
    async (
      path: string,
      table: SpaceTable,
      force?: boolean
    ): Promise<boolean> => {
      if (mkitContext?.isPreviewMode && isMKitPath(path)) {
        return false;
      }

      // Regular mode
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.saveTable(path, table, force);
      }

      return false;
    },
    [mkitContext, isMKitPath, superstate]
  );

  const readFrame = useCallback(
    async (path: string, schema: string): Promise<MDBFrame | null> => {
      if (mkitContext?.isPreviewMode && isMKitPath(path)) {
        // Handle MKit preview mode
        const lookupPath = convertMKitPath(path);

        const mkitSpaceData =
          mkitContext.getSpaceByFullPath(lookupPath) ||
          mkitContext.getSpaceByRelativePath(lookupPath);

        if (mkitSpaceData?.frameData?.[schema]) {
          return mkitSpaceData.frameData[schema];
        } else {
        }
      }

      // Fallback to regular spaceManager
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.readFrame(path, schema);
      }

      return null;
    },
    [mkitContext, isMKitPath, convertMKitPath, superstate]
  );

  const saveFrame = useCallback(
    async (path: string, frame: MDBFrame): Promise<void> => {
      if (mkitContext?.isPreviewMode && isMKitPath(path)) {
        return;
      }

      // Regular mode
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.saveFrame(path, frame);
      }
    },
    [mkitContext, isMKitPath, superstate]
  );

  // Schema operations
  const tablesForSpace = useCallback(
    async (path: string): Promise<SpaceTableSchema[]> => {
      if (mkitContext?.isPreviewMode && isMKitPath(path)) {
        // Handle MKit preview mode
        const lookupPath = convertMKitPath(path);

        const mkitSpaceData =
          mkitContext.getSpaceByFullPath(lookupPath) ||
          mkitContext.getSpaceByRelativePath(lookupPath);

        if (mkitSpaceData?.contextSchemas) {
          return mkitSpaceData.contextSchemas;
        } else {
        }
      }

      // Fallback to regular spaceManager
      if (superstate?.spaceManager) {
        const schemas = await superstate.spaceManager.tablesForSpace(path);
        return schemas || [];
      }

      return [];
    },
    [mkitContext, isMKitPath, convertMKitPath, superstate]
  );

  const framesForSpace = useCallback(
    async (path: string): Promise<SpaceTableSchema[]> => {
      if (mkitContext?.isPreviewMode && isMKitPath(path)) {
        // Handle MKit preview mode
        const lookupPath = convertMKitPath(path);

        const mkitSpaceData =
          mkitContext.getSpaceByFullPath(lookupPath) ||
          mkitContext.getSpaceByRelativePath(lookupPath);

        if (mkitSpaceData?.frameSchemas) {
          return mkitSpaceData.frameSchemas.map(
            (fs) => fs as any as SpaceTableSchema
          );
        } else {
        }
      }

      // Fallback to regular spaceManager
      if (superstate?.spaceManager) {
        const schemas = await superstate.spaceManager.framesForSpace(path);
        return schemas || [];
      }

      return [];
    },
    [mkitContext, isMKitPath, convertMKitPath, superstate]
  );

  // Path operations
  const resolvePath = useCallback(
    (path: string, source?: string): string => {
      if (mkitContext?.isPreviewMode) {
        // Let MKit context handle path resolution for preview mode
        return mkitContext.resolvePath(path, source);
      }

      // Fallback to regular spaceManager
      if (superstate?.spaceManager) {
        return superstate.spaceManager.resolvePath(path, source);
      }

      return path;
    },
    [mkitContext, superstate]
  );

  const uriByString = useCallback(
    (uri: string, source?: string): URI => {
      // Always use regular spaceManager for URI parsing
      if (superstate?.spaceManager) {
        return superstate.spaceManager.uriByString(uri, source);
      }

      // Fallback URI structure
      return {
        scheme: "",
        authority: "",
        path: uri,
        basePath: uri,
        fullPath: uri,
        ref: null,
        trailSlash: false,
      };
    },
    [superstate]
  );

  const pathExists = useCallback(
    async (path: string): Promise<boolean> => {
      if (mkitContext?.isPreviewMode && isMKitPath(path)) {
        // For MKit paths, check if space data exists
        const lookupPath = convertMKitPath(path);
        const mkitSpaceData =
          mkitContext.getSpaceByFullPath(lookupPath) ||
          mkitContext.getSpaceByRelativePath(lookupPath);
        return !!mkitSpaceData;
      }

      // Fallback to regular spaceManager
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.pathExists(path);
      }

      return false;
    },
    [mkitContext, isMKitPath, convertMKitPath, superstate]
  );

  // Space operations (always use regular spaceManager)
  const createSpace = useCallback(
    (name: string, parentPath: string, definition: SpaceDefinition): void => {
      if (superstate?.spaceManager) {
        superstate.spaceManager.createSpace(name, parentPath, definition);
      }
    },
    [superstate]
  );

  const deleteSpace = useCallback(
    (path: string): void => {
      if (superstate?.spaceManager) {
        superstate.spaceManager.deleteSpace(path);
      }
    },
    [superstate]
  );

  const spaceInfoForPath = useCallback(
    (path: string): SpaceInfo => {
      if (superstate?.spaceManager) {
        return superstate.spaceManager.spaceInfoForPath(path);
      }

      return null;
    },
    [superstate]
  );

  const contextForSpace = useCallback(
    async (path: string): Promise<SpaceTable> => {
      if (mkitContext?.isPreviewMode && isMKitPath(path)) {
        // Handle MKit preview mode - return default context table
        const lookupPath = convertMKitPath(path);

        const mkitSpaceData =
          mkitContext.getSpaceByFullPath(lookupPath) ||
          mkitContext.getSpaceByRelativePath(lookupPath);

        if (mkitSpaceData?.contextTables) {
          // Return the first context table or create a default one
          const tables = Object.values(mkitSpaceData.contextTables);
          if (tables.length > 0) {
            return tables[0];
          }
        }

        // Return empty context table for MKit
        return {
          schema: null,
          cols: [],
          rows: [],
        };
      }

      // Fallback to regular spaceManager
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.contextForSpace(path);
      }

      return {
        schema: null,
        cols: [],
        rows: [],
      };
    },
    [mkitContext, isMKitPath, convertMKitPath, superstate]
  );

  // Property operations (always use regular spaceManager)
  const addSpaceProperty = useCallback(
    async (path: string, property: SpaceProperty): Promise<boolean> => {
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.addSpaceProperty(path, property);
      }

      return false;
    },
    [superstate]
  );

  const saveProperties = useCallback(
    async (path: string, properties: Record<string, any>): Promise<boolean> => {
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.saveProperties(path, properties);
      }

      return false;
    },
    [superstate]
  );

  const deleteProperty = useCallback(
    (path: string, property: string): void => {
      if (superstate?.spaceManager) {
        superstate.spaceManager.deleteProperty(path, property);
      }
    },
    [superstate]
  );

  const renameProperty = useCallback(
    (path: string, property: string, newProperty: string): void => {
      if (superstate?.spaceManager) {
        superstate.spaceManager.renameProperty(path, property, newProperty);
      }
    },
    [superstate]
  );

  // Table operations
  const createTable = useCallback(
    (path: string, schema: SpaceTableSchema): void => {
      if (superstate?.spaceManager) {
        superstate.spaceManager.createTable(path, schema);
      }
    },
    [superstate]
  );

  // File operations (always use regular spaceManager)
  const createItemAtPath = useCallback(
    async (
      parent: string,
      type: string,
      name: string,
      content?: any
    ): Promise<string> => {
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.createItemAtPath(
          parent,
          type,
          name,
          content
        );
      }

      return "";
    },
    [superstate]
  );

  const deletePath = useCallback(
    (path: string): void => {
      if (superstate?.spaceManager) {
        superstate.spaceManager.deletePath(path);
      }
    },
    [superstate]
  );

  const readPath = useCallback(
    async (path: string): Promise<string> => {
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.readPath(path);
      }

      return "";
    },
    [superstate]
  );

  const writeToPath = useCallback(
    async (path: string, content: any, binary?: boolean): Promise<void> => {
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.writeToPath(path, content, binary);
      }
    },
    [superstate]
  );

  const parentPathForPath = useCallback(
    (path: string): string => {
      if (superstate?.spaceManager) {
        return superstate.spaceManager.parentPathForPath(path);
      }

      return "";
    },
    [superstate]
  );

  // Additional critical methods
  const allSpaces = useCallback((): SpaceInfo[] => {
    if (superstate?.spaceManager) {
      return superstate.spaceManager.allSpaces();
    }
    return [];
  }, [superstate]);

  const childrenForSpace = useCallback(
    (path: string): string[] => {
      if (superstate?.spaceManager) {
        return superstate.spaceManager.childrenForSpace(path);
      }
      return [];
    },
    [superstate]
  );

  const spaceInitiated = useCallback(
    async (path: string): Promise<boolean> => {
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.spaceInitiated(path);
      }
      return false;
    },
    [superstate]
  );

  const contextInitiated = useCallback(
    async (path: string): Promise<boolean> => {
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.contextInitiated(path);
      }
      return false;
    },
    [superstate]
  );

  const readAllTables = useCallback(
    async (path: string): Promise<SpaceTables> => {
      if (mkitContext?.isPreviewMode && isMKitPath(path)) {
        const convertedPath = convertMKitPath(path);
        const spaceData =
          mkitContext.getSpaceByFullPath(convertedPath) ||
          mkitContext.getSpaceByRelativePath(convertedPath);

        if (spaceData?.contextTables) {
          return spaceData.contextTables;
        }
      }

      if (superstate?.spaceManager) {
        return await superstate.spaceManager.readAllTables(path);
      }
      return {};
    },
    [superstate, mkitContext, isMKitPath, convertMKitPath]
  );

  const readAllFrames = useCallback(
    async (path: string): Promise<MDBFrames> => {
      if (mkitContext?.isPreviewMode && isMKitPath(path)) {
        const convertedPath = convertMKitPath(path);
        const spaceData =
          mkitContext.getSpaceByFullPath(convertedPath) ||
          mkitContext.getSpaceByRelativePath(convertedPath);

        if (spaceData?.frameData) {
          return spaceData.frameData;
        }
      }

      if (superstate?.spaceManager) {
        return await superstate.spaceManager.readAllFrames(path);
      }
      return {};
    },
    [superstate, mkitContext, isMKitPath, convertMKitPath]
  );

  const saveSpace = useCallback(
    (
      path: string,
      definition: (def: SpaceDefinition) => SpaceDefinition,
      properties?: Record<string, any>
    ): void => {
      if (superstate?.spaceManager) {
        superstate.spaceManager.saveSpace(path, definition, properties);
      }
    },
    [superstate]
  );

  const renameSpace = useCallback(
    async (path: string, newPath: string): Promise<string> => {
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.renameSpace(path, newPath);
      }
      return "";
    },
    [superstate]
  );

  const spaceDefForSpace = useCallback(
    async (path: string): Promise<SpaceDefinition> => {
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.spaceDefForSpace(path);
      }
      return null;
    },
    [superstate]
  );

  const allPaths = useCallback(
    (type?: string[]): string[] => {
      if (superstate?.spaceManager) {
        return superstate.spaceManager.allPaths(type);
      }
      return [];
    },
    [superstate]
  );

  const renamePath = useCallback(
    async (oldPath: string, newPath: string): Promise<string> => {
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.renamePath(oldPath, newPath);
      }
      return "";
    },
    [superstate]
  );

  const copyPath = useCallback(
    async (
      source: string,
      destination: string,
      newName?: string
    ): Promise<string> => {
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.copyPath(
          source,
          destination,
          newName
        );
      }
      return "";
    },
    [superstate]
  );

  const getPathInfo = useCallback(
    async (path: string): Promise<Record<string, any>> => {
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.getPathInfo(path);
      }
      return {};
    },
    [superstate]
  );

  const readPathCache = useCallback(
    async (path: string): Promise<PathCache> => {
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.readPathCache(path);
      }
      return null;
    },
    [superstate]
  );

  const getPathState = useCallback(
    (path: string): PathState | null => {
      if (mkitContext?.isPreviewMode && mkitContext?.getPathState) {
        // In MKit preview mode, use MKit context's getPathState
        if (isMKitPath(path)) {
          const convertedPath = convertMKitPath(path);
          return mkitContext.getPathState(convertedPath) || null;
        }
        // For non-MKit paths in preview mode, still try MKit context
        return mkitContext.getPathState(path) || null;
      }

      // In regular mode, use superstate's paths index
      if (superstate?.pathsIndex) {
        return superstate.pathsIndex.get(path) || null;
      }

      return null;
    },
    [mkitContext, isMKitPath, convertMKitPath, superstate]
  );

  const childrenForPath = useCallback(
    async (path: string, type?: string): Promise<string[]> => {
      if (superstate?.spaceManager) {
        return await superstate.spaceManager.childrenForPath(path, type);
      }
      return [];
    },
    [superstate]
  );

  const saveFrameSchema = useCallback(
    async (
      path: string,
      schemaId: string,
      saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema
    ): Promise<void> => {
      if (superstate?.spaceManager) {
        await superstate.spaceManager.saveFrameSchema(
          path,
          schemaId,
          saveSchema
        );
      }
    },
    [superstate]
  );

  const deleteFrame = useCallback(
    async (path: string, name: string): Promise<void> => {
      if (superstate?.spaceManager) {
        await superstate.spaceManager.deleteFrame(path, name);
      }
    },
    [superstate]
  );

  const contextValue = useMemo<SpaceManagerContextType>(
    () => ({
      // Core data operations
      readTable,
      saveTable,
      readFrame,
      saveFrame,

      // Schema operations
      tablesForSpace,
      framesForSpace,

      // Path operations
      resolvePath,
      uriByString,
      pathExists,

      // Space operations
      createSpace,
      deleteSpace,
      spaceInfoForPath,
      contextForSpace,

      // Property operations
      addSpaceProperty,
      saveProperties,
      deleteProperty,
      renameProperty,

      // Table operations
      createTable,

      // File operations
      createItemAtPath,
      deletePath,
      readPath,
      writeToPath,
      parentPathForPath,

      // Additional space operations
      allSpaces,
      childrenForSpace,
      spaceInitiated,
      contextInitiated,
      readAllTables,
      readAllFrames,
      saveSpace,
      renameSpace,
      spaceDefForSpace,

      // Additional path operations
      allPaths,
      renamePath,
      copyPath,
      getPathInfo,
      readPathCache,
      getPathState,
      getPathsIndexMap,
      childrenForPath,

      // Frame schema operations
      saveFrameSchema,
      deleteFrame,

      // MKit utilities
      isPreviewMode: !!mkitContext?.isPreviewMode,
      convertMKitPath,
      isMKitPath,

      // Context access map
      getContextsIndexMap,

      // API reference
      api: superstate?.api,

      // Fallback
      spaceManager: superstate?.spaceManager as SpaceManagerInterface,
    }),
    [
      readTable,
      saveTable,
      readFrame,
      saveFrame,
      tablesForSpace,
      framesForSpace,
      resolvePath,
      uriByString,
      pathExists,
      createSpace,
      deleteSpace,
      spaceInfoForPath,
      contextForSpace,
      addSpaceProperty,
      saveProperties,
      deleteProperty,
      renameProperty,
      createTable,
      createItemAtPath,
      deletePath,
      readPath,
      writeToPath,
      parentPathForPath,
      allSpaces,
      childrenForSpace,
      spaceInitiated,
      contextInitiated,
      readAllTables,
      readAllFrames,
      saveSpace,
      renameSpace,
      spaceDefForSpace,
      allPaths,
      renamePath,
      copyPath,
      getPathInfo,
      readPathCache,
      getPathState,
      getPathsIndexMap,
      childrenForPath,
      saveFrameSchema,
      deleteFrame,
      mkitContext?.isPreviewMode,
      convertMKitPath,
      isMKitPath,
      getContextsIndexMap,
      superstate?.spaceManager,
      formulaContext,
    ]
  );

  return (
    <SpaceManagerContext.Provider value={{ ...contextValue }}>
      {children}
    </SpaceManagerContext.Provider>
  );
};

export const useSpaceManager = (): SpaceManagerContextType => {
  const context = useContext(SpaceManagerContext);
  return context;
};

/**
 * MKit-specific SpaceManagerProvider that operates in isolation using only MKit data
 * This provider creates a SpaceManager interface that works entirely with MKit context
 * without requiring a superstate instance
 */
export const MKitSpaceManagerProvider: React.FC<
  MKitSpaceManagerProviderProps
> = ({ mkitContext, superstate, children }) => {
  // Create formula context for MKit
  const formulaContext = useMemo(() => {
    const config: math.ConfigOptions = {
      matrix: "Array",
    };
    const runContext = math.create(all, config);
    runContext.import(formulas, { override: true });
    return runContext;
  }, []);

  // MKit path utilities
  const isMKitPath = useCallback((path: string): boolean => {
    return path?.startsWith("mkit://preview/") || false;
  }, []);

  const convertMKitPath = useCallback(
    (path: string): string => {
      if (!isMKitPath(path)) {
        return path;
      }

      const pathAfterPrefix = path.replace("mkit://preview/", "");
      const kitId = mkitContext?.rootPath?.replace("mkit://preview/", "") || "";

      if (pathAfterPrefix === kitId || pathAfterPrefix === "") {
        return ".";
      } else if (pathAfterPrefix.startsWith(kitId + "/")) {
        let relativePath = pathAfterPrefix.slice((kitId + "/").length);
        // Remove trailing slashes
        relativePath = relativePath.replace(/\/+$/, "");
        return relativePath || ".";
      }

      // Remove trailing slashes from the result
      let result = pathAfterPrefix.replace(/\/+$/, "");
      return result || ".";
    },
    [mkitContext?.rootPath]
  );

  // MKit-only implementations of SpaceManager methods
  const readTable = useCallback(
    async (path: string, schema: string): Promise<SpaceTable | null> => {
      const convertedPath = convertMKitPath(path);
      const spaceData =
        mkitContext?.getSpaceByFullPath(convertedPath) ||
        mkitContext?.getSpaceByRelativePath(convertedPath);

      if (spaceData?.contextTables?.[schema]) {
        const table = spaceData.contextTables[schema];

        // Apply linkContextRow to calculate formulas and aggregates
        if (table.rows && table.cols && table.cols.length > 0) {
          // Use getPathsIndexMap and getContextsIndexMap from MKit context
          const pathsMap = mkitContext?.getPathsIndexMap
            ? mkitContext.getPathsIndexMap()
            : new Map<string, PathState>();
          const contextsMap = mkitContext?.getContextsIndexMap
            ? mkitContext.getContextsIndexMap()
            : new Map<string, ContextState>();
          const spacesMap = new IndexMap();

          // Calculate dependencies once
          const dependencies = propertyDependencies(table.cols);

          // Default settings (can be extended if needed)
          const settings: MakeMDSettings = {} as MakeMDSettings;

          // Apply linkContextRow to each row
          const processedRows = table.rows.map((row: any) =>
            linkContextRow(
              formulaContext,
              pathsMap,
              contextsMap,
              spacesMap,
              row,
              table.cols,
              spaceData.pathState,
              settings,
              dependencies
            )
          );

          return {
            ...table,
            rows: processedRows,
          };
        }

        return table;
      }

      return null;
    },
    [mkitContext, convertMKitPath, formulaContext]
  );

  const saveTable = useCallback(
    async (
      path: string,
      table: SpaceTable,
      force?: boolean
    ): Promise<boolean> => {
      // MKit preview is read-only
      return false;
    },
    []
  );

  const readFrame = useCallback(
    async (path: string, schema: string): Promise<MDBFrame | null> => {
      const convertedPath = convertMKitPath(path);
      const spaceData =
        mkitContext?.getSpaceByFullPath(convertedPath) ||
        mkitContext?.getSpaceByRelativePath(convertedPath);

      if (spaceData?.frameData?.[schema]) {
        return spaceData.frameData[schema];
      }

      return null;
    },
    [mkitContext, convertMKitPath]
  );

  const saveFrame = useCallback(
    async (path: string, frame: MDBFrame): Promise<void> => {
      // MKit preview is read-only
    },
    []
  );

  const tablesForSpace = useCallback(
    async (path: string): Promise<SpaceTableSchema[]> => {
      const convertedPath = convertMKitPath(path);
      const spaceData =
        mkitContext?.getSpaceByFullPath(convertedPath) ||
        mkitContext?.getSpaceByRelativePath(convertedPath);

      if (spaceData?.contextSchemas) {
        return spaceData.contextSchemas;
      }

      return [];
    },
    [mkitContext, convertMKitPath]
  );

  const framesForSpace = useCallback(
    async (path: string): Promise<SpaceTableSchema[]> => {
      const convertedPath = convertMKitPath(path);
      const spaceData =
        mkitContext?.getSpaceByFullPath(convertedPath) ||
        mkitContext?.getSpaceByRelativePath(convertedPath);

      if (spaceData?.frameSchemas) {
        return spaceData.frameSchemas;
      }

      return [];
    },
    [mkitContext, convertMKitPath]
  );

  const resolvePath = useCallback(
    (path: string, source?: string): string => {
      if (mkitContext?.resolvePath) {
        return mkitContext.resolvePath(path, source);
      }

      return path;
    },
    [mkitContext]
  );

  const uriByString = useCallback(
    (uri: string, source?: string): URI => {
      if (source) {
        uri = mkitContext?.resolvePath(uri, source) || uri;
      }
      return parseURI(uri);
    },
    [mkitContext]
  );

  const pathExists = useCallback(
    async (path: string): Promise<boolean> => {
      const convertedPath = convertMKitPath(path);
      const spaceData =
        mkitContext?.getSpaceByFullPath(convertedPath) ||
        mkitContext?.getSpaceByRelativePath(convertedPath);

      return !!spaceData;
    },
    [mkitContext, convertMKitPath]
  );

  const contextForSpace = useCallback(
    async (path: string): Promise<SpaceTable> => {
      const convertedPath = convertMKitPath(path);
      const spaceData =
        mkitContext?.getSpaceByFullPath(convertedPath) ||
        mkitContext?.getSpaceByRelativePath(convertedPath);

      if (spaceData?.contextTables) {
        // Return the first available table or create a default one
        const tables = Object.values(spaceData.contextTables);
        if (tables.length > 0) {
          return tables[0] as SpaceTable;
        }
      }

      // Return empty table
      return {
        schema: { id: "default", name: i18n.labels.default, type: "db" },
        cols: [],
        rows: [],
      } as SpaceTable;
    },
    [mkitContext, convertMKitPath]
  );

  const spaceInfoForPath = useCallback(
    (path: string): SpaceInfo => {
      const convertedPath = convertMKitPath(path);
      const spaceData =
        mkitContext?.getSpaceByFullPath(convertedPath) ||
        mkitContext?.getSpaceByRelativePath(convertedPath);

      if (spaceData) {
        return {
          name: spaceData.spaceKit.name || i18n.labels.unknown,
          path: path,
          readOnly: true,
          isRemote: false,
          defPath: path,
          notePath: path,
        };
      }

      return {
        name: i18n.labels.unknown,
        path: path,
        readOnly: true,
        isRemote: false,
        defPath: path,
        notePath: path,
      };
    },
    [mkitContext, convertMKitPath]
  );

  // Read-only / No-op implementations for other methods
  const createSpace = useCallback(
    (name: string, parentPath: string, definition: SpaceDefinition): void => {
      // Read-only in MKit
    },
    []
  );

  const deleteSpace = useCallback((path: string): void => {
    // Read-only in MKit
  }, []);

  const addSpaceProperty = useCallback(
    async (path: string, property: SpaceProperty): Promise<boolean> => {
      return false; // Read-only in MKit
    },
    []
  );

  const saveProperties = useCallback(
    async (path: string, properties: Record<string, any>): Promise<boolean> => {
      return false; // Read-only in MKit
    },
    []
  );

  const deleteProperty = useCallback((path: string, property: string): void => {
    // Read-only in MKit
  }, []);

  const renameProperty = useCallback(
    (path: string, property: string, newProperty: string): void => {
      // Read-only in MKit
    },
    []
  );

  const createTable = useCallback(
    (path: string, schema: SpaceTableSchema): void => {
      // Read-only in MKit - no table creation allowed
    },
    []
  );

  const createItemAtPath = useCallback(
    async (
      parent: string,
      type: string,
      name: string,
      content?: any
    ): Promise<string> => {
      return ""; // Read-only in MKit
    },
    []
  );

  const deletePath = useCallback((path: string): void => {
    // Read-only in MKit
  }, []);

  const readPath = useCallback(async (path: string): Promise<string> => {
    return "";
  }, []);

  const writeToPath = useCallback(
    async (path: string, content: any, binary?: boolean): Promise<void> => {
      // Read-only in MKit
    },
    []
  );

  const parentPathForPath = useCallback(
    (path: string): string => {
      if (path === "." || path === mkitContext?.rootPath) {
        return "";
      }

      const parts = path.split("/");
      if (parts.length > 1) {
        return parts.slice(0, -1).join("/") || ".";
      }

      return ".";
    },
    [mkitContext?.rootPath]
  );

  // Additional methods with basic implementations
  const allSpaces = useCallback((): SpaceInfo[] => {
    const allPaths = mkitContext?.getAllRelativePaths() || [];
    return allPaths.map((path: string) => ({
      name: path || i18n.labels.root,
      path: path,
      readOnly: true,
      isRemote: false,
      defPath: path,
      notePath: path,
    }));
  }, [mkitContext]);

  const childrenForSpace = useCallback(
    (path: string): string[] => {
      const convertedPath = convertMKitPath(path);
      const children = mkitContext?.getChildSpaces(convertedPath) || [];
      return children.map((child: any) => child.relativePath);
    },
    [mkitContext, convertMKitPath]
  );

  const spaceInitiated = useCallback(
    async (path: string): Promise<boolean> => {
      return await pathExists(path);
    },
    [pathExists]
  );

  const contextInitiated = useCallback(
    async (path: string): Promise<boolean> => {
      return await pathExists(path);
    },
    [pathExists]
  );

  const readAllTables = useCallback(
    async (path: string): Promise<SpaceTables> => {
      const convertedPath = convertMKitPath(path);
      const spaceData =
        mkitContext?.getSpaceByFullPath(convertedPath) ||
        mkitContext?.getSpaceByRelativePath(convertedPath);

      return spaceData?.contextTables || {};
    },
    [mkitContext, convertMKitPath]
  );

  const readAllFrames = useCallback(
    async (path: string): Promise<MDBFrames> => {
      const convertedPath = convertMKitPath(path);
      const spaceData =
        mkitContext?.getSpaceByFullPath(convertedPath) ||
        mkitContext?.getSpaceByRelativePath(convertedPath);

      return spaceData?.frameData || {};
    },
    [mkitContext, convertMKitPath]
  );

  // No-op implementations for other methods
  const saveSpace = useCallback(
    (
      path: string,
      definition: (def: SpaceDefinition) => SpaceDefinition,
      properties?: Record<string, any>
    ): void => {},
    []
  );
  const renameSpace = useCallback(
    async (path: string, newPath: string): Promise<string> => {
      return "";
    },
    []
  );
  const spaceDefForSpace = useCallback(
    async (path: string): Promise<SpaceDefinition> => {
      return null;
    },
    []
  );
  const allPaths = useCallback(
    (type?: string[]): string[] => {
      return mkitContext?.getAllRelativePaths() || [];
    },
    [mkitContext]
  );
  const renamePath = useCallback(
    async (oldPath: string, newPath: string): Promise<string> => {
      return "";
    },
    []
  );
  const copyPath = useCallback(
    async (
      source: string,
      destination: string,
      newName?: string
    ): Promise<string> => {
      return "";
    },
    []
  );
  const getPathInfo = useCallback(
    async (path: string): Promise<Record<string, any>> => {
      return {};
    },
    []
  );
  const readPathCache = useCallback(
    async (path: string): Promise<PathCache> => {
      return null;
    },
    []
  );
  const getPathState = useCallback(
    (path: string): PathState | null => {
      // Use MKit context's getPathState if available
      if (mkitContext?.getPathState) {
        const convertedPath = convertMKitPath(path);
        return mkitContext.getPathState(convertedPath) || null;
      }

      // Fallback to direct lookup
      const convertedPath = convertMKitPath(path);
      const spaceDataByFullPath =
        mkitContext?.getSpaceByFullPath(convertedPath);
      const spaceDataByRelativePath =
        mkitContext?.getSpaceByRelativePath(convertedPath);
      const spaceData = spaceDataByFullPath || spaceDataByRelativePath;

      if (spaceData?.pathState) {
        return spaceData.pathState;
      }

      return null;
    },
    [mkitContext, convertMKitPath]
  );
  const childrenForPath = useCallback(
    async (path: string, type?: string): Promise<string[]> => {
      return [];
    },
    []
  );
  const saveFrameSchema = useCallback(
    async (
      path: string,
      schemaId: string,
      saveSchema: (prev: SpaceTableSchema) => SpaceTableSchema
    ): Promise<void> => {
      // Read-only in MKit
    },
    []
  );
  const deleteFrame = useCallback(
    async (path: string, name: string): Promise<void> => {
      // Read-only in MKit
    },
    []
  );

  const getContextsIndexMap = useCallback((): Map<string, ContextState> => {
    // Use the MKit context's getContextsIndexMap if available
    if (mkitContext?.getContextsIndexMap) {
      return mkitContext.getContextsIndexMap();
    }
    // Fallback to empty map if not available
    return new Map<string, ContextState>();
  }, [mkitContext]);

  const getPathsIndexMap = useCallback((): Map<string, PathState> => {
    // Use the MKit context's getPathsIndexMap if available
    if (mkitContext?.getPathsIndexMap) {
      return mkitContext.getPathsIndexMap();
    }
    // Fallback to empty map if not available
    return new Map<string, PathState>();
  }, [mkitContext]);

  const contextValue = useMemo<SpaceManagerContextType>(() => {
    const spaceManagerContextValue = {
      // Core data operations
      readTable,
      saveTable,
      readFrame,
      saveFrame,

      // Schema operations
      tablesForSpace,
      framesForSpace,

      // Path operations
      resolvePath,
      uriByString,
      pathExists,

      // Space operations
      createSpace,
      deleteSpace,
      spaceInfoForPath,
      contextForSpace,

      // Property operations
      addSpaceProperty,
      saveProperties,
      deleteProperty,
      renameProperty,

      // Table operations
      createTable,

      // File operations
      createItemAtPath,
      deletePath,
      readPath,
      writeToPath,
      parentPathForPath,

      // Additional space operations
      allSpaces,
      childrenForSpace,
      spaceInitiated,
      contextInitiated,
      readAllTables,
      readAllFrames,
      saveSpace,
      renameSpace,
      spaceDefForSpace,

      // Additional path operations
      allPaths,
      renamePath,
      copyPath,
      getPathInfo,
      readPathCache,
      getPathState,
      getPathsIndexMap,
      childrenForPath,

      // Frame schema operations
      saveFrameSchema,
      deleteFrame,

      // MKit utilities
      isPreviewMode: true,
      convertMKitPath,
      isMKitPath,

      // Context access map
      getContextsIndexMap,

      // API reference - will be set below
      api: null as IAPI,

      // No fallback - MKit operates in isolation
      spaceManager: null as SpaceManagerInterface,
    };

    // Create API for MKit preview using the provided superstate
    if (superstate) {
      spaceManagerContextValue.api = new API(
        superstate,
        spaceManagerContextValue
      );
    }

    return spaceManagerContextValue;
  }, [
    readTable,
    saveTable,
    readFrame,
    saveFrame,
    tablesForSpace,
    framesForSpace,
    resolvePath,
    uriByString,
    pathExists,
    createSpace,
    deleteSpace,
    spaceInfoForPath,
    contextForSpace,
    addSpaceProperty,
    saveProperties,
    deleteProperty,
    renameProperty,
    createItemAtPath,
    deletePath,
    readPath,
    writeToPath,
    parentPathForPath,
    allSpaces,
    childrenForSpace,
    spaceInitiated,
    contextInitiated,
    readAllTables,
    readAllFrames,
    saveSpace,
    renameSpace,
    spaceDefForSpace,
    allPaths,
    renamePath,
    copyPath,
    getPathInfo,
    readPathCache,
    getPathState,
    getPathsIndexMap,
    childrenForPath,
    saveFrameSchema,
    deleteFrame,
    convertMKitPath,
    isMKitPath,
    getContextsIndexMap,
    superstate,
    formulaContext,
  ]);
  const api = useMemo(() => {
    const kitAPI = new API(superstate, contextValue);
    return kitAPI;
  }, [contextValue]);
  return (
    <SpaceManagerContext.Provider value={{ ...contextValue, api: api }}>
      {children}
    </SpaceManagerContext.Provider>
  );
};

export { SpaceManagerContext };
