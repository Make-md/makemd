import { FrameState } from "./frameExec";
import { IAPI } from "./api";
import { SpaceProperty as Property, SpaceTableSchema } from "./mdb";

// Interaction type for event handlers
export type Interaction = any;

export type MFrame = {
    id: string;
    schemaId: string;
    name: string;
    type: string;
    parentId?: string;
    props?: string;
    actions?: string;
    interactions?: string;
    ref?: string;
    rank: string;
    styles?: string;
    contexts?: string;
}

export type FrameTreeProp = Record<string, any>;
export type ActionProp = Record<string, (e: Interaction, value: any, state: FrameState, saveState: (state: FrameState) => void, api: IAPI ) => void>;
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

  export type FrameNode = {
    styles?: FrameTreeProp;
    name?: string;
    //key value for a context and a path
    contexts?: FrameTreeProp;
    props?: FrameTreeProp;
    types?: FrameTreeProp;
    propsValue?: FrameTreeProp;
    propsAttrs?: FrameTreeProp;
    actions?: FrameTreeProp;
    interactions?: FrameTreeProp;
    parentId?: string;
    ref?: string;
    type: string;
    rank?: number;
    schemaId?: string;
    icon?: string;
    id: string;
  };

  export type MDBFrame = {
    schema: SpaceTableSchema;
    cols: Property[];
    rows: MFrame[];
  };

  export type MDBFrames = { [key: string] : MDBFrame}