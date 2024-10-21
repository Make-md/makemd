import { Metadata, fileProperties, labelProperties, pathCacheMetadata } from "core/types/metadata"
import { Superstate, i18n } from "makemd-core"
import { fieldTypeForField } from "schemas/mdb"

export const allMetadata = (superstate: Superstate) : Record<string, {
    name: string,
    properties: Metadata[]
}> => ({
    label: { 
        name: i18n.metadataTypes.label,
        properties: labelProperties
    },
    file: {
        name: i18n.metadataTypes.fileMetadata,
        properties: fileProperties
    },
    path: {
        name: i18n.metadataTypes.outlinks,
        properties: pathCacheMetadata
    },
    frontmatter: {
        name: i18n.metadataTypes.frontmatter,
        properties: superstate.spaceManager.keysForCacheType("frontmatter").map(f => ({
            id: 'frontmatter.' + f,
            label: f,
        field: f,
        vType: 'any',
        defaultFilter: 'contains',
        type: 'frontmatter',
        description: "Frontmatter property"
        }))
    },
    context: {
        name: i18n.metadataTypes.contexts,
        properties: [...superstate.contextsIndex.values()].flatMap(f => f?.contextTable?.cols.filter(f => f.primary != "true").map(g => ({
            id: 'contexts.' + f.path + '.' + g.name,
            label: g.name,
        field: f.path+ '.' + g.name,
        vType: fieldTypeForField(g),
        defaultFilter: 'contains',
        type: 'context',
        description: f.path + " context property"
        })))
    }
})