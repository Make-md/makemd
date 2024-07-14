import { FrameTreeProp } from "../../types/mframe";

export type Filter = {
    field: string;
    fn: string;
    value: string;
    fType: string;
  };

  export type Predicate = {
    view: string;
    
    listView: string;
    listItem: string;
    listGroup: string;
    listViewProps: FrameTreeProp;
    listItemProps: FrameTreeProp;
    listGroupProps: FrameTreeProp;
    filters: Filter[];
    sort: Sort[];
    groupBy: string[];

    colsOrder: string[];
    colsHidden: string[];
    colsSize: Record<string, number>;
    colsCalc: Record<string, string>;
  };

  export type Sort = {
    field: string;
    fn: string;
  };