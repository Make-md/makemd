import { FrameTreeProp } from "../../types/mframe";

export type Filter = {
    field: string;
    fn: string;
    value: string;
  };

  export type Predicate = {
    view: string;
    frame: string;
    frameProps: FrameTreeProp;
    frameGroup: string;
    filters: Filter[];
    sort: Sort[];
    groupBy: string[];
    colsOrder: string[];
    colsHidden: string[];
    colsSize: Record<string, number>;
  };

  export type Sort = {
    field: string;
    fn: string;
  };