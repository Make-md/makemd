
export type DeleteFileOption = "trash" | "permanent" | "system-trash";
export type InlineContextLayout = "horizontal" | "vertical";

export interface MakeMDPluginSettings {
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
  sidebarTabs: boolean;
  showRibbon: boolean;
  deleteFileOption: DeleteFileOption;
  autoOpenFileContext: boolean;
  expandedFolders: Record<string, string[]>;
  collapsedTags: string[];
  expandedSpaces: string[];
  contextEnabled: boolean;
  saveAllContextToFrontmatter: boolean;
  openFolders: string[];
  fileIcons: [string, string][];
  cachedSpaces: string[];
  activeView: string;
  activeSpace: string;
  hideFrontmatter: boolean;
  tagContextFolder: string;
  folderContextFile: string;
  folderNoteInsideFolder: boolean;
  enableFolderNote: boolean;
  folderNoteDefaultView: boolean;
  folderIndentationLines: boolean;
  revealActiveFile: boolean;
  spacesCompactMode: boolean;
  menuTriggerChar: string;
  inlineStickerMenu: boolean;
  emojiTriggerChar: string;
  makerMode: boolean;
  hiddenFiles: string[];
  hiddenExtensions: string[];
  newFileLocation: string;
  newFileFolderPath: string;
  inlineContext: boolean;
  lineNumbers: boolean;
  inlineBacklinks: boolean;
  defaultDateFormat: string;
  inlineBacklinksExpanded: boolean;
  inlineContextExpanded: boolean;
  inlineContextSectionsExpanded: boolean;
  dataviewInlineContext: boolean;
  inlineContextNameLayout: InlineContextLayout;
  spacesSyncLastUpdated: string;
  spacesSyncTimeoutSeconds: number;
  spacesAutoBackup: boolean,
  spacesAutoBackupInterval: number,
  spacesAutoBackupLast: number,
  spacesUseAlias: boolean,
  precreateVaultSpace: boolean,
  fmKeyAlias: string;
  fmKeyBanner: string;
  fmKeyColor: string;
  fmKeySticker: string;
  openSpacesOnLaunch: boolean;
  stickerSVG: boolean;
  stickerEmoji: boolean;
  stickerIcon: boolean;
}
