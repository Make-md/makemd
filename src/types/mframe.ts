import { API } from "makemd-core";
import { SpaceProperty, SpaceTableSchema } from "./mdb";

export type MFrame = {
    id: string;
    schemaId: string;
    name: string;
    type: string;
    parentId?: string;
    props?: string;
    actions?: string;
    ref?: string;
    rank: string;
    styles?: string;
    contexts?: string;
}

export type FrameTreeProp = Record<string, any>;
export type FrameContexts = {[key: string]: FrameTreeProp}
export type FrameStateKeys = 'props' | 'contexts' | 'actions' | 'styles'
export type FrameState = { [key: string]: { props: FrameTreeProp, contexts: FrameContexts, actions: FrameTreeProp, styles: FrameTreeProp}} & {api?: API}
export type FrameStateUpdate = { newState: FrameState, updatedState: FrameState }
export type FrameRunInstance = {
  id: string,
  state: FrameState,
  root: FrameTreeNode
  newState?: FrameState
}
export enum FrameEditorResizeMode {
  ResizeNever,
  ResizeSelected,
  ResizeAlways
  }

  export enum FrameEditorMode {
    EditorNever,
    EditorNatural,
    EditorFull
  }

export enum FrameResizeMode {
ResizeNever,
ResizeSelected,
ResizeAlways
}
export enum FrameSelectMode {
  SelectNever,
  SelectManual,
  SelectDrag,
  SelectClick
  }

export enum FrameDragMode {
  DragNever,
  DragHandle,
  DragSelected,
  DragAlways
}
export enum FrameDropMode {
  DropModeNone,
  DropModeRowColumn,
  DropModeRowOnly,
  DropModeColumnOnly
}


export type FrameEditorProps = { rootId?: string, editMode: number, parentType?: string, dragMode?: FrameDragMode, selectMode?: FrameSelectMode, resizeMode?: FrameResizeMode, dropMode?: FrameDropMode}
export const defaultFrameEditorProps : FrameEditorProps= {editMode: 0}

export type FrameTreeNode = {
    id: string;
    node: FrameNode;
    isRef: boolean;
    children: FrameTreeNode[];
    editorProps: FrameEditorProps
  };
  
  export type FrameSchema = {
    id: string;
  name: string;
  type: string;
  //used for type definition
  //used for view options including filter, order and group
  predicate?: string;
  primary?: string;
    def?: {
      icon?: string
      db?: string
    }
  }
  export type FrameRoot = {
    id?: string;
    def: {[key: string]: string};
    children?: FrameRoot[];
    node: FrameNode;
  }

  export type FrameNode = {
    styles?: FrameTreeProp;
    name: string;
    contexts?: FrameTreeProp;
    props?: FrameTreeProp;
    types?: FrameTreeProp;
    propsValue?: FrameTreeProp;
    propsAttrs?: FrameTreeProp;
    actions?: FrameTreeProp;
    parentId?: string;
    ref?: string;
    type: string;
    rank: number;
    schemaId: string;
    icon?: string;
    id: string;
  };

  export type MDBFrame = {
    schema: SpaceTableSchema;
    cols: SpaceProperty[];
    rows: MFrame[];
  };

  export type MDBFrames = { [key: string] : MDBFrame}

 