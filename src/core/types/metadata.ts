import i18n from "core/i18n"

export type MetadataType = 'filemeta' | 'fileprop' | 'fm'
export type Metadata = {
    field: string,
    vType: string,
    type: MetadataType,
    label: string,
}

export const pathProperties : Record<string, Metadata> = {
    'name': {
        label: i18n.metadataTypes.fileName,
        field: 'name',
        vType: 'text',
        type: 'fileprop'
    },
    'path': {
        label: i18n.metadataTypes.path,
        field: 'path',
        vType: 'text',
        type: 'fileprop'
    },
    
    'parent': {
        label: i18n.metadataTypes.folder,
        field: 'parent',
        vType: 'text',
        type: 'fileprop'
    }, 
    'sticker': {
        label: i18n.metadataTypes.sticker,
        field: 'sticker',
        vType: 'text',
        type: 'fileprop'
    },
    'color': {
        label: i18n.metadataTypes.color,
        field: 'color',
        vType: 'text',
        type: 'fileprop'
    },
    'ctime': {
        label: i18n.metadataTypes.created,
        field: 'ctime',
        vType: 'date',
        type: 'fileprop'
    },
    'mtime': {
        label: i18n.metadataTypes.lastModified,
        field: 'mtime',
        vType: 'date',
        type: 'fileprop'
    },
    'extension': {
        label: i18n.metadataTypes.extension,
        field: 'extension',
        vType: 'text',
        type: 'fileprop'
    },
    'size': {
        label: i18n.metadataTypes.size,
        field: 'size',
        vType: 'number',
        type: 'fileprop'
    }
}
export const pathCacheMetadata : Record<string, Metadata> =  {
    'tags': {
        label: i18n.metadataTypes.tags,
        field: 'tags',
        vType: 'tags-multi',
        type: 'filemeta'
    },
    'inlinks': {
        label: i18n.metadataTypes.inlinks,
        field: 'inlinks',
        vType: 'link-multi',
        type: 'filemeta'
    },
    'outlinks': {
        label: i18n.metadataTypes.outlinks,
        field: 'outlinks',
        vType: 'link-multi',
        type: 'filemeta'
    }
}