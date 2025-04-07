


export type PathCache = {
  [key: string]: any;
  metadata: Record<string, any>;
  ctime: number;
  label: PathLabel;
  contentTypes: string[];
  tags: string[];
  type: string;
  subtype: string;
  parent: string;
  readOnly: boolean;
};


export type PathLabel = {
  name: string;
  sticker: string;
  color: string;
  cover?: string;
  thumbnail?: string;
  preview?: string;
};

