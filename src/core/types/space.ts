import i18n from "core/i18n"
import { fileSystemSpaceInfoFromFolder } from "core/spaceManager/filesystemAdapter/spaceInfo"
import { SpaceManager } from "makemd-core"

import { Filter } from "./predicate"
import { MakeMDSettings } from "./settings"
import { PathState, SpaceState } from "./superstate"



export const FMMetadataKeys = (settings: MakeMDSettings) => [ settings.fmKeyBanner, settings.fmKeySticker, settings.fmKeyColor]
export type SpaceSort = {
  field: string,
  asc: boolean,
  group: boolean
}
export type SpaceDefType = 'frontmatter' | 'fileprop' | 'filemeta'
export type SpaceDefFilter = {
    type: SpaceDefType,
    fType: string,
} & Filter
export type SpaceDefGroup = {
    type: 'any' | 'all',
    trueFalse: boolean,
    filters: SpaceDefFilter[]
}
export type SpaceType = 'folder' | 'tag' | 'vault' | 'default' | 'unknown';

export const waypointsSpace: SpaceState= {
  name: i18n.menu.waypoints,
  path: "spaces://$waypoints",
  space: null,
  type: "default",
};
  
export const tagsSpace: SpaceState= {
    name: i18n.menu.tags,
    path: "spaces://$tags",
    space: null,
    type: "default",
  };
  

  export const createHomeSpace = (manager: SpaceManager) : SpaceState  => ({
    name: i18n.menu.home,
    path: "Spaces/Home",
    space: fileSystemSpaceInfoFromFolder(manager, "Spaces/Home"),
    type: "default",
  })
  

  export const createVaultSpace  = (manager: SpaceManager) : SpaceState => ({
    name: i18n.menu.vault,
    path: "/",
    space: fileSystemSpaceInfoFromFolder(manager, "/"),
    type: "default",
  });


export const waypointsPath: PathState= {
  name: i18n.menu.waypoints,
  displayName: i18n.menu.waypoints,
  path: "spaces://$waypoints",
  label: {
    name: i18n.menu.waypoints,
    sticker: "lucide//tags",
    color: ''
  },
  type: "default",
};
  
export const tagsPath: PathState= {
    name: i18n.menu.tags,
    displayName: i18n.menu.tags,
    path: "spaces://$tags",
    label: {
      name: i18n.menu.tags,
      sticker: "lucide//tags",
      color: ''
    },
    type: "default",
  };
  

  export const homePath : PathState = {
    name: i18n.menu.home,
    displayName: i18n.menu.home,
    path: "Spaces/Home",
    label: {
      name: i18n.menu.home,
      sticker: "ui//mk-ui-home",
      color: ''
    },
    type: "default",
  }
  

  export const vaultPath: PathState = {
    name: i18n.menu.vault,
    displayName: i18n.menu.vault,
    path: "/",
    label: {
      name: i18n.menu.vault,
      sticker: "lucide//vault",
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
};
