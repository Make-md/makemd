
export const emojiFromString = (emoji: string) => {
  let html;
  try {
    html = unifiedToNative(emoji);
  }
  catch {
    html = emoji;
  }
  return html;
};

export function parseStickerString(input: string): [string, string] {
  if (!input) {
    return ["", ""];
  }
  const match = input.match(/^(.*?)\s*\/\/\s*(.*)$/);
  if (match) {
    return [match[1], match[2]];
  } else {
    return ["", input];
  }
}
export const unifiedToNative = (unified: string) => {
  const unicodes = unified.split("-");
  const codePoints = unicodes.map((u) => `0x${u}`);
  // @ts-ignore
  return String.fromCodePoint(...codePoints);
};
export const nativeToUnified = (native: string) => native.codePointAt(0).toString(16);

