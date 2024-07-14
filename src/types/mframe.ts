import { ScreenType } from "core/middleware/ui";
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
export type FrameStateKeys = 'props' | 'actions' | 'styles'
export type FrameNodeState = Partial<{ props: FrameTreeProp, actions: FrameTreeProp, styles: FrameTreeProp}>
export type FrameState = { [key: string]: FrameNodeState} & {$contexts?: FrameContexts, $api?: API}
export type FrameStateUpdate = { newState: FrameState, updatedState: FrameState }
export type FrameRunInstance = {
  id: string,
  state: FrameState,
  prevState?: FrameState,
  slides: FrameState,
  root: FrameTreeNode,
  exec: FrameExecutable,
  newState?: FrameState,
  contexts: FrameContexts,
}
export enum FrameEditorResizeMode {
  ResizeNever,
  ResizeSelected,
  ResizeAlways
  }

  export enum FrameEditorMode {
    Read = 0,
    Page = 1,
    Frame = 2,
    Group = 3,
  }

export enum FrameResizeMode {
ResizeNever,
ResizeSelected,
ResizeColumn,
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
  DropModeColumnOnly,
}


export type FrameEditorProps = { rootId?: string, editMode: FrameEditorMode, parentType?: string, parentLastChildID?: string, dragMode?: FrameDragMode, selectMode?: FrameSelectMode, resizeMode?: FrameResizeMode, dropMode?: FrameDropMode, linkedNode?: LinkedNode, screenType?: ScreenType}
export const defaultFrameEditorProps : FrameEditorProps= {editMode: 0}

export type FrameTreeNode = {
    id: string;
    node: FrameNode;
    isRef: boolean;
    children: FrameTreeNode[];
    editorProps: FrameEditorProps
    parent: FrameTreeNode | null;
  };

  export type FrameExecutable = FrameTreeNode & {
    execPropsOptions?: {
      props?: FrameExecPropCache[],
      deps?: string[][],
      children?: string[],
      template?:FrameExecutable[]
    };
    execProps?: FrameExecProp;
    execStyles?: FrameExecProp;
    execActions?: FrameExecProp;
    children: FrameExecutable[];
  };

  export type FrameExecutableContext = {
    runID: string,
    root: FrameTreeNode,
    exec: FrameExecutable,
    saveState: (state: FrameState, instance: FrameRunInstance) => void,
    api: API,
    contexts: FrameContexts,
    selectedSlide: string;
}
  
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
      context?: string
      db?: string
      type?: string
      id?: string
    }
  }
  export type FrameRoot = {
    id?: string;
    def: {[key: string]: string};
    children?: FrameRoot[];
    node: FrameNode;
  }

  export type FrameExecPropCache = {
    name: string;
    isConst: boolean;
    deps: string[][];
  }
  
  export type LinkedNode = {
    node: string;
    prop: string;
  };

  export type LinkedContext = {
    context: string;
    prop: string;
  };

  export type FrameExecProp = {
    [key: string]: any
  }

  export type FrameNode = {
    styles?: FrameTreeProp;
    name: string;
    //key value for a context and a path
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

 