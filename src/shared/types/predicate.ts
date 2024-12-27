

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
    listViewProps: Record<string, any>;
    listItemProps: Record<string, any>;
    listGroupProps: Record<string, any>;
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