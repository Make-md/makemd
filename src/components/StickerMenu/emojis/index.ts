export type EmojiData = Record<
  string,
  {
    n: [string, string];
    u: string;
    v?: string[];
  }[]
>;

export type Emoji = {
  label: string;
  desc: string;
  unicode: string;
  variants?: string[];
};
