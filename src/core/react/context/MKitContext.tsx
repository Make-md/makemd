import { resolvePath } from "core/superstate/utils/path";
import React, { createContext, useContext, useMemo } from "react";
import { defaultContextSchemaID } from "shared/schemas/context";
import { SpaceKit } from "shared/types/kits";
import {
  DBRows,
  DBTable,
  SpaceTables,
  SpaceTableSchema,
} from "shared/types/mdb";
import { FrameSchema, MDBFrames } from "shared/types/mframe";
import { ContextState, PathState } from "shared/types/superstate";
import { mdbSchemaToFrameSchema } from "shared/utils/makemd/schema";
import { MKitSpaceManagerProvider } from "./SpaceManagerContext";

interface ProcessedSpaceData {
  spaceKit: SpaceKit;
  frameData: MDBFrames;
  frameSchemas?: FrameSchema[];
  schemaTable?: DBTable;
  contextTables: SpaceTables;
  contextSchemas?: SpaceTableSchema[];
  pseudoPath: PathState;
  pseudoContext: ContextState;
  parentPath?: string;
  relativePath: string; // Relative path from root kit
  childPaths: string[];
}

interface MKitContextType {
  spaceKit: SpaceKit | null;
  isPreviewMode: boolean;
  rootPath: string; // Base path for the root kit
  // Dictionary of spaces by relative path
  spacesByRelativePath: Record<string, ProcessedSpaceData>;
  // Helper functions
  getSpaceByRelativePath: (
    relativePath: string
  ) => ProcessedSpaceData | undefined;
  getSpaceByFullPath: (fullPath: string) => ProcessedSpaceData | undefined;
  getContextDataForSpace: (spacePath: string, tableName?: string) => DBRows;
  getFrameDataForSpace: (spacePath: string, frameId?: string) => any;
  getAllRelativePaths: () => string[];
  getAllFullPaths: () => string[];
  getChildSpaces: (parentPath: string) => ProcessedSpaceData[];
  getSpaceHierarchy: () => Map<string, string[]>; // path -> child paths
  resolvePath: (path: string, source?: string) => string;
}

const MKitContext = createContext<MKitContextType>({
  spaceKit: null,
  isPreviewMode: false,
  rootPath: "",
  spacesByRelativePath: {},
  getSpaceByRelativePath: () => undefined,
  getSpaceByFullPath: () => undefined,
  getContextDataForSpace: () => [],
  getFrameDataForSpace: () => null,
  getAllRelativePaths: () => [],
  getAllFullPaths: () => [],
  getChildSpaces: () => [],
  getSpaceHierarchy: () => new Map(),
  resolvePath: () => "",
});

export const useMKitPreviewContext = () => {
  const context = useContext(MKitContext);
  return context;
};

interface MKitProviderProps {
  spaceKit?: SpaceKit;
  children: React.ReactNode;
}

// Helper function to create pseudo path for a space kit
const createPseudoPath = (
  spaceKit: SpaceKit,
  parentPath?: string
): PathState => {
  const path = parentPath
    ? `${parentPath}/${spaceKit.name}`
    : `mkit://preview/${spaceKit.path || spaceKit.name}`;

  return {
    path,
    name: spaceKit.name,
    type: "space",
    subtype: "folder",
    parent: parentPath || "",
    label: {
      name: spaceKit.name,
      sticker: spaceKit.definition?.defaultSticker || "",
      color: spaceKit.definition?.defaultColor || "",
    },
    metadata: spaceKit.properties || {},
    tags: [],
    spaces: spaceKit.children?.map((child) => `${path}/${child.name}`) || [],
    readOnly: true,
  };
};

// Helper function to create pseudo context for a space kit
const createPseudoContext = (
  spaceKit: SpaceKit,
  pseudoPath: PathState
): ContextState => {
  const mainTable = spaceKit.context?.[defaultContextSchemaID];
  const contextTable = mainTable || Object.values(spaceKit.context || {})[0];

  return {
    path: pseudoPath.path,
    schemas: Object.values(spaceKit.context || {})
      .map((table) => table.schema)
      .filter(Boolean),
    contextTable: contextTable || { schema: null, cols: [], rows: [] },
    outlinks: [],
    contexts: [],
    paths: [],
    spaceMap: {},
    dbExists: true,
    mdb: spaceKit.context || {},
  };
};

// Create schema table and frame schemas from frames
const createFrameSchemas = (
  frames: SpaceTables | undefined
): {
  schemaTable?: DBTable;
  frameSchemas?: FrameSchema[];
} => {
  if (!frames) {
    return {};
  }

  const schemas: SpaceTableSchema[] = [];
  Object.values(frames).forEach((table) => {
    if (table.schema) {
      
      schemas.push(table.schema);
    }
  });

  if (schemas.length === 0) {
    return {};
  }


  const schemaTable: DBTable = {
    uniques: [],
    cols: ["id", "name", "type", "def", "predicate", "primary"],
    rows: schemas,
  };

  const frameSchemas = schemaTable.rows.map((schema) =>
    mdbSchemaToFrameSchema(schema as SpaceTableSchema)
  );


  return { schemaTable, frameSchemas };
};

