//i18n
export { default as i18n } from "core/i18n";

//Superstate
export { SpaceManager } from "core/spaceManager/spaceManager";
export { API } from "core/superstate/api";
export { Superstate } from "core/superstate/superstate";

//Filesystem
export { FileSystemAdapter, FilesystemMiddleware } from "core/middleware/filesystem";
export type { FileCache } from "core/middleware/filesystem";
export { FileTypeAdapter } from "core/middleware/filetypes";
export type { FileTypeCache } from "core/middleware/filetypes";
export type { AFile, PathLabel } from "core/middleware/types/afile";
export { FilesystemSpaceAdapter } from "core/spaceManager/filesystemAdapter/filesystemAdapter";

//UI
export { UIManager } from "core/middleware/ui";
export type { Sticker, UIAdapter } from "core/middleware/ui";
export { default as SelectMenu } from "core/react/components/UI/Menus/menu/SelectMenu";
export type { SelectMenuProps, SelectOption } from "core/react/components/UI/Menus/menu/SelectionMenu";

//Views
export { Explorer as FileContextView } from "core/react/components/Explorer/Explorer";
export { MDBViewer } from "core/react/components/MDBView/MDBViewer";
export { Backlinks } from "core/react/components/MarkdownEditor/Backlinks";
export { MarkdownHeaderView } from "core/react/components/MarkdownEditor/MarkdownHeaderView";
export { Navigator } from "core/react/components/Navigator/Navigator";
export { NoteView } from "core/react/components/PathView/NoteView";
export { SpaceView } from "core/react/components/SpaceView/Contexts/SpaceView";
export { SpaceFragmentViewComponent } from "core/react/components/SpaceView/Editor/EmbedView/SpaceFragmentView";
export { SpaceFragmentWrapper } from "core/react/components/SpaceView/Editor/EmbedView/SpaceFragmentWrapper";

