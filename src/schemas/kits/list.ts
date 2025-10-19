import i18n from "shared/i18n";


import { frameRootWithProps, kitWithProps } from "core/utils/frames/frames";
import { FrameRoot } from "shared/types/mframe";
import { contentNode, dataNode, flowNode, groupNode, iconNode, imageNode, inputNode, textNode } from "./base";
import { deltaNode, slideNode, slidesNode } from "./slides";
import { checkboxNode, listItemNode, listNode, previewNode } from "./ui";

export const fieldsView : FrameRoot = {
  id: 'fieldsView',
  def: {
    id: 'fieldsView',
  },
  node: {
    schemaId: 'fieldsView',
    parentId: "",
    name: i18n.menu.properties,
    rank: 0,
    id: 'fieldsView',
    type: 'group',
    props: {
      label: 'true',
      sticker: 'true'
    },
    types: {
      label: 'boolean',
      sticker: 'boolean'
    }
  },
  children: [frameRootWithProps({...listNode(), children: [
    frameRootWithProps({...listItemNode(), children: [
      frameRootWithProps(dataNode, {
        field: 'listItem.props.value',
        value: '$contexts[listItem.props.value.table?.length > 0 ? listItem.props.value.table : $contexts.$context._path]?.[listItem.props.value.name]'
      }, {
        '--mk-label': `$root.props.label`,
        '--mk-sticker': `$root.props.sticker`
      })
    ]}, {}, {
      layout: `'row'`,
      gap: `'8px'`,
      hidden: '!($contexts[listItem.props.value.table?.length > 0 ? listItem.props.value.table : $contexts.$context._path]?.[listItem.props.value.name]?.length > 0)'
    })
  ]}, {
    value: `$contexts.$context._properties?.filter(f => f.primary != 'true' && !f.type.startsWith('object')) ?? []`
  }, {
    layout: `'column'`,
    gap: `'8px'`
  })]
}
export const coverListItem: FrameRoot = {
  def: {
    id: 'coverListItem',
      type: 'listItem'
  },
  node: {
    type: "group",
    id: "$root",
    schemaId: "$root",
    name: "Cover Item",
    rank: 0,
    props: {
        coverProperty: `'File'`
    },
    types: {
      // hideCover: "boolean",
      coverProperty: "option"
    },
    propsValue: {
      coverProperty: {
        alias: "Cover Image",
        source: `$properties`
      }
    },
    styles: {
      layout: `"column"`,
      width: `'200px'`,
      sem: `'contextItem'`,
      hidden: `($api.path.thumbnail($contexts[$contexts.$context['_path']]?.[$root.props.coverProperty]) ?? $contexts.$context['_values']?.[$root.props.coverProperty] ?? '').length == 0`
    },
    
  },
  id: "$root",
  children: [
    frameRootWithProps(
       {...groupNode, children: [frameRootWithProps(
        imageNode,
        {
          value: `$api.path.thumbnail($contexts[$contexts.$context['_path']]?.[$root.props.coverProperty]) ?? $contexts.$context['_values']?.[$root.props.coverProperty]`,
        },
        {
          width: `'200px'`,
          height: `'300px'`,
          borderRadius: `'8px'`,
        }
    )]},
      {
      }, {
        background: `'var(--mk-ui-background-contrast)'`,
        borderRadius: `'8px'`,
        width: `'200px'`,
      height: `'300px'`
      }
      
    ),
    frameRootWithProps(
      flowNode,
      {
        value: `$contexts.$context['_keyValue']`,
      },
      {
        padding:`'4px'`,
      })
    
  ],
}
export const imageListItem: FrameRoot = {
  def: {
    id: 'imageListItem',
      type: 'listItem'
  },
  node: {
    type: "group",
    id: "$root",
    schemaId: "$root",
    name: "Image Item",
    rank: 0,
    props: {
        coverProperty: `'File'`,
        _selected: `$root.props['_selectedIndexes']?.some(f => f == $contexts.$context['_index'])`,
        _selectedIndexes: '[]',
        
    },
    types: {
      // hideCover: "boolean",
      coverProperty: "option"
    },
    propsValue: {
      coverProperty: {
        alias: "Cover Image",
        source: `$properties`
      }
    },
    
    styles: {
      layout: `"row"`,
      boxShadow: `'var(--mk-shadow-card)'`,
      margin: `'2px'`,
      marginBottom: `'8px'`,
      borderRadius: `'8px'`,
      sem: `'contextItem'`,
      hidden: `($api.path.thumbnail($contexts[$contexts.$context['_path']]?.[$root.props.coverProperty]) ?? $contexts.$context['_values']?.[$root.props.coverProperty] ?? '').length == 0`
      
    },
    interactions: {
      onClick: 'select',
      onDoubleClick: 'open',
      onContextMenu: 'contextMenu',
    },
  },
  id: "$root",
  children: [
    
    frameRootWithProps(
      imageNode,
      {
        value: `$api.path.thumbnail($contexts[$contexts.$context['_path']]?.[$root.props.coverProperty]) ?? $contexts.$context['_values']?.[$root.props.coverProperty]`,
      }, {
        borderRadius: `'8px'`,
      }
      
    ),
    frameRootWithProps(
      {...groupNode, children: [
        
      
      
      {
        ...groupNode,
        node: {
          ...groupNode.node,
          styles: {
            gap: `'8px'`,
            padding: `'8px'`,
            flex: `'1'`,
            width: `'100%'`,
            background: `'var(--mk-gradient-overlay)'`
          },
        },
        children: [
          frameRootWithProps(
        {...groupNode, children: [frameRootWithProps(
          iconNode,
          {
            value: `$api.path.label($contexts.$context['_keyValue'])?.sticker`,
          },
          {
            width: `'32px'`,
            height: `'32px'`,
            padding: `'4px'`,
            "--icon-size": `'24px'`,
            borderRadius: `'4px'`,
            overflow: `'hidden'`,
              background: `$api.path.label($contexts.$context['_keyValue'])?.color`,
            
          }
        ),
        

        ]},
        {},
        {
          width: `'32px'`,
            height: `'32px'`,
          hidden: `!$contexts.$context['_isContext']`,
          marginLeft: `'4px'`,
          borderRadius: `'4px'`,
          background: `'var(--mk-ui-background-contrast)'`,
          // hidden: `$root.props.hideCover`
        }
      ),
          frameRootWithProps(
            textNode,
            {
                            value: `$contexts.$context['_name']`,

            },
            {
              "--font-text-weight": `'var(--bold-weight)'`,
            }
          ),
         
        ],
      },
      ]},
      {

      },
      {
        position: `'absolute'`,
        height: `'100%'`,
        width: `'100%'`,
        "hover:opacity": `'1'`,
        opacity: `'0'`,
        transition: `'all 0.2s ease'`
      }
    )
    
  ],
}