// Recursively process a space and all its nested children
const processSpaceRecursively = (
  spaceKit: SpaceKit,
  parentRelativePath: string | null,
  rootPath: string,
  spacesByRelativePath: Record<string, ProcessedSpaceData>
): ProcessedSpaceData => {
  // Build relative path
  // For root space, use "." as the relative path, for children use their path from root
  let relativePath: string;

  if (parentRelativePath === null) {
    // This is the root space
    relativePath = ".";
  } else {
    // For child spaces, use the space.path and remove the root kit path
    const spacePath = spaceKit.path || spaceKit.name;
    const rootKitPath = rootPath.replace("mkit://preview/", ""); // Get the actual root path

    if (parentRelativePath === ".") {
      // Direct child of root - remove the root kit path to get relative path
      if (spacePath.startsWith(rootKitPath)) {
        // Remove root path and any separators
        let relPath = spacePath.slice(rootKitPath.length);
        // Remove leading separators
        relPath = relPath.replace(/^[\\\/]+/, "");
        relativePath = relPath || spaceKit.name;
      } else {
        // Fallback to name if path doesn't start with root
        relativePath = spaceKit.name;
      }
    } else {
      // Nested child - append to parent path
      relativePath = `${parentRelativePath}/${spaceKit.name}`;
    }
  }

  // Build full path
  const fullPath =
    relativePath === "." ? rootPath : `${rootPath}/${relativePath}`;
  const parentPath =
    parentRelativePath === null
      ? null
      : parentRelativePath === "."
      ? rootPath
      : `${rootPath}/${parentRelativePath}`;

  const pseudoPath = createPseudoPath(spaceKit, parentPath);
  const pseudoContext = createPseudoContext(spaceKit, pseudoPath);
  
  // Extract context schemas from context tables first
  const contextSchemas: SpaceTableSchema[] = [];
  if (spaceKit.context) {
    Object.values(spaceKit.context).forEach((table) => {
      if (table.schema) {
        contextSchemas.push(table.schema);
      }
    });
  }
  
  
  // Create frame schemas (should already have proper def fields from existing frames)
  const { schemaTable, frameSchemas } = createFrameSchemas(spaceKit.frames);

  // Process all direct children first to get their paths
  const childPaths: string[] = [];

  if (spaceKit.children && spaceKit.children.length > 0) {
    spaceKit.children.forEach((childKit) => {
      const childData = processSpaceRecursively(
        childKit,
        relativePath,
        rootPath,
        spacesByRelativePath
      );
      childPaths.push(childData.relativePath);
    });
  }

  const processedData: ProcessedSpaceData = {
    spaceKit,
    frameData: (spaceKit.frames as any) || {},
    frameSchemas,
    schemaTable,
    contextTables: spaceKit.context || {},
    contextSchemas: contextSchemas.length > 0 ? contextSchemas : undefined,
    pseudoPath,
    pseudoContext,
    parentPath,
    relativePath,
    childPaths,
  };

  // Add to the dictionary using relative path as key
  spacesByRelativePath[relativePath] = processedData;

  return processedData;
};

