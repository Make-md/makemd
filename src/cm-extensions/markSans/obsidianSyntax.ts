export type oMark = {
  mark: string;
  formatting: string;
  formatChar: string;
  altFormatting?: string;
};
export const oMarks: oMark[] = [
  {
    mark: "em",
    formatting: "formatting-em",
    altFormatting: "em_formatting_formatting-strong",
    formatChar: "*",
  },
  {
    mark: "strong",
    formatting: "formatting-strong",
    formatChar: "**",
  },
  {
    mark: "strikethrough",
    formatting: "formatting-strikethrough",
    formatChar: "~~",
  },
  {
    mark: "inline-code",
    formatting: "formatting-code",
    formatChar: "`",
  },
];

export type oBlock = {
  block: string;
  formatting: string;
  blockChar: string;
};
