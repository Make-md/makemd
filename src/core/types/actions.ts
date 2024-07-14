export type ActionTree = {
  action: string;
  result?: string;
  linked?: { [key: string]: string };
  props: { [key: string]: any };
  propsValue: { [key: string]: any };
  children: ActionTree[];
};

export type ActionInstance = {
  props: { [key: string]: any };
  instanceProps: { [key: string]: any };
  result?: any;
  iterations: number;
  error?: any;
};
