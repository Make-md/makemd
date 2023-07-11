import MakeMDPlugin from "main"
import { Filter } from "./predicate"


export const FMMetadataKeys = (plugin: MakeMDPlugin) => [plugin.settings.fmKeyBanner, plugin.settings.fmKeySticker, plugin.settings.fmKeyAlias, plugin.settings.fmKeyColor]

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
export type SpaceDef = {
    type: 'focus' | 'smart'
    folder: string,
    filters: SpaceDefGroup[]
}