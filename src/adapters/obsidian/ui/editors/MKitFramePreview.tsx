import { FrameInstanceView } from "core/react/components/SpaceView/Frames/ViewNodes/FrameInstance";
import { FrameInstanceProvider } from "core/react/context/FrameInstanceContext";
import { FrameRootProvider } from "core/react/context/FrameRootContext";
import { FramesMDBProvider } from "core/react/context/FramesMDBContext";
import { PathProvider } from "core/react/context/PathContext";
import { SpaceProvider } from "core/react/context/SpaceContext";
import { Superstate } from "makemd-core";
import React, { PropsWithChildren, useMemo } from "react";
import { defaultContextSchemaID } from "shared/schemas/context";
import { SpaceKit } from "shared/types/kits";
import { DBTable, SpaceProperty, SpaceTableSchema } from "shared/types/mdb";
import { FrameTreeProp, MDBFrames } from "shared/types/mframe";
import { SpaceInfo } from "shared/types/spaceInfo";
import { PathState } from "shared/types/superstate";
import { mdbSchemaToFrameSchema } from "shared/utils/makemd/schema";

interface MKitFramePreviewProps {
  superstate: Superstate;
  spaceKit: SpaceKit;
  frameId?: string;
}

export const MKitFramePreview: React.FC<
  PropsWithChildren<MKitFramePreviewProps>
