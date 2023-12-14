import { Superstate } from "core/superstate/superstate";
import { FrameNode } from "types/mframe";

export type HoverSubmenuProps = {
  superstate: Superstate;
  exitMenu: () => void;
  saveStyleValue: (key: string, value: string) => void;
  selectedNode: FrameNode;
};
