import i18n from "core/i18n"
import { fileSystemSpaceInfoFromFolder } from "core/spaceManager/filesystemAdapter/spaceInfo"
import { SpaceManager } from "makemd-core"


import { Filter } from "./predicate"
import { MakeMDSettings } from "./settings"
import { PathState, SpaceState } from "./superstate"



export const FMMetadataKeys = (settings: MakeMDSettings) => [settings.fmKeyBanner, settings.fmKeySticker, settings.fmKeyColor, settings.fmKeyBanner, settings.fmKeyBannerOffset,
  spaceContextsKey, spaceFilterKey, spaceLinksKey, spaceSortKey, spaceTemplateKey, spaceTemplateNameKey
]
export type SpaceSort = {
  field: string,
  asc: boolean,
  group: boolean
}

export type SpaceDefFilter = {
    type: string,
    fType: string,
} & Filter
export type SpaceDefGroup = {
    type: 'any' | 'all',
    trueFalse: boolean,
    filters: SpaceDefFilter[]
}
export type SpaceType = 'folder' | 'tag' | 'vault' | 'default' | 'unknown';


  export const builtinSpacePathPrefix = "spaces://$";
export const tagsSpacePath = "spaces://$tags";
  

  
  

  export const createVaultSpace  = (manager: SpaceManager) : SpaceState => ({
    name: i18n.menu.vault,
    path: "/",
    space: fileSystemSpaceInfoFromFolder(manager, "/"),
    type: "default",
  });



  


  

  export const vaultPath: PathState = {
    name: i18n.menu.vault,
    readOnly: false,
    path: "/",
    label: {
      thumbnail: '',
      name: i18n.menu.vault,
      sticker: "ui//vault",
      color: ''
    },
    type: "default",
  };


export type SpaceDefinition = {
  contexts?: string[];
  sort?: { field: string; asc: boolean; group: boolean; };
  filters?: SpaceDefGroup[];
  links?: string[];
  tags?: string[];
  template?: string;
  templateName?: string;
  recursive?: string;
};

export type BuiltinSpace = {
  name: string;
  icon: string;
  readOnly: boolean;
  hidden: boolean;
}

export const builtinSpaces : Record<string, BuiltinSpace> = {
  tags: {
    name: "Tags",
    icon: "ui//tags",
    readOnly: false,
    hidden: false
  },
  overview: {
    name: "Overview",
    icon: "ui//overview",
    readOnly: true,
    hidden: true
  },
};

export const spaceContextsKey = "_contexts";
export const spaceTemplateKey = "_template";
export const spaceTemplateNameKey = "_templateName";
export const spaceFilterKey = "_filters";
export const spaceLinksKey = "_links";
export const spaceSortKey = "_sort";
export const spaceRecursiveKey = "_subfolders";