> = ({ children, superstate, spaceKit, frameId }) => {
  // Create pseudo path for preview
  const pseudoPath: PathState = useMemo(
    () => ({
      path: `mkit://preview/${spaceKit.path || spaceKit.name}`,
      name: spaceKit.name,
      label: { name: spaceKit.name, sticker: "", color: "" },
      readOnly: true,
    }),
    [spaceKit]
  );

  // Convert frames tables to MDBFrames format
  const mdbFrames = useMemo(() => {
    if (!spaceKit.frames) return {};

    const frames: MDBFrames = spaceKit.frames as any;
    return frames;
  }, [spaceKit.frames]);

  // Create schema table for frames
  const schemaTable = useMemo(() => {
    if (!spaceKit.frames) return null;

    const schemas: SpaceTableSchema[] = [];
    Object.values(spaceKit.frames).forEach((table) => {
      if (table.schema) {
        schemas.push(table.schema);
      }
    });

    return {
      uniques: [],
      cols: ["id", "name", "type", "def", "predicate", "primary"],
      rows: schemas,
    } as DBTable;
  }, [spaceKit.frames]);

  // Convert schemas to FrameSchema format
  const frameSchemas = useMemo(() => {
    if (!schemaTable) return [];
    return schemaTable.rows.map((schema) =>
      mdbSchemaToFrameSchema(schema as SpaceTableSchema)
    );
  }, [schemaTable]);

  // Get the frame to display
  const currentFrame = useMemo(() => {
    if (frameId) {
      // Search for the frame with the given ID
      for (const table of Object.values(spaceKit.frames || {})) {
        if (table.rows) {
          const frame = table.rows.find((row: any) => row.id === frameId);
          if (frame) return frame;
        }
      }
    }

    // Try to find a root frame or the first available frame
    if (!mdbFrames || Object.keys(mdbFrames).length === 0) return null;

    // Look for the main frame (usually the first schema's frame)
    for (const [schemaId, frameData] of Object.entries(mdbFrames)) {
      if (frameData && frameData.rows && frameData.rows.length > 0) {
        // Find root frame (no parentId)
        const rootFrame = frameData.rows.find(
          (row: any) =>
            !row.parentId || row.parentId === "" || row.parentId === null
        );
        if (rootFrame) return rootFrame;

        // Otherwise return first frame
        return frameData.rows[0];
      }
    }

    return null;
  }, [frameId, mdbFrames, spaceKit]);

  // Build complete frame tree
  const frameTree = useMemo(() => {
    const tree: FrameTreeProp = {};

    if (!mdbFrames) return tree;

    Object.values(mdbFrames).forEach((frameData) => {
      if (frameData && frameData.rows) {
        frameData.rows.forEach((frame: any) => {
          // Find children
          const children: string[] = [];
          Object.values(mdbFrames).forEach((fd) => {
            if (fd && fd.rows) {
              fd.rows.forEach((f: any) => {
                if (f.parentId === frame.id) {
                  children.push(f.id);
                }
              });
            }
          });

          tree[frame.id] = {
            node: frame,
            children,
          };
        });
      }
    });

    return tree;
  }, [mdbFrames]);

  // Get context columns
  const contextCols = useMemo(() => {
    const cols: SpaceProperty[] = [];

    if (spaceKit.context) {
      Object.values(spaceKit.context).forEach((table) => {
        if (table.cols) {
          cols.push(...table.cols);
        }
      });
    }

    return cols;
  }, [spaceKit.context]);

  // Get sample context data for preview
  const sampleContextData = useMemo(() => {
    if (!spaceKit.context) return {};

    // Get first row from main context table or any table
    const mainTable = spaceKit.context[defaultContextSchemaID];
    const contextTable = mainTable || Object.values(spaceKit.context)[0];

    if (contextTable && contextTable.rows && contextTable.rows.length > 0) {
      return contextTable.rows[0];
    }

    return {};
  }, [spaceKit.context]);

  // Check for banner/cover in properties
  const bannerUri = useMemo(() => {
    // Check various possible property names for banner/cover
    const bannerKey = Object.keys(spaceKit.properties || {}).find(
      (key) =>
        key.toLowerCase().includes("banner") ||
        key.toLowerCase().includes("cover") ||
        key.toLowerCase().includes("image")
    );

    if (bannerKey && spaceKit.properties[bannerKey]) {
      return superstate.spaceManager.uriByString(
        spaceKit.properties[bannerKey]
      );
    }

    // Check if there's a banner in the label properties
    const labelProperties = spaceKit.context?.label?.rows?.[0];
    if (labelProperties?.banner) {
      return superstate.spaceManager.uriByString(labelProperties.banner);
    }

    return null;
  }, [spaceKit, superstate]);

  if (!currentFrame) {
    return (
      <div className="mk-mkit-preview-empty">
        <p>No frames available in this space kit</p>
      </div>
    );
  }

  // Create context for frame instance
  const contexts = {
    $context: {
      _path: pseudoPath.path,
      _schema: currentFrame.schemaId || "",
      _key: "name",
      _name: spaceKit.name,
      _properties: contextCols,
      _values: sampleContextData,
      ...sampleContextData,
    },
  };

  // Space info for SpaceProvider
  const spaceInfo: SpaceInfo = {
    path: pseudoPath.path,
    name: spaceKit.name,
    readOnly: true,
    isRemote: false,
    defPath: pseudoPath.path,
    notePath: "",
  };

  return (
    <div className="mk-mkit-frame-preview">
      {bannerUri && (
        <div
          className="mk-mkit-banner"
          style={{
            backgroundImage: `url("${
              bannerUri.scheme === "vault"
                ? superstate.ui.getUIPath(bannerUri.basePath)
                : bannerUri.fullPath
            }")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: "200px",
          }}
        />
      )}
      <div className="mk-mkit-body">
        <div className="mk-mkit-header">
          <h1 className="mk-mkit-title">{spaceKit.name}</h1>
          {children}
        </div>
        <PathProvider
          superstate={superstate}
          path={pseudoPath.path}
          pathState={pseudoPath}
          readMode={true}
        >
          <SpaceProvider superstate={superstate} spaceInfo={spaceInfo}>
            <FramesMDBProvider superstate={superstate}>
              <FrameRootProvider
                superstate={superstate}
                path={superstate.spaceManager.uriByString(pseudoPath.path)}
                cols={[]}
                previewMode={true}
                frame={mdbFrames.main}
              >
                <FrameInstanceProvider
                  id="mkit-preview"
                  superstate={superstate}
                  props={{}}
                  contexts={contexts}
                  editable={false}
                >
                  <FrameInstanceView
                    superstate={superstate}
                    source={pseudoPath.path}
                  />
                </FrameInstanceProvider>
              </FrameRootProvider>
            </FramesMDBProvider>
          </SpaceProvider>
        </PathProvider>
      </div>
    </div>
  );
};
