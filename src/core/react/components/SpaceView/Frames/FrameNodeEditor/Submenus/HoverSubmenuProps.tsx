import { Superstate } from "makemd-core";
import { FrameNodeState, FrameRunInstance } from "shared/types/frameExec";
import { SpaceProperty } from "shared/types/mdb";
import { FrameNode, FrameTreeProp } from "shared/types/mframe";
import { PathState } from "shared/types/PathState";

export type HoverSubmenuProps = {
  superstate: Superstate;
  exitMenu: (e: React.MouseEvent) => void;
  saveStyleValue: (key: string, value: string) => void;
  selectedNode: FrameNode;
  setHoverMenu: (menu: number) => void;
  savePropValue: (key: string, value: string) => void;
  frameProps: FrameTreeProp;
  fields: SpaceProperty[];
  state: FrameNodeState;
  updateNode: (node: FrameNode, updates: Partial<FrameNode>) => void;
  styleState?: string; // Optional state prefix for styles (e.g., "hover", "focus", etc.)
  instance: FrameRunInstance;
  pathState: PathState;
};

export type PropertySubmenuProps = HoverSubmenuProps & {
  frameProperties: SpaceProperty[];
  instance: FrameRunInstance;
};
