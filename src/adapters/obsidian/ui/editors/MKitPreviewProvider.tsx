import React, { createContext, useContext, useMemo } from "react";
import { SpaceKit } from "shared/types/kits";
import { DBRows, SpaceTables } from "shared/types/mdb";
import { ContextState, PathState } from "shared/types/superstate";
import { FrameTreeProp } from "shared/types/mframe";
import { defaultContextSchemaID } from "shared/schemas/context";
import { PathPropertyName } from "shared/types/context";

interface MKitPreviewContextType {
  spaceKit: SpaceKit;
  currentFrame: string;
  setCurrentFrame: (frame: string) => void;
  getContextData: (tableName?: string) => DBRows;
  getFrameData: (frameId: string) => any;
  pseudoPath: PathState;
  pseudoContext: ContextState;
}

const MKitPreviewContext = createContext<MKitPreviewContextType | null>(null);

export const useMKitPreview = () => {
  const context = useContext(MKitPreviewContext);
  if (!context) {
    throw new Error("useMKitPreview must be used within MKitPreviewProvider");
  }
  return context;
};

interface MKitPreviewProviderProps {
  spaceKit: SpaceKit;
  children: React.ReactNode;
}

export const MKitPreviewProvider: React.FC<MKitPreviewProviderProps> = ({
  spaceKit,
  children,
}) => {
  const [currentFrame, setCurrentFrame] = React.useState<string>("");

  // Create pseudo path state
  const pseudoPath: PathState = useMemo(() => ({
    path: `preview://${spaceKit.name}`,
    name: spaceKit.name,
    displayName: spaceKit.name,
    type: "space",
    subtype: "folder",
    parent: "",
    label: {
      name: spaceKit.name,
      sticker: spaceKit.properties?.sticker || spaceKit.definition?.defaultSticker || "",
      color: spaceKit.properties?.color || spaceKit.definition?.defaultColor || "",
      cover: spaceKit.properties?.cover || "",
      thumbnail: spaceKit.properties?.thumbnail || "",
      preview: spaceKit.properties?.preview || "",
    },
    metadata: {},
    tags: [] as string[],
    spaces: [] as string[],
    readOnly: true,
  }), [spaceKit]);

  // Create pseudo context state from the space kit data
  const pseudoContext: ContextState = useMemo(() => {
    // Get the main context table if it exists
    const mainTable = spaceKit.context?.[defaultContextSchemaID];
    const contextTable = mainTable || Object.values(spaceKit.context || {})[0];

    return {
      path: pseudoPath.path,
      schemas: Object.values(spaceKit.context || {}).map(table => table.schema),
      contextTable: contextTable || { schema: null, cols: [], rows: [] },
      outlinks: [] as string[],
      contexts: [] as string[],
      paths: [] as string[],
      spaceMap: {},
      dbExists: true,
      mdb: spaceKit.context || {},
    };
  }, [spaceKit, pseudoPath]);

  // Get context data for a specific table or all tables
  const getContextData = (tableName?: string): DBRows => {
    if (!spaceKit.context) return [];

    if (tableName) {
      return spaceKit.context[tableName]?.rows || [];
    }

    // Return main context table rows or first table's rows
    const mainTable = spaceKit.context[defaultContextSchemaID];
    if (mainTable) return mainTable.rows || [];

    const firstTable = Object.values(spaceKit.context)[0];
    return firstTable?.rows || [];
  };

  // Get frame data by ID
  const getFrameData = (frameId: string): any => {
    if (!spaceKit.frames) return null;

    // Search through all frame tables for the frame
    for (const table of Object.values(spaceKit.frames)) {
      const frame = table.rows?.find((row: any) => row.id === frameId);
      if (frame) return frame;
    }

    // If not found by ID, return the first frame
    const firstTable = Object.values(spaceKit.frames)[0];
    return firstTable?.rows?.[0] || null;
  };

  const contextValue: MKitPreviewContextType = {
    spaceKit,
    currentFrame,
    setCurrentFrame,
    getContextData,
    getFrameData,
    pseudoPath,
    pseudoContext,
  };

  return (
    <MKitPreviewContext.Provider value={contextValue}>
      {children}
    </MKitPreviewContext.Provider>
  );
};

// Helper function to create a pseudo frame tree from frame data
export const createFrameTreeFromKit = (
  frames: SpaceTables,
  rootFrameId?: string
): FrameTreeProp => {
  if (!frames || Object.keys(frames).length === 0) {
    return {};
  }

  const frameTree: FrameTreeProp = {};

  // Get all frames from all tables
  const allFrames: any[] = [];
  Object.values(frames).forEach(table => {
    if (table.rows) {
      allFrames.push(...table.rows);
    }
  });

  // Build tree structure
  allFrames.forEach(frame => {
    frameTree[frame.id] = {
      node: frame,
      children: allFrames
        .filter(f => f.parentId === frame.id)
        .map(f => f.id),
    };
  });

  return frameTree;
};