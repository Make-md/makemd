import i18n from "core/i18n"
import { fileSystemSpaceInfoFromFolder } from "core/spaceManager/filesystemAdapter/spaceInfo"
import { SpaceManager } from "makemd-core"

import { Filter } from "./predicate"
import { MakeMDSettings } from "./settings"
import { PathState, SpaceState } from "./superstate"



export const FMMetadataKeys = (settings: MakeMDSettings) => [ settings.fmKeyAlias, settings.fmKeyBanner, settings.fmKeySticker, settings.fmKeyColor, settings.fmKeyBanner, settings.fmKeyBannerOffset]
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


  
export const tagsSpacePath = "spaces://$tags";
  

  
  

  export const createVaultSpace  = (manager: SpaceManager) : SpaceState => ({
    name: i18n.menu.vault,
    path: "/",
    space: fileSystemSpaceInfoFromFolder(manager, "/"),
    type: "default",
  });


export const waypointsPath: PathState= {
  name: i18n.menu.waypoints,
  readOnly: false,
  path: "spaces://$waypoints",
  label: {
    name: i18n.menu.waypoints,
    thumbnail: '',
    sticker: "ui//tags",
    color: ''
  },
  type: "default",
};
  
export const tagsPath: PathState= {
    name: i18n.menu.tags,
    readOnly: false,
    path: "spaces://$tags",
    label: {
      thumbnail: '',
      name: i18n.menu.tags,
      sticker: "ui//tags",
      color: ''
    },
    type: "default",
  };
  

  

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
};
