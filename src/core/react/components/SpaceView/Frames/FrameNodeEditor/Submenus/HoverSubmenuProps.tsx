import { Superstate } from "core/superstate/superstate";
import { PathState } from "core/types/superstate";
import { SpaceProperty } from "types/mdb";
import {
  FrameNode,
  FrameNodeState,
  FrameRunInstance,
  FrameTreeProp,
} from "types/mframe";

export type HoverSubmenuProps = {
  superstate: Superstate;
  exitMenu: () => void;
  saveStyleValue: (key: string, value: string) => void;
  selectedNode: FrameNode;
  setHoverMenu: (menu: number) => void;
  savePropValue: (key: string, value: string) => void;
  frameProps: FrameTreeProp;
  fields: SpaceProperty[];
  state: FrameNodeState;
};

export type PropertySubmenuProps = HoverSubmenuProps & {
  pathState: PathState;
  frameProperties: SpaceProperty[];
  instance: FrameRunInstance;
};