export const flowListItem: FrameRoot = {
    def: {
      id: 'flowListItem',
        type: 'listItem'
    },
    node: {
      type: "group",
      id: "$root",
      schemaId: "$root",
      name: "Flow Item",
      rank: 0,
      props: {
        _selected: `$root.props['_selectedIndexes']?.some(f => f == $contexts.$context['_index'])`,
        _selectedIndexes: '[]',
        expanded: 'true',
        seamless: 'false'
      },
      types: {
        expanded: 'boolean',
        seamless: 'boolean'
      },
      propsValue: {
        expanded: {
          alias: i18n.labels.expanded,
        },
        seamless: {
          alias: "Seamless",
        }
      },
      styles: {
        layout: `"row"`,
        gap: `'8px'`,
        sem: `'contextItem'`
      },
      actions: {
        
      },
    },
    id: "$root",
    children: [
      
      frameRootWithProps(
        flowNode,
        {
          value: `$contexts.$context['_keyValue']`,
        },
        {
          "--mk-expanded": `$root.props.expanded`,
          "--mk-min-mode": `$root.props.seamless`,
          padding:`'4px'`,
          marginBottom: `'8px'`
        }
        
      ),
      
    ],
  };


  export const cardsListItem: FrameRoot = {
    def: {
      id: 'cardsListItem',
        type: 'listItem'
    },
    node: {
      type: "group",
      id: "$root",
      schemaId: "$root",
      name: "Cards Item",
      rank: 0,
      props: {
        _selected: `$root.props['_selectedIndexes']?.some(f => f == $contexts.$context['_index'])`,
        _selectedIndexes: '[]',
        // hideCover: `false`,
        coverProperty: `'File'`,
        showLabel: 'true',
        showSticker: 'false'
      },
      types: {
        // hideCover: "boolean",
        coverProperty: "option",
        showLabel: "boolean",
        showSticker: "boolean"
      },
      
      propsValue: {
        coverProperty: {
          alias: "Cover Image",
          source: `$properties`
        },
        showLabel: {
          alias: i18n.labels.showFieldLabels
        },
        showSticker: {
          alias: i18n.labels.showFieldIcons
        }
      },

      styles: {
        layout: `"column"`,
        overflow: `'hidden'`,
        width: `'100%'`,
        height: `'100%'`,
        padding: `'0'`,
        sem: `'card'`
      },
      interactions: {
      onClick: 'select',
      onDoubleClick: 'open',
      onContextMenu: 'contextMenu',
    },
    },
    id: "$root",
    children: [
      frameRootWithProps(
        {
          ...slidesNode,
          children: [
            frameRootWithProps(
              {
                ...slideNode,
                children: [
                  frameRootWithProps(
                    { ...deltaNode, node: { ...deltaNode.node, ref: "$root" } },
                    {},
                    {
                      sem: `'card-selected'`,
                    }
                  ),
                ],
              },
              { value: "true" }
            ),
            frameRootWithProps(
              {
                ...slideNode,
                children: [
                  frameRootWithProps(
                    { ...deltaNode, node: { ...deltaNode.node, ref: "$root" } },
                    {},
                    {
                      sem: `'card'`,
                    }
                  ),
                ],
              },
              { value: "false" }
            ),
          ],
        },
        {
          value: `'_selected'`,
        }
      ),
      
      frameRootWithProps(
        {...groupNode, children: [frameRootWithProps(
          imageNode,
          {
            
            value: `$api.path.label($contexts[$contexts.$context['_path']]?.[$root.props.coverProperty])?.cover ?? $contexts.$context['_values']?.[$root.props.coverProperty]`,
          },
          {
            width: `'100%'`,
            height: `'80px'`,
            
          }
        ),
        

        ]},
        {},
        {
          width: `'100%'`,
          height: `'80px'`,
          background: `'var(--mk-ui-background-contrast)'`,
          hidden: `!$contexts.$context['_isContext']`,
        }
      ),
      frameRootWithProps(
        {...groupNode, children: [frameRootWithProps(
          iconNode,
          {
            value: `$api.path.label($contexts.$context['_keyValue'])?.sticker`,
          },
          {
            width: `'32px'`,
            height: `'32px'`,
            padding: `'4px'`,
            "--icon-size": `'24px'`,
            borderRadius: `'4px'`,
            overflow: `'hidden'`,
              background: `$api.path.label($contexts.$context['_keyValue'])?.color`,
            
          }
        ),
        

        ]},
        {},
        {
          width: `'32px'`,
            height: `'32px'`,
          hidden: `!$contexts.$context['_isContext']`,
          marginTop: `'-16px'`,
          marginLeft: `'4px'`,
          borderRadius: `'4px'`,
          background: `'var(--mk-ui-background-contrast)'`,
          // hidden: `$root.props.hideCover`
        }
      ),
      
      
      {
        ...groupNode,
        node: {
          ...groupNode.node,
          styles: {
            gap: `'8px'`,
            padding: `'8px'`,
            flex: `'1'`,
          },
        },
        children: [
          frameRootWithProps(
            textNode,
            {
                            value: `$contexts.$context['_name']`,

            },
            {
              "--font-text-weight": `'var(--bold-weight)'`,
            }
          ),
          kitWithProps(fieldsView, {
            label: `$root.props.showLabel`,
            sticker: `$root.props.showSticker`
          }, {marginTop: `'8px'`})
        ],
      },
    ],
  };
  
  export const cardListItem: FrameRoot = {
    def: {
      id: 'cardListItem',
        type: 'listItem'
    },
    node: {
      type: "group",
      id: "$root",
      schemaId: "$root",
      name: "Card Item",
      rank: 0,
      props: {
        _selected: `$root.props['_selectedIndexes']?.some(f => f == $contexts.$context['_index'])`,
        _selectedIndexes: '[]',
        showLabel: 'true',
        showSticker: 'false'
      },
      types: {
        showLabel: "boolean",
        showSticker: "boolean"
      },
      propsValue: {
        showLabel: {
          alias: i18n.labels.showFieldLabels
        },
        showSticker: {
          alias: i18n.labels.showFieldIcons
        }
      },
      styles: {
        layout: `"column"`,
        overflow: `'hidden'`,
        borderRadius: `'8px'`,
        width: `'100%'`,
        border: `'1px solid var(--mk-ui-border)'`,
        sem: `'contextItem'`
      },
      
      interactions: {
      onClick: 'select',
      onDoubleClick: 'open',
      onContextMenu: 'contextMenu',
    },
    },
    id: "$root",
    children: [
      frameRootWithProps(
        {
          ...slidesNode,
          children: [
            frameRootWithProps(
              {
                ...slideNode,
                children: [
                  frameRootWithProps(
                    { ...deltaNode, node: { ...deltaNode.node, ref: "$root" } },
                    {},
                    {
                      background: `'var(--mk-ui-background-selected)'`,
                    }
                  ),
                ],
              },
              { value: "true" }
            ),
            frameRootWithProps(
              {
                ...slideNode,
                children: [
                  frameRootWithProps(
                    { ...deltaNode, node: { ...deltaNode.node, ref: "$root" } },
                    {},
                    {
                      background: `'var(--mk-ui-background)'`,
                    }
                  ),
                ],
              },
              { value: "false" }
            ),
          ],
        },
        {
          value: `'_selected'`,
        }
      ),
      frameRootWithProps(
        imageNode,
        {
          value: `$api.path.label($contexts.$context['_keyValue'])?.cover`,
        },
        {
          width: `'100%'`,
          maxHeight: `'80px'`,
          
        }
      ),
      
      {
        ...groupNode,
        node: {
          ...groupNode.node,
          styles: {
            layout: `'column'`,
            gap: `'8px'`,
            padding: `'8px'`,
            flex: `'1'`,
          },
        },
        children: [
          frameRootWithProps(
            textNode,
            {
              value: `$contexts.$context['_name']`,
            },
            
          ),
          kitWithProps(fieldsView, {
            label: `$root.props.showLabel`,
            sticker: `$root.props.showSticker`
          })
        ],
      },
    ],
  };

  export const listItem: FrameRoot = {
    def: {
      id: 'rowItem',
        type: 'listItem'
    },
    node: {
      type: "group",
      id: "$root",
      schemaId: "$root",
      name: "List View",
      rank: 0,
      props: {
        _selected: `$root.props._selectedIndexes?.some(f => f == $contexts.$context['_index'])`,
        previewField: `'Created'`,
        prefixField: ``,
        subtitleField: ``,
        _selectedIndexes: '[]',
      },
      styles: {
        layout: `"row"`,
        gap: `'12px'`,
        sem: `'listItem'`,
        padding: `'4px'`,
        overflow: `'hidden'`,
        width: `'100%'`,
        layoutAlign: `'n'`,
      },
      interactions: {
      onClick: 'select',
      onDoubleClick: 'open',
      onContextMenu: 'contextMenu',
    },
      types: {
        previewField: "option",
        prefixField: "option",
        subtitleField: "option",
      },
      propsValue: {
        previewField: {
          alias: i18n.labels.status,
          source: `$properties`
        },
        subtitleField: {
          alias: i18n.labels.subtitle,
          source: `$properties`
        },
        prefixField: {
          alias: i18n.labels.prefix,
          source: `$properties`
        }
      },
    },
    id: "$root",
    children: [
      frameRootWithProps(
        {
          ...slidesNode,
          children: [
            frameRootWithProps(
              {
                ...slideNode,
                children: [
                  frameRootWithProps(
                    { ...deltaNode, node: { ...deltaNode.node, ref: "$root" } },
                    {},
                    {
                      sem: `'listItem-selected'`,
                    }
                  ),
                ],
              },
              { value: "true" }
            ),
            frameRootWithProps(
              {
                ...slideNode,
                children: [
                  frameRootWithProps(
                    { ...deltaNode, node: { ...deltaNode.node, ref: "$root" } },
                    {},
                    {
                      sem: `'listItem'`,
                    }
                  ),
                ],
              },
              { value: "false" }
            ),
          ],
        },
        {
          value: `'_selected'`,
        }
      ),
      frameRootWithProps(
        {...groupNode, children: [frameRootWithProps(dataNode, {
            field: `$contexts.$context._properties?.find(f => f.name == $root.props['prefixField'])`,
            value: `$contexts[$contexts.$context['_path']]?.[$root.props.prefixField]`,
          }, {
            "--font-text-size": `'12px'`,
            "--font-text-color": `'var(--mk-ui-text-tertiary)'`,
          }),]}, {}, {
            width: `'120px'`,
            hidden: `!($root.props.prefixField?.length > 0)`,
            height: `'32px'`,
            layout: `'row'`,
            layoutAlign: `'w'`
          }
      ),
      
      kitWithProps(previewNode(), {
        path: `$contexts.$context['_keyValue']`,
        width: `'32px'`,
        height: `'32px'`,
        padding: `'8px'`,
        radius: `'4px'`
      }, {
        borderRadius: `'4px'`,
        background: `'var(--background-secondary)'`,
        hidden:  `!$contexts.$context['_isContext']`,

      }
      ),
      {
        ...groupNode,
        node: {
          ...groupNode.node,
          styles: {
            flex: `'1'`,
            layout: `'column'`,
            layoutAlign: `'w'`,
            height: `'auto'`
          },
        },
        children: [
          {
            ...groupNode,
            node: {
              ...groupNode.node,
              styles: {
                gap: `'8px'`,
                layout: `'row'`,
                layoutAlign: `'w'`,
                height: `'32px'`,
                width: `'100%'`,
              },
            },
            children:[
          frameRootWithProps(
            textNode,
            {
              value: `$contexts.$context['_name']`,
            },
            {
              "--font-text-size": `'16px'`,
              "--font-text-weight": `'var(--bold-weight)'`,
              width: `'auto'`
            }
          ),
          frameRootWithProps(groupNode, {}, {
            "flex": `'1'`,
            height: `'auto'`,
          }),
          frameRootWithProps(dataNode, {
            field: `$contexts.$context._properties?.find(f => f.name == $root.props['previewField'])`,
            value: `$contexts[$contexts.$context['_path']]?.[$root.props.previewField]`,
          }, {
            "--font-text-color": `'var(--mk-ui-text-tertiary)'`,
          }),
        ],
      }, frameRootWithProps(dataNode, {
            field: `$contexts.$context._properties?.find(f => f.name == $root.props['subtitleField'])`,
            value: `$contexts[$contexts.$context['_path']]?.[$root.props.subtitleField]`,
          }, {
            "--font-text-color": `'var(--mk-ui-text-tertiary)'`,
            "--font-text-size": `'12px'`
          }),],
      },
      
    ],
  }

