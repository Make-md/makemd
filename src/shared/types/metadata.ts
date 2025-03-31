import i18n from "shared/i18n"

export type MetadataType = 'filemeta' | 'fileprop' | 'fm'
export type Metadata = {
    id: string,
    field: string,
    vType: string,
    label: string,
    defaultFilter: string,
    type: string,
    description: string
}



export const labelProperties:  Metadata[] = [
    {
        id: 'label.sticker',
        label: i18n.metadataTypes.sticker,
        field: 'sticker',
        vType: 'text',
        defaultFilter: 'isEmpty',
        type: 'label',
        description: "Sticker label for the item"
    },
    {
        id: 'label.color',
        label: i18n.metadataTypes.color,
        field: 'color',
        vType: 'color',
        defaultFilter: 'equals',
        type: 'label',
        description: "Color label for the item"
    },
]

export const fileProperties :  Metadata[] = [
{
    id: 'file.name',
        label: i18n.metadataTypes.fileName,
        field: 'name',
        vType: 'text',
        defaultFilter: 'contains',
        type: 'file',
        description: "Name for a space or note"
    },
{
    id: 'file.path',
        label: i18n.metadataTypes.path,
        field: 'path',
        vType: 'link',
        defaultFilter: 'contains',
        type: 'file',
        description: "Path for a space or note"
    },
    {
        id: 'file.isFolder',
        label: i18n.metadataTypes.isFolder,
        field: 'isFolder',
        vType: 'boolean',
        defaultFilter: 'isTrue',
        type: 'file',
        description: "Is the item a folder"
    },
{
    id: 'file.parent',
        label: i18n.metadataTypes.folder,
        field: 'parent',
        vType: 'space',
        defaultFilter: 'contains',
        type: 'file',
        description: "Folder the note or space is in"
    }, 
    
{
    id: 'file.ctime',
        label: i18n.metadataTypes.created,
        field: 'ctime',
        vType: 'date',
        defaultFilter: 'isSameDate',
        type: 'file',
        description: "Creation date for the note or space"
    },
{
    id: 'file.mtime',
        label: i18n.metadataTypes.lastModified,
        field: 'mtime',
        vType: 'date',
        defaultFilter: 'isSameDate',
        type: 'file',
        description: "Last modified date for the note or space"
    },
{
    id: 'file.extension',
        label: i18n.metadataTypes.extension,
        field: 'extension',
        vType: 'text',
        defaultFilter: 'is',
        type: 'file',
        description: "File extension"
    },
{
    id: 'file.size',
        label: i18n.metadataTypes.size,
        field: 'size',
        vType: 'number',
        defaultFilter: 'lessThan',
        type: 'file',
        description: "File size"
    }
]
export const pathCacheMetadata :  Metadata[] =  [
{
    id: 'path.tags',
        label: i18n.metadataTypes.tags,
        field: 'tags',
        vType: 'tags-multi',
        defaultFilter: 'contains',
        type: 'path',
        description: "Tags for the note or space"
    },
{
    id: 'path.inlinks',
        label: i18n.metadataTypes.inlinks,
        field: 'inlinks',
        vType: 'link-multi',
        defaultFilter: 'contains',
        type: 'path',
        description: "Links to the note or space"
    },
{
    id: 'path.outlinks',
        label: i18n.metadataTypes.outlinks,
        field: 'outlinks',
        vType: 'link-multi',
        defaultFilter: 'contains',
        type: 'path',
        description: "Links from the note or space"
    }
]

