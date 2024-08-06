
import { frameRootWithProps, kitWithProps } from "core/utils/frames/frames";
import { FrameRoot } from "types/mframe";
import { contentNode, flowNode, groupNode, iconNode, imageNode, inputNode, textNode } from "./base";
import { deltaNode, slideNode, slidesNode } from "./slides";
import { fieldNode, listItemNode, listNode, previewNode } from "./ui";

export const fieldsView : FrameRoot = {
  id: 'fieldsView',
  def: {
    id: 'fieldsView',
  },
  node: {
    schemaId: 'fieldsView',
    parentId: "",
    name: "Properties",
    rank: 0,
    id: 'fieldsView',
    type: 'group',
  },
  children: [frameRootWithProps({...listNode, children: [
    frameRootWithProps({...listItemNode, children: [
      kitWithProps(fieldNode, {
        sticker: `$api.properties.sticker(listItem.props.value)`,
        type: 'listItem.props.value.type',
        value: '$contexts[listItem.props.value.table?.length > 0 ? listItem.props.value.table : $contexts.$context._path]?.[listItem.props.value.name]',
        property: 'listItem.props.value'
      })
    ]}, {}, {
      layout: `'row'`,
      gap: `'8px'`,
      hidden: '!($contexts[listItem.props.value.table?.length > 0 ? listItem.props.value.table : $contexts.$context._path]?.[listItem.props.value.name]?.length > 0)'
    })
  ]}, {
    value: `$contexts.$context._properties?.filter(f => f.primary != 'true') ?? []`
  }, {
    layout: `'column'`,
    gap: `'4px'`
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

    },
    styles: {
      layout: `"column"`,
    },
    
  },
  id: "$root",
  children: [
    frameRootWithProps(
      imageNode,
      {
        value: `$api.path.label($contexts.$context['_keyValue'])?.thumbnail`,
      }, {
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
      _selected: `$root.props['_selectedIndex'] == $contexts.$context['_index']`,
    },
    styles: {
      layout: `"row"`,
      padding: `'4px'`,
      
    },
    actions: {
      onClick: `$saveState({ $root: {props: {_selectedIndex: $contexts.$context['_index']}} });`,
      onDoubleClick: `$api.table.open($contexts.$context['_path'], $contexts.$context['_schema'], $contexts.$context['_index'], false)`,
      onContextMenu: `$api.table.contextMenu($event, $contexts.$context['_path'], $contexts.$context['_schema'], $contexts.$context['_index'])`,
    },
  },
  id: "$root",
  children: [
    
    frameRootWithProps(
      imageNode,
      {
        value: `$api.path.label($contexts.$context['_keyValue'])?.thumbnail`,
      }, {
        borderRadius: `'8px'`,
      }
      
    ),
    
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
        _selected: `$root.props['_selectedIndex'] == $contexts.$context['_index']`,
        expanded: 'true',
        seamless: 'false'
      },
      types: {
        expanded: 'boolean',
        seamless: 'boolean'
      },
      propsValue: {
        expanded: {
          alias: "Expanded",
        },
        seamless: {
          alias: "Seamless",
        }
      },
      styles: {
        layout: `"row"`,
        gap: `'8px'`,
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
        _selected: `$root.props['_selectedIndex'] == $contexts.$context['_index']`,
        // hideCover: `false`,
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
        overflow: `'hidden'`,
        borderRadius: `'8px'`,
        width: `'100%'`,
        height: `'100%'`,
        border: `'1px solid var(--mk-ui-border)'`,
        boxShadow: `'var(--mk-shadow-card)'`
      },
      actions: {
        onClick: `$saveState({ $root: {props: {_selectedIndex: $contexts.$context['_index']}} });`,
        onDoubleClick: `$api.table.open($contexts.$context['_path'], $contexts.$context['_schema'], $contexts.$context['_index'], false)`,
        onContextMenu: `$api.table.contextMenu($event, $contexts.$context['_path'], $contexts.$context['_schema'], $contexts.$context['_index'])`,
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
        {...groupNode, children: [frameRootWithProps(
          imageNode,
          {
            value: `$api.path.label($contexts[$contexts.$context['_path']]?.[$root.props.coverProperty])?.thumbnail`,
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
          // hidden: `$root.props.hideCover`
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
          kitWithProps(fieldsView, {}, {marginTop: `'8px'`})
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
        _selected: `$root.props['_selectedIndex'] == $contexts.$context['_index']`,
      },
      styles: {
        layout: `"column"`,
        overflow: `'hidden'`,
        borderRadius: `'8px'`,
        width: `'100%'`,
        border: `'1px solid var(--mk-ui-border)'`,
      },
      actions: {
        onClick: `$saveState({ $root: {props: {_selectedIndex: $contexts.$context['_index']}} });`,
        onDoubleClick: `$api.path.open($contexts.$context['_keyValue'], false)`,
        onContextMenu: `$api.table.contextMenu($event, $contexts.$context['_path'], $contexts.$context['_schema'], $contexts.$context['_index'])`,
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
          value: `$api.path.label($contexts.$context['_keyValue'])?.thumbnail`,
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
          kitWithProps(fieldsView, {})
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
        _selected: `$root.props['_selectedIndex'] == $contexts.$context['_index']`,
        previewField: `'Created'`,
      },
      styles: {
        layout: `"row"`,
        gap: `'12px'`,
        padding: `'4px'`,
        overflow: `'hidden'`,
        width: `'100%'`,
        layoutAlign: `'n'`
      },
      actions: {
        onClick: `$saveState({ $root: {props: {_selectedIndex: $contexts.$context['_index']}} });`,
        onDoubleClick: `$api.table.open($contexts.$context['_path'], $contexts.$context['_schema'], $contexts.$context['_index'], false)`,
        onContextMenu: `$api.table.contextMenu($event, $contexts.$context['_path'], $contexts.$context['_schema'], $contexts.$context['_index'])`,
      },
      types: {
        previewField: "option",
      },
      propsValue: {
        previewField: {
          alias: "Preview",
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
      kitWithProps(previewNode, {
        path: `$contexts.$context['_keyValue']`,
        width: `'32px'`,
        height: `'32px'`,
        padding: `'8px'`,
        radius: `'4px'`
      }, {
        borderRadius: `'4px'`,
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
                flex: `'1'`,
                padding: `'2px'`,
                layout: `'row'`,
                layoutAlign: `'w'`,
                height: `'auto'`,
                width: `'100%'`
              },
            },
            children:[
          frameRootWithProps(
            textNode,
            {
              value: `$contexts.$context['_name']`,
            },
            {
              "--font-text-size": `'14px'`,
              "--font-text-weight": `'var(--bold-weight)'`,
              width: `'auto'`
            }
          ),
          frameRootWithProps(groupNode, {}, {
            "flex": `'1'`,
            height: `'auto'`,
          }),
          kitWithProps(fieldNode, {
            type: `$contexts.$context._properties?.find(f => f.name == $root.props['previewField'])?.type`,
            value: `$contexts[$contexts.$context['_path']]?.[$root.props.previewField]`,
          }, {
            "--font-text-color": `'var(--mk-ui-text-tertiary)'`,
          }),
        ],
      }],
      },
    ],
  }

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
        _selected: `$root.props['_selectedIndex'] == $contexts.$context['_index']`,
      },
      styles: {
        layout: `"row"`,
        gap: `'12px'`,
        padding: `'8px'`,
        overflow: `'hidden'`,
        width: `'100%'`,
        borderBottom: `'thin solid var(--mk-ui-border)'`,
      },
      actions: {
        onClick: `$saveState({ $root: {props: {_selectedIndex: $contexts.$context['_index']}} }); $api.table.open($contexts.$context['_path'], $contexts.$context['_schema'], $contexts.$context['_index'], false)`,
        onContextMenu: `$api.table.contextMenu($event, $contexts.$context['_path'], $contexts.$context['_schema'], $contexts.$context['_index'])`,
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
          value: `$api.path.label($contexts.$context['_keyValue'])?.thumbnail`,
        }, {
          radius: `'4px'`,
        width: `'64px'`,
        height: `'64px'`,
          borderRadius: `'8px'`,
          hidden: `($api.path.label($contexts.$context['_keyValue'])?.thumbnail ?? '').length == 0`
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
        _selected: `$root.props['_selectedIndex'] == $contexts.$context['_index']`,
      },
      styles: {
        layout: `"row"`,
        gap: `'12px'`,
        padding: `'8px'`,
        overflow: `'hidden'`,
        width: `'100%'`
      },
      actions: {
        onClick: `$saveState({ $root: {props: {_selectedIndex: $contexts.$context['_index']}} });`,
        onDoubleClick: `$api.table.open($contexts.$context['_path'], $contexts.$context['_schema'], $contexts.$context['_index'], false)`,
        onContextMenu: `$api.table.contextMenu($event, $contexts.$context['_path'], $contexts.$context['_schema'], $contexts.$context['_index'])`,
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
      kitWithProps(previewNode, {
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
          kitWithProps(fieldsView, {})
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
      gap: `'4px'`,
    }
  }, children: [
    {
      ...inputNode, node: {
        ...inputNode.node,
        styles: {...inputNode.node.styles, placeholder: `'+ New Item'`, border: `'none'`, background: `'transparent'`},
        actions: {
      onEnter: `$api.table.insert($root.props.space, $root.props.schema, {[$root.props.group]: $root.props.groupValue, [$root.props.key]: $value}); $event.currentTarget.value = ''`,
        },
      }
    }
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
        _groupType: ``,
        _groupField: ``,
        _groupValue: ``,
        _readMode: 'false',
        showNew: 'true'
      },
      types: {
        _groupType: "text",
        _groupField: "text",
        _groupValue: "text",
        _readMode: 'boolean',
        showNew: "boolean"
      },
      propsValue: {
        showNew: {
          alias: "Show New Item Button",
        }
      },
      id: "$root",
      schemaId: "$root",
      name: "Rows",
      rank: 0,
    },
    id: "$root",
    children: [
      kitWithProps(fieldNode, {
        type: `$root.props['_groupType']`,
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
      group: `$root.props['_groupField']`,
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
        _groupType: ``,
        _groupField: '',
        _groupValue: ``,
        _readMode: 'false',
        showNew: 'true'
      },
      types: {
        _groupType: "text",
        _groupField: 'text',
        _groupValue: "text",
        _readMode: 'boolean',
        showNew: "boolean"
      },
      propsValue: {
        showNew: {
          alias: "Show New Item Button",
        }
      },
      styles: {
        layout: `'column'`,
        width: `'262px'`,
        background: `'var(--mk-ui-background-variant)'`,
        borderRadius: `'8px'`,
        padding:`'6px'`
      },
      id: "$root",
      schemaId: "$root",
      name: "Columns",
      rank: 0,
        
    },
    id: "$root",
    children: [
      kitWithProps(fieldNode, {
        type: `$root.props['_groupType']`,
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
      frameRootWithProps({...groupNode, children:[kitWithProps(newItemNode, {
        space: `$contexts.$context['_path']`,
      schema: `$contexts.$context['_schema']`,
      key: `$contexts.$context['_key']`,
      group: `$root.props['_groupField']`,
        groupValue: `$root.props['_groupValue']`,
      },
    {
      
   
    })]}, {}, 
      {height: `'auto'`, marginTop: `'8px'`,
      borderRadius: `'8px'`,
      width: `'250px'`,
      border: `'1px solid var(--mk-ui-border)'`,
      background: `'var(--mk-ui-background)'`,
      hidden: `!$root.props['showNew'] || $root.props['_readMode']`})
      
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
        _groupType: ``,
        _groupField: '',
        _groupValue: ``,
      },
      types: {
        _groupType: "text",
        _groupField: 'text',
        _groupValue: "text",
      },
      styles: {
        layout: `'column'`,
        padding:`'6px'`,
        gap: `'8px'`
      },
      id: "$root",
      schemaId: "$root",
      name: "Catalog Group",
      rank: 0,
        
    },
    id: "$root",
    children: [
      kitWithProps(fieldNode, {
        type: `$root.props['_groupType']`,
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
        _groupType: ``,
        _groupField: '',
        _groupValue: ``,
      },
      types: {
        _groupType: "text",
        _groupField: 'text',
        _groupValue: "text",
      },
      styles: {
        layout: `'column'`,
        padding:`'6px'`,
        gap: `'8px'`
      },
      id: "$root",
      schemaId: "$root",
      name: "Grid Group",
      rank: 0,
        
    },
    id: "$root",
    children: [
      kitWithProps(fieldNode, {
        type: `$root.props['_groupType']`,
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
      name: "Masonry",
      rank: 0,
        styles: {
          layout: `'column'`,
        }
    },
    id: "$root",
    children: [
      kitWithProps(fieldNode, {
        type: `$root.props['_groupType']`,
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