export const taskListItem = () : FrameRoot => ({
  def: {
    id: 'taskListItem',
    type: 'listItem',
  },
  node: {
    type: 'group',
    id: '$root',
    schemaId: '$root',
    name: 'Task Item',
    rank: 0,
    props: {
      _selected: `$root.props['_selectedIndexes']?.some(f => f == $contexts.$context['_index'])`,
      _selectedIndexes: '[]',
      _expanded: `false`,
      _nestBy: ``,
      completedField: `'completed'`,
      dueField: `'due'`,
      priorityField: `'priority'`,
      fields: ``,
      list: ``
    },
    styles: {
      layout: `"column"`,
      overflow: `'hidden'`,
      width: `'100%'`,
      layoutAlign: `'w'`,
      alignItems: `'stretch'`,
    },
    types: {
      completedField: 'option',
      dueField: 'option',
      priorityField: 'option',
      _nestBy: 'text',
      _expanded: 'boolean',
      _selected: 'boolean',
      fields: 'option-multi',
      list: 'option'
    },
    propsValue: {
      completedField: {
        alias: i18n.labels.completed,
        source: `$properties`,
      },
      dueField: {
        alias: i18n.labels.due,
        source: `$properties`,
      },
      list: {
        alias: i18n.labels.list,
        source: `$properties`,
      },
      fields: {
        alias: i18n.labels.fields,
        source: `$properties`,
      },
      priorityField: {
        alias: i18n.labels.priority,
        source: `$properties`,
      }
    },
    interactions: {
      onClick: 'select',
      onDoubleClick: 'open',
      onContextMenu: 'contextMenu',
    }
  },
  id: '$root',
  children: [
    {
      ...groupNode,
      node: {
        ...groupNode.node,
        id: '$item',
        styles: {
          layout: `'row'`,
          gap: `'8px'`,
          flex: `'1'`,
          padding: `'4px'`,
          layoutAlign: `'w'`,
          height: `'auto'`,
          background: `'transparent'`,
          borderRadius: `'4px'`,
        }
      },
      children: [
        kitWithProps(
          checkboxNode(),
          {
            value: `$contexts.$context['_path']?.[$root.props.completedField]`,
          },
          {},
          {
            toggle: `$api.table.update($contexts.$context['_path'], $contexts.$context['_schema'], [{field: '_index', value: $contexts.$context['_index']}], { [$root.props.completedField]: $contexts.$context['_path']?.[$root.props.completedField] ? 'false' : 'true' })`,
          },
          {
            onClick: 'toggle'
          }
        ),
        {
          ...groupNode,
          node: {
            ...groupNode.node,
            styles: {
              layout: `'column'`,
              flex: `'1'`,
            }
          },
          children: [
            {
              ...groupNode,
              node: {
                ...groupNode.node,
                styles: {
                  layout: `'row'`,
                  gap: `'8px'`,
                  alignItems: `'center'`,
                }
              },
              children: [
                frameRootWithProps(
                  textNode,
                  {
                    value: `$contexts.$context['_name']`,
                  },
                  {
                    '--font-text-size': `'14px'`,
                    '--font-text-weight': `'400'`,
                    width: `'auto'`,
                  }
                ),
                frameRootWithProps(groupNode, {}, {
                  flex: `'1'`,
                }),
                frameRootWithProps(
                  flowNode,
                  {
                    value: `$contexts.$context['_path']?.[$root.props.list]`,
                  },
                  {
                    padding: `'0'`,
                    width: `'auto'`,
                    "--mk-link": `true`,
                  }
                ),
                frameRootWithProps(
                  iconNode,
                  {
                    value: `'ui//collapse'`,
                  },
                  {
                    width: `'20px'`,
                    height: `'20px'`,
                    padding: `'4px'`,
                    '--icon-size': `'12px'`,
                    transform: `$root.props['_expanded'] ? 'rotate(90deg)' : ''`,
                    hidden: `!($root.props['_nestBy']?.length > 0)`,
                  },
                  {
                    expand: `$saveState({ $root: {props: {_expanded: !$root.props['_expanded']}} });`,
                  },
                  {
                    onClick: 'expand'
                  }
                )
              ]
            }
          ]
        },
        {
          ...groupNode,
          node: {
            ...groupNode.node,
            styles: {
              layout: `'row'`,
              padding: `'2px 4px'`,
              layoutAlign: `'w'`,
              borderRadius: `'4px'`,
              height: `'auto'`,
              width: `'auto'`,
              hidden: `!($contexts[$contexts.$context['_path']]?.[$root.props.dueField]?.length > 0)`,
              background: `'var(--mk-ui-active)'`,
            }
          },
          children: [
            frameRootWithProps(
              textNode,
              {
                value: `$api.utils.date.format($api.utils.date.parse($contexts.$context['_path']?.[$root.props.dueField]))`,
              },
              {
                '--font-text-size': `'12px'`,
                '--font-text-weight': `'400'`,
                width: `'auto'`,
              }
            )
          ]
        }
      ]
    },
    frameRootWithProps(
      contentNode,
      {},
      {
        layout: `'column'`,
        alignItems: `'stretch'`,
        width: `'100%'`,
      }
    ),
    frameRootWithProps(
      {
        ...slidesNode,
        children: [
          frameRootWithProps(
            {
              ...slideNode,
              children: [
                frameRootWithProps(
                  { ...deltaNode, node: { ...deltaNode.node, ref: '$item' } },
                  {},
                  {
                    background: `'var(--mk-ui-background-selected)'`,
                  }
                )
              ]
            },
            { value: 'true' }
          ),
          frameRootWithProps(
            {
              ...slideNode,
              children: [
                frameRootWithProps(
                  { ...deltaNode, node: { ...deltaNode.node, ref: '$item' } },
                  {},
                  {
                    background: `'transparent'`,
                  }
                )
              ]
            },
            { value: 'false' }
          )
        ]
      },
      {
        value: `'_selected'`,
      }
    )
  ]
});

  export const overviewItem: FrameRoot = {
    def: {
      id: 'overviewItem',
        type: 'listItem'
    },
    node: {
      type: "group",
      id: "$root",
      schemaId: "$root",
      name: "Overview Item",
      rank: 0,
      props: {
        _selected: `$root.props['_selectedIndexes']?.some(f => f == $contexts.$context['_index'])`,
        _selectedIndexes: '[]',
      },
      styles: {
        layout: `"row"`,
        gap: `'12px'`,
        padding: `'8px'`,
        overflow: `'hidden'`,
        width: `'100%'`,
        borderBottom: `'thin solid var(--mk-ui-border)'`,
        sem: `'contextItem'`
      },
      interactions: {
      onClick: 'select',
      onDoubleClick: 'open',
      onContextMenu: 'contextMenu',
    },
    },
    id: "$root",
    children: [
      frameRootWithProps(
        {
          ...slidesNode,
          children: [
            frameRootWithProps(
              {
                ...slideNode,
                children: [
                  frameRootWithProps(
                    { ...deltaNode, node: { ...deltaNode.node, ref: "$root" } },
                    {},
                    {
                      background: `'var(--mk-ui-background-selected)'`,
                    }
                  ),
                ],
              },
              { value: "true" }
            ),
            frameRootWithProps(
              {
                ...slideNode,
                children: [
                  frameRootWithProps(
                    { ...deltaNode, node: { ...deltaNode.node, ref: "$root" } },
                    {},
                    {
                      background: `'transparent'`,
                    }
                  ),
                ],
              },
              { value: "false" }
            ),
          ],
        },
        {
          value: `'_selected'`,
        }
      ),
      {
        ...groupNode,
        node: {
          ...groupNode.node,
          styles: {
            gap: `'8px'`,
            flex: `'1'`,
            padding: `'2px'`,
            layout: `'column'`,
            overflow: `'hidden'`
          },
        },
        children: [
          frameRootWithProps({...groupNode, children: [
            frameRootWithProps(
              iconNode,
              {
                value: `$api.path.label($contexts.$context['_keyValue'])?.sticker`,
              },
              {
                width: `'20px'`,
                height: `'20px'`,
                padding: `'2px'`,
                "--icon-size": `'14px'`,
                borderRadius: `'4px'`,
                overflow: `'hidden'`,
                  background: `$api.path.label($contexts.$context['_keyValue'])?.color`,
    
              }
            ),
            frameRootWithProps(
              textNode,
              {
                value: `$contexts.$context['_name']`,
              },
              {
                "--font-text-size": `'14px'`,
                "--font-text-weight": `'var(--bold-weight)'`,
              }
            ),
          ]}, {}, {
            layout: `"row"`,
            height: `'auto'`,
            width: `'auto'`,
            gap: `'4px'`

      }),
          
      
          frameRootWithProps(textNode, {
            value: `$api.path.label($contexts.$context['_keyValue'])?.preview`,
          }, {
            "--font-text-size": `'14px'`,
            "--font-text-color": `'var(--mk-ui-text-tertiary)'`,
            "--line-count": '2'
          }),
        ],
      },
      frameRootWithProps(
        imageNode,
        {
          value: `$api.path.label($contexts.$context['_keyValue'])?.cover`,
        }, {
          radius: `'4px'`,
        width: `'64px'`,
        height: `'64px'`,
          borderRadius: `'8px'`,
          hidden: `($api.path.label($contexts.$context['_keyValue'])?.cover ?? '').length == 0`
        }
        
      ),
    ],
  }

  export const detailItem: FrameRoot = {
    def: {
      id: 'detailItem',
        type: 'listItem'
    },
    node: {
      type: "group",
      id: "$root",
      schemaId: "$root",
      name: "Detail View",
      rank: 0,
      props: {
        _selected: `$root.props['_selectedIndexes']?.some(f => f == $contexts.$context['_index'])`,
        _selectedIndexes: '[]',
        showLabel: 'true',
        showSticker: 'false'
      },
      types: {
        showLabel: "boolean",
        showSticker: "boolean"
      },
      propsValue: {
        showLabel: {
          alias: i18n.labels.showFieldLabels
        },
        showSticker: {
          alias: i18n.labels.showFieldIcons
        }
      },
      styles: {
        layout: `"row"`,
        gap: `'12px'`,
        padding: `'8px'`,
        overflow: `'hidden'`,
        width: `'100%'`,
        sem: `'contextItem'`
      },
      interactions: {
      onClick: 'select',
      onDoubleClick: 'open',
      onContextMenu: 'contextMenu',
    },
    },
    id: "$root",
    children: [
      frameRootWithProps(
        {
          ...slidesNode,
          children: [
            frameRootWithProps(
              {
                ...slideNode,
                children: [
                  frameRootWithProps(
                    { ...deltaNode, node: { ...deltaNode.node, ref: "$root" } },
                    {},
                    {
                      background: `'var(--mk-ui-background-selected)'`,
                    }
                  ),
                ],
              },
              { value: "true" }
            ),
            frameRootWithProps(
              {
                ...slideNode,
                children: [
                  frameRootWithProps(
                    { ...deltaNode, node: { ...deltaNode.node, ref: "$root" } },
                    {},
                    {
                      background: `'transparent'`,
                    }
                  ),
                ],
              },
              { value: "false" }
            ),
          ],
        },
        {
          value: `'_selected'`,
        }
      ),
      kitWithProps(previewNode(), {
        path: `$contexts.$context['_keyValue']`,
        radius: `'4px'`,
        width: `'50px'`,
        height: `'50px'`
      }, {
        height: `'50px'`,
        borderRadius: `'8px'`,
        background: `'var(--background-secondary)'`,
      }
      ),
      {
        ...groupNode,
        node: {
          ...groupNode.node,
          styles: {
            gap: `'8px'`,
            flex: `'1'`,
            padding: `'2px'`,
            paddingBottom: `'12px'`,
            layout: `'column'`,
            borderBottom: `'thin solid var(--mk-ui-border)'`,
          },
        },
        children: [
          frameRootWithProps(
            textNode,
            {
              value: `$contexts.$context['_name']`,
            },
            {
              "--font-text-size": `'18px'`,
              "--font-text-weight": `'var(--bold-weight)'`,
            }
          ),
          frameRootWithProps(textNode, {
            value: `$api.path.label($contexts.$context['_keyValue'])?.preview`,
          }, {
            "--font-text-size": `'14px'`,
            "--font-text-color": `'var(--mk-ui-text-tertiary)'`,
          }),
          kitWithProps(fieldsView, {
            label: `$root.props.showLabel`,
            sticker: `$root.props.showSticker`
          })
        ],
      },
    ],
  };
  
  

  export const newItemNode : FrameRoot = {
    id: "newItem",
  def: {
    id: 'newItem',
  },
  node: {
    schemaId: "newItem",
    parentId: "",
    name: "New Item",
    rank: 0,
    id: "newItem",
    type: "group",
    props: {
      space: "",
      schema: '',
      key: '',
      group: "",
      groupValue: ""
    },
    types: {
      space: "text",
      schema: "text",
      key: "text",
      group: "text",
      groupValue: "text"
    },
    
    actions: {
      
    },
    styles: {
      gap: `'12px'`,
      layout: `'row'`,
      padding: `'4px'`
    }
  }, children: [ frameRootWithProps({
        ...groupNode, 
        children: [
     frameRootWithProps(iconNode, {
            value: `'ui//plus'`
          }, {
            width: `'16px'`,
            height: `'16px'`,
            '--icon-size': `'16px'`,
            
          })]
        }, {}, { width: `'32px'`,
            height: `'32px'`, layoutAlign: `'m'`, background: `'var(--background-secondary)'`,
            borderRadius: `'4px'`}),
    {
      ...inputNode, node: {
        ...inputNode.node,
        styles: {...inputNode.node.styles, placeholder: `'New Item'`, border: `'none'`, background: `'transparent'`},
        actions: {
      onEnter: `$api.table.insert($root.props.space, $root.props.schema, {[$root.props.group]: $root.props.groupValue, [$root.props.key]: $value}); $event.currentTarget.value = ''`,
        },
      }
    }
  ]
  }

  export const newItemButton : FrameRoot = {
    id: "newItemButton",
    def: {
      id: 'newItemButton',
    },
    node: {
      schemaId: "newItemButton",
      parentId: "",
      name: i18n.labels.newItemButton,
      rank: 0,
      id: "newItemButton",
      type: "group",
      props: {
      space: "",
      schema: '',
      group: "",
      groupValue: ""
    },
      types: {
      space: "text",
      schema: "text",
      group: "text",
      groupValue: "text"
    },
      actions: {
        openNewModal: `{
          command: "spaces://$api/table/#;createModal",
          parameters: {
            space: newItemButton.props.space,
            schema: newItemButton.props.schema,
            properties: newItemButton.props.group ? {[newItemButton.props.group]: newItemButton.props.groupValue} : {},
          }
      }`
      },
      styles: {
        padding: `'8px'`,
        width: `'100%'`,
        sem: `'card'`,
        cursor: `'pointer'`,
      },
      interactions: {
        onClick: 'openNewModal'
      }
    }, 
    children: [
      frameRootWithProps({
        ...groupNode, 
        children: [
          frameRootWithProps(iconNode, {
            value: `'ui//plus'`
          }, {
            width: `'16px'`,
            height: `'16px'`,
            '--icon-size': `'16px'`,
          }),
          frameRootWithProps(textNode, {
            value: `'New Item'`
          }, {
            '--font-text-color': `'var(--mk-ui-text)'`,
            "--font-text-size": `'14px'`,
          })
        ]
      }, {}, {
        layout: `'row'`,
        gap: `'8px'`,
        alignItems: `'center'`,
      })
    ]
  }

  export const listGroup: FrameRoot = {
    def: {
      id: 'listGroup',
        type: 'listGroup'
    },
    node: {
      type: "group",
      props: {
        _groupField: ``,
        _groupValue: ``,
        _readMode: 'false',
        showNew: 'true'
      },
      types: {
        _groupField: "object",
        _groupValue: "text",
        _readMode: 'boolean',
        showNew: "boolean"
      },
      propsValue: {
        showNew: {
          alias: i18n.labels.showNewItemButton,
        }
      },
      styles:{
        sem: `'contextGroup'`
      },
      id: "$root",
      schemaId: "$root",
      name: i18n.labels.rows,
      rank: 0,
    },
    id: "$root",
    children: [
      frameRootWithProps(dataNode, {
        field: `$root.props['_groupField']`,
        value: `$root.props['_groupValue']`,
      }),
     frameRootWithProps(contentNode, {
     }, {
        layout: `'column'`,
        alignItems: `'stretch'`,
     }),
     kitWithProps(newItemNode, {
      space: `$contexts.$context['_path']`,
      schema: `$contexts.$context['_schema']`,
      key: `$contexts.$context['_key']`,
      group: `$root.props['_groupField']?.name`,
        groupValue: `$root.props['_groupValue']`,
     }, {
      hidden: `!$root.props['showNew'] || $root.props['_readMode']`
     })
    ],
  };

  

  export const columnGroup: FrameRoot = {
    def: {
      id: 'columnGroup',
        type: 'listGroup'
    },
    node: {
      type: "group",
      props: {
        _groupField: ``,
        _groupValue: ``,
        _readMode: 'false',
        showNew: 'true'
      },
      types: {
        _groupField: "object",
        _groupValue: "text",
        _readMode: 'boolean',
        showNew: "boolean"
      },
      propsValue: {
        showNew: {
          alias: i18n.labels.showNewItemButton,
        }
      },
      styles: {
        layout: `'column'`,
        width: `'262px'`,
        background: `'var(--mk-ui-background-variant)'`,
        borderRadius: `'8px'`,
        gap: `'8px'`,
        padding:`'6px'`
      },
      id: "$root",
      schemaId: "$root",
      name: i18n.labels.columns,
      rank: 0,
        
    },
    id: "$root",
    children: [
      frameRootWithProps(dataNode, {
        field: `$root.props['_groupField']`,
        value: `$root.props['_groupValue']`,
      }),
      frameRootWithProps(
      contentNode,
      {
      },
      {
        gap: `'8px'`,
        layout: `'column'`,
        width: `'100%'`,
        alignItems: `'stretch'`

      }
      ),
      kitWithProps(newItemButton, {
         space: `$contexts.$context['_path']`,
      schema: `$contexts.$context['_schema']`,
      group: `$root.props['_groupField']?.name`,
        groupValue: `$root.props['_groupValue']`,
      },
      {
        hidden: `!$root.props['showNew'] || $root.props['_readMode']`
      })
      
    ],
  };

  export const rowGroup: FrameRoot = {
    def: {
      id: 'rowGroup',
        type: 'listGroup'
    },
    node: {
      type: "group",
      props: {
        _groupField: ``,
        _groupValue: ``,
      },
      types: {
        _groupField: "object",
        _groupValue: "text",
      },
      styles: {
        layout: `'column'`,
        padding:`'6px'`,
        gap: `'8px'`,
        sem: `'contextGroup'`
      },
      id: "$root",
      schemaId: "$root",
      name: "Catalog Group",
      rank: 0,
        
    },
    id: "$root",
    children: [
      frameRootWithProps(dataNode, {
        field: `$root.props['_groupField']`,
        value: `$root.props['_groupValue']`,
      }),
      frameRootWithProps(
      contentNode,
      {
      },
      {
        gap: `'8px'`,
        layout: `'row'`,
        width: `'100%'`,
        overflow: `'scroll'`
      }
      ),
      
      
    ],
  };

  export const gridGroup: FrameRoot = {
    def: {
      id: 'gridGroup',
        type: 'listGroup'
    },
    node: {
      type: "group",
      props: {
        _groupField: ``,
        _groupValue: ``,
      },
      types: {
        _groupField: "object",
        _groupValue: "text",
      },
      styles: {
        layout: `'column'`,
        padding:`'6px'`,
        gap: `'8px'`,
        sem: `'contextGroup'`
      },
      id: "$root",
      schemaId: "$root",
      name: "Grid Group",
      rank: 0,
        
    },
    id: "$root",
    children: [
      frameRootWithProps(dataNode, {
        field: `$root.props['_groupField']`,
        value: `$root.props['_groupValue']`,
      }),
      frameRootWithProps(
      contentNode,
      {
      },
      {
        gap: `'8px'`,
        layout: `'grid'`,
        width: `'100%'`,
        "--mk-grid-columns": `'auto-fill'`,
        "--mk-grid-width": `'250px'`
      }
      ),
      
      
    ],
  };

  export const masonryGroup: FrameRoot = {
    def: {
      id: 'masonryGroup',
        type: 'listGroup'
    },
    node: {
      type: "group",
      props: {},
      id: "$root",
      schemaId: "$root",
      name: i18n.labels.masonry,
      rank: 0,
        styles: {
          layout: `'column'`,
          sem: `'contextGroup'`
        }
    },
    id: "$root",
    children: [
      frameRootWithProps(dataNode, {
        field: `$root.props['_groupField']`,
        value: `$root.props['_groupValue']`,
      }),
      frameRootWithProps(
      contentNode,
      {
      },
      {
        padding: `'8px'`,
        layout: `'masonry'`,
      }
      )
    ],
  };


  export const listView: FrameRoot = {
    def: {
      id: 'listView',
        type: 'listView'
    },
    node: {
      type: "group",
      props: {},
      styles: {
        sem: `'contextView'`
      },
      id: "$root",
      schemaId: "$root",
      name: "List View",
      rank: 0,
    },
    id: "$root",
    children: [
      
      contentNode,
    ],
  };

  

  export const columnView: FrameRoot = {
    def: {
      id: 'columnView',
        type: 'listView'
    },
    node: {
      type: "group",
      props: {},
      id: "$root",
      styles: {
        sem: `'contextView'`
      },
      schemaId: "$root",
      name: "Column View",
      rank: 0,
    },
    id: "$root",
    children: [
      
      frameRootWithProps(contentNode,{},
      {
        padding: `'8px'`,
        layout: `'row'`,
        gap: `'8px'`,
      }),
    ],
  };