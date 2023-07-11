export type MetadataType = 'filemeta' | 'fileprop' | 'fm'
export type Metadata = {
    field: string,
    vType: string,
    type: MetadataType,
    label: string,
}

export const fileProps : Record<string, Metadata> = {
    'name': {
        label: 'File Name',
        field: 'name',
        vType: 'text',
        type: 'fileprop'
    },
    'path': {
        label: 'Path',
        field: 'path',
        vType: 'text',
        type: 'fileprop'
    },
    
    'parent': {
        label: 'Folder',
        field: 'parent',
        vType: 'text',
        type: 'fileprop'
    }, 
    'sticker': {
        label: 'Sticker',
        field: 'sticker',
        vType: 'text',
        type: 'fileprop'
    },
    'color': {
        label: 'Color',
        field: 'color',
        vType: 'text',
        type: 'fileprop'
    },
    'ctime': {
        label: 'Created',
        field: 'ctime',
        vType: 'date',
        type: 'fileprop'
    },
    'mtime': {
        label: 'Last Modified',
        field: 'mtime',
        vType: 'date',
        type: 'fileprop'
    },
    'extension': {
        label: 'Extension',
        field: 'extension',
        vType: 'text',
        type: 'fileprop'
    },
    'size': {
        label: 'Size',
        field: 'size',
        vType: 'number',
        type: 'fileprop'
    }
}
export const fileMeta : Record<string, Metadata> =  {
    'tags': {
        label: 'Tags',
        field: 'tags',
        vType: 'tags-multi',
        type: 'filemeta'
    },
    'inlinks': {
        label: 'Linked Mentions',
        field: 'inlinks',
        vType: 'link-multi',
        type: 'filemeta'
    },
    'outlinks': {
        label: 'Links',
        field: 'outlinks',
        vType: 'link-multi',
        type: 'filemeta'
    }
}