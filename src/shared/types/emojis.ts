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
  iconKey?: string; // For custom icons from asset manager
  isCustomIcon?: boolean; // Flag to distinguish custom icons from emojis
};
