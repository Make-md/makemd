
export type DeleteFileOption = "trash" | "permanent" | "system-trash";
export type InlineContextLayout = "horizontal" | "vertical";

export interface MakeBasicsSettings {
  
  markSans: boolean;
  flowMenuEnabled: boolean;
  makeMenuPlaceholder: boolean;
  flowState: boolean;
  inlineStyler: boolean;
  mobileMakeBar: boolean;
  mobileSidepanel: boolean;
  inlineStylerColors: boolean;
  inlineStylerSelectedPalette: string;
  editorFlow: boolean;
  internalLinkClickFlow: boolean;
  internalLinkSticker: boolean;
  editorFlowStyle: string;
  menuTriggerChar: string;
  inlineStickerMenu: boolean;
  emojiTriggerChar: string;
  
}
