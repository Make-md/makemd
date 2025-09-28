import { useSpaceManager } from "core/react/context/SpaceManagerContext";
import { SpaceTable, SpaceTableSchema } from "shared/types/mdb";

interface DataHandler {
  isPreviewMode: boolean;
  loadTableData: (sourcePath: string, tableId: string) => Promise<SpaceTable | null>;
  loadAvailableTables: (sourcePath: string) => Promise<SpaceTableSchema[]>;
}

/**
 * Simplified data handler that uses SpaceManagerContext
 * The SpaceManagerContext automatically handles MKit vs regular mode
 */
export const useDataHandler = (): DataHandler => {
  const spaceManager = useSpaceManager();

  const loadTableData = async (sourcePath: string, tableId: string): Promise<SpaceTable | null> => {

    return await spaceManager.readTable(sourcePath, tableId);
  };

  const loadAvailableTables = async (sourcePath: string): Promise<SpaceTableSchema[]> => {

    return await spaceManager.tablesForSpace(sourcePath);
  };

  return {
    isPreviewMode: spaceManager.isPreviewMode,
    loadTableData,
    loadAvailableTables
  };
};

/**
 * @deprecated Use useDataHandler instead - this maintains backward compatibility
 */
export const useMKitDataHandler = (superstate?: any): DataHandler => {
  return useDataHandler();
};

/**
 * Utility function to check if a path is an MKit preview path
 */
export const isMKitPreviewPath = (path: string): boolean => {
  return path?.startsWith('mkit://preview/') || false;
};