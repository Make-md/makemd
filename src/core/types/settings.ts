
export type DeleteFileOption = "trash" | "permanent" | "system-trash";
export type InlineContextLayout = "horizontal" | "vertical";

export interface MakeMDSettings {
  newNotePlaceholder: string;
  defaultInitialization: boolean;
  filePreviewOnHover: boolean;
  blinkEnabled: boolean;
  markSans: boolean;
  flowMenuEnabled: boolean;
  makeMenuPlaceholder: boolean;
  inlineStyler: boolean;
  mobileMakeBar: boolean;
  inlineStylerColors: boolean;
  editorFlow: boolean;
  internalLinkClickFlow: boolean;
  editorFlowStyle: string;
  spacesEnabled: boolean;
  spacesDisablePatch: boolean;
  spacesPerformance: boolean;
  spaceRowHeight: number;
  spacesStickers: boolean;
  spaceViewEnabled: boolean;
  sidebarTabs: boolean;
  showRibbon: boolean;
  deleteFileOption: DeleteFileOption;
  autoOpenFileContext: boolean;
  expandFolderOnClick: boolean;
  expandedSpaces: string[];
  contextEnabled: boolean;
  saveAllContextToFrontmatter: boolean;
  activeView: string;
  activeSpace: string;
  hideFrontmatter: boolean;
  spacesFolder: string;
  spacesMDBInHidden: boolean;
  autoAddContextsToSubtags: boolean;
  folderContextFile: string;
  folderFrameFile: string;
  folderNoteInsideFolder: boolean;
  enableFolderNote: boolean;
  folderIndentationLines: boolean;
  revealActiveFile: boolean;
  menuTriggerChar: string;
  inlineStickerMenu: boolean;
  emojiTriggerChar: string;
  makerMode: boolean;
  hiddenFiles: string[];
  hiddenExtensions: string[];
  newFileLocation: string;
  newFileFolderPath: string;
  inlineContext: boolean;

  inlineBacklinks: boolean;
  defaultDateFormat: string;
  inlineBacklinksExpanded: boolean;
  inlineContextExpanded: boolean;
  inlineContextSectionsExpanded: boolean;
  dataviewInlineContext: boolean;
  inlineContextNameLayout: InlineContextLayout;
  spacesUseAlias: boolean,
  fmKeyAlias: string;
  fmKeyBanner: string;
  fmKeyColor: string;
  fmKeySticker: string;
  fmKeyContexts: string;
  fmKeyLinks: string;
  fmKeyFilter: string;
  fmKeySort: string;
  openSpacesOnLaunch: boolean;
  indexSVG: boolean;
  quickFrames: string[];
  readableLineWidth: boolean;
  waypoints: string[];

  autoMigration08: boolean;
  releaseNotesPrompt: number;
  enableDefaultSpaces: boolean;
  enableTagSpaces: boolean
  enableHomeSpace: boolean;
  showSpacePinIcon: boolean;
  minimalFix: boolean;
  experimental: boolean;
  systemName: string;
}
