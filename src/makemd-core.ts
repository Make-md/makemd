//Superstate
export { SpaceManager } from "core/spaceManager/spaceManager";
export type { IAPI as API } from "shared/types/api";
export { ISuperstate as Superstate } from "shared/types/superstate";

//Filesystem
export { FileSystemAdapter, FilesystemMiddleware } from "core/middleware/filesystem";
export type { FileCache } from "core/middleware/filesystem";
export { FileTypeAdapter } from "core/middleware/filetypes";
export type { FileTypeCache } from "core/middleware/filetypes";
export { FilesystemSpaceAdapter } from "core/spaceManager/filesystemAdapter/filesystemAdapter";
export type { AFile } from "shared/types/afile";
export type { PathLabel } from "shared/types/caches";

//UI
export { UIManager } from "core/middleware/ui";
export { default as SelectMenu } from "core/react/components/UI/Menus/menu/SelectMenu";
export { SelectOptionType } from "shared/types/menu";
export type { SelectMenuProps, SelectOption, SelectSection } from "shared/types/menu";
export type { Sticker } from "shared/types/ui";
export type { UIAdapter } from "shared/types/uiManager";

//Views
export { Explorer as FileContextView } from "core/react/components/Explorer/Explorer";
export { Backlinks } from "core/react/components/MarkdownEditor/Backlinks";
export { MarkdownHeaderView } from "core/react/components/MarkdownEditor/MarkdownHeaderView";
export { MDBViewer } from "core/react/components/MDBView/MDBViewer";
export { Navigator } from "core/react/components/Navigator/Navigator";
export { NoteView } from "core/react/components/PathView/NoteView";
export { SpaceView } from "core/react/components/SpaceView/Contexts/SpaceView";
export { SpaceFragmentViewComponent } from "core/react/components/SpaceView/Editor/EmbedView/SpaceFragmentView";
export { SpaceFragmentWrapper } from "core/react/components/SpaceView/Editor/EmbedView/SpaceFragmentWrapper";