export const MKitProvider: React.FC<MKitProviderProps> = ({
  spaceKit,
  children,
}) => {
  const isPreviewMode = !!spaceKit;

  // Process entire space hierarchy
  const { spacesByRelativePath, rootPath } = useMemo(() => {
    if (!spaceKit) {
      return { spacesByRelativePath: {}, rootPath: "" };
    }

    const rootPath = `mkit://preview/${spaceKit.path || spaceKit.name}`;
    const spacesDict: Record<string, ProcessedSpaceData> = {};

    // Process root space (with null parent path to indicate it's the root)
    processSpaceRecursively(spaceKit, null, rootPath, spacesDict);

    // Convert empty string paths to "." for root
    if (spacesDict[""]) {
      spacesDict["."] = spacesDict[""];
      delete spacesDict[""];
    }

    return { spacesByRelativePath: spacesDict, rootPath };
  }, [spaceKit]);

  // Helper to get space by relative path
  const getSpaceByRelativePath = (
    relativePath: string
  ): ProcessedSpaceData | undefined => {
    // Convert empty string to "." for root lookup and remove trailing slashes
    let normalizedPath = relativePath === "" ? "." : relativePath;
    normalizedPath = normalizedPath.replace(/\/+$/, ""); // Remove trailing slashes
    if (normalizedPath === "") normalizedPath = "."; // Handle case where path was just slashes

    return spacesByRelativePath[normalizedPath];
  };

  // Helper to get space by full path
  const getSpaceByFullPath = (
    fullPath: string
  ): ProcessedSpaceData | undefined => {
    // Extract relative path from full path
    if (fullPath.startsWith(rootPath)) {
      let relativePath: string;

      if (fullPath === rootPath) {
        // Exact match with root path means it's the root space
        relativePath = ".";
      } else if (fullPath.startsWith(rootPath + "/")) {
        // Path is longer than root, extract the relative part
        relativePath = fullPath.slice(rootPath.length + 1);
      } else {
        // This shouldn't happen if fullPath starts with rootPath, but just in case
        relativePath = fullPath.slice(rootPath.length);
      }

      // Remove trailing slashes and normalize
      let normalizedPath = relativePath === "" ? "." : relativePath;
      normalizedPath = normalizedPath.replace(/\/+$/, ""); // Remove trailing slashes
      if (normalizedPath === "") normalizedPath = "."; // Handle case where path was just slashes

      return spacesByRelativePath[normalizedPath];
    }

    // Try to find by matching pseudoPath
    const foundSpace = Object.values(spacesByRelativePath).find(
      (space) => space.pseudoPath.path === fullPath
    );

    return foundSpace;
  };

  // Helper function to get context data for any space
  const getContextDataForSpace = (
    spacePath: string,
    tableName?: string
  ): DBRows => {
    // Try both full path and relative path
    const spaceData =
      getSpaceByFullPath(spacePath) || getSpaceByRelativePath(spacePath);

    if (!spaceData) return [];

    const tables = spaceData.contextTables;
    if (!tables) return [];

    if (tableName) {
      const tableData = tables[tableName];

      return tableData?.rows || [];
    }

    // Return main context table rows or first table's rows
    const mainTable = tables[defaultContextSchemaID];
    if (mainTable) {
      return mainTable.rows || [];
    }

    const firstTable = Object.values(tables)[0];

    return firstTable?.rows || [];
  };

  // Helper function to get frame data for any space
  const getFrameDataForSpace = (spacePath: string, frameId?: string): any => {
    // Try both full path and relative path
    const spaceData =
      getSpaceByFullPath(spacePath) || getSpaceByRelativePath(spacePath);
    if (!spaceData) return null;

    const frames = spaceData.frameData;
    if (!frames) return null;

    if (frameId) {
      // Search through all frame tables for the frame
      for (const table of Object.values(frames)) {
        const frame = table.rows?.find((row: any) => row.id === frameId);
        if (frame) return frame;
      }
    }

    // Return the first frame if no ID specified
    const firstTable = Object.values(frames)[0];
    return firstTable?.rows?.[0] || null;
  };

  // Get all relative paths
  const getAllRelativePaths = (): string[] => {
    return Object.keys(spacesByRelativePath).map((path) =>
      path === "" ? "." : path
    );
  };

  // Get all full paths
  const getAllFullPaths = (): string[] => {
    return Object.values(spacesByRelativePath).map(
      (space) => space.pseudoPath.path
    );
  };

  // Get direct child spaces of a parent
  const getChildSpaces = (parentPath: string): ProcessedSpaceData[] => {
    const parentSpace =
      getSpaceByFullPath(parentPath) || getSpaceByRelativePath(parentPath);
    if (!parentSpace) return [];

    return parentSpace.childPaths
      .map((childRelativePath) => spacesByRelativePath[childRelativePath])
      .filter((space): space is ProcessedSpaceData => space !== undefined);
  };

  // Get the complete hierarchy map
  const getSpaceHierarchy = (): Map<string, string[]> => {
    const hierarchy = new Map<string, string[]>();
    Object.entries(spacesByRelativePath).forEach(
      ([relativePath, spaceData]) => {
        hierarchy.set(relativePath, spaceData.childPaths);
      }
    );
    return hierarchy;
  };

  // Resolve path with MKit context, ensuring trailing slash for source
  const mkitResolvePath = (path: string, source?: string): string => {
    let baseSource = source || rootPath;

    // Normalize source if it's a root path variant
    if (source && source.startsWith("mkit://preview/")) {
      // Extract the name after mkit://preview/ from source
      const sourceName = source.replace("mkit://preview/", "");
      // Extract the kit name from rootPath
      const rootName = rootPath.replace("mkit://preview/", "");

      // If source name equals root name, or if source doesn't have subpaths, treat as root
      if (sourceName === rootName || !sourceName.includes("/")) {
        baseSource = rootPath;
      }
    }

    // Ensure source has trailing slash for proper path resolution
    const sourceWithSlash = baseSource.endsWith("/")
      ? baseSource
      : baseSource + "/";
    const result = resolvePath(path, sourceWithSlash);
    return result;
  };

  const contextValue: MKitContextType = {
    spaceKit: spaceKit || null,
    isPreviewMode,
    rootPath,
    spacesByRelativePath,
    getSpaceByRelativePath,
    getSpaceByFullPath,
    getContextDataForSpace,
    getFrameDataForSpace,
    getAllRelativePaths,
    getAllFullPaths,
    getChildSpaces,
    getSpaceHierarchy,
    resolvePath: mkitResolvePath,
  };

  return (
    <MKitContext.Provider value={contextValue}>
      <MKitSpaceManagerProvider mkitContext={contextValue}>
        {children}
      </MKitSpaceManagerProvider>
    </MKitContext.Provider>
  );
};
