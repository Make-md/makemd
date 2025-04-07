import { frameRootWithProps } from "core/utils/frames/frames";
import i18n from "shared/i18n";

import { FrameRoot } from "shared/types/mframe";
import { contentNode, flowNode, groupNode, iconNode, imageNode, textNode } from "./base";
import { deltaNode, slideNode, slidesNode } from "./slides";

export const groupableTypes = ["content", "group", "container", 'column', 'list', 'slides', 'slide'];

export const listNode: FrameRoot = {
  def: {
    id: 'list',
    icon: "ui//list"
  }, node: {
    icon: 'ui//list',
    schemaId: "list",
    parentId: "",
    name: 'List',
    rank: 0,
    id: "list",
    styles: {},
    type: "list",

    props: {
      value: "",
    },
    types: {
      value: "multi",
    },
  }
};

export const listItemNode: FrameRoot = {
  def: {
    id: 'listItem',
    icon: "ui//list"
  }, node: {
    icon: 'ui//list',
    schemaId: "listItem",
    parentId: "",
    name: 'List Item',
    rank: 0,
    id: "listItem",
    styles: {},
    type: "listItem",

    props: {
      value: "",
    },
    types: {
      value: "object",
    },
  }
};
export const dividerNode: FrameRoot = {
  def: {
    id: 'divider',
    icon: "ui//minus",
    description: i18n.frames.divider.description,
  },
  node: {
    icon: "ui//minus",
    schemaId: "divider",
    parentId: "",
    name: i18n.frames.divider.label,
    rank: 0,
    id: "divider",
    type: "group",
    styles: {
      width: `'100%'`,
      height: `'16px'`,
      borderBottom: `'1px solid var(--mk-ui-divider)'`,
    }
  }
};




export const buttonNode: FrameRoot = {
  id: "button",
  def: {
    id: 'button',
    icon: "ui//mouse-pointer-click",
    description: i18n.frames.button.description
  },
  node: {
    icon: "ui//mouse-pointer-click",
    schemaId: "button",
    parentId: "",
    name: i18n.frames.button.label,
    rank: 0,
    id: "button",
    type: "group",
    props: {
      icon: "",
      label: "",
      iconSize: "18",
      action: '',
      actionValue: ''
    },
    types: {
      icon: 'icon',
      iconSize: 'number',
      label: "text",
      action: 'option',
      actionValue: 'super'
    },
    propsAttrs: {
      action: JSON.stringify({
        name: i18n.properties.super.whenClicked,
        icon: "ui//mouse-pointer-click",
      }),
      actionValue: JSON.stringify({
        name: i18n.properties.super.performAction,
      })
    },
    propsValue: {
      icon: JSON.stringify({
        alias: "Icon",
      }),
      label: JSON.stringify({
        alias: "Label",
      }),
      iconSize: JSON.stringify({
        alias: "Icon Size",
      }),
      action: JSON.stringify({
        alias: "Action",
        options: [],
        source: "$super"
      }),
      actionValue: JSON.stringify({
        alias: "Action Properties",
        dynamic: true,
        field: 'action'
      })
    },
    actions: {
      onClick: `$api.commands.run(button.props.action, button.props.actionValue, $contexts, $saveState)`
    },
    styles: {
      sem: `'button'`,
      gap: `'4px'`
    }
  }, children: [
    {
      ...iconNode, node: {
        ...iconNode.node, props: {
          value: `button.props.icon`
        }, styles: {
          '--icon-size': 'button.props.iconSize+"px"',
          // width: `'18px'`,
          // height: `'18px'`,
        }
      }
    }, { ...textNode, node: { ...textNode.node, props: { value: `button.props.label` } } }
  ]
};

export const tabsNode: FrameRoot = {
  id: "tabs",
  def: {
    id: 'tabs',
    icon: "ui//tabs"
  },
  node: {
    icon: "ui//tabs",
    schemaId: "tabs",
    parentId: "",
    name: i18n.commands.tabs,
    rank: 0,
    id: "tabs",
    type: "group",
    props: {
      currentTab: "0",
      tabs: "[{'name': 'Tab 1', 'view': ''}, {'name': 'Tab 2', 'view': ''}]"
    },
    propsValue: {
      tabs: JSON.stringify({
        alias: "Tabs",
        typeName: "Tab",
        type: {
          name: {
            type: "text",
            value: JSON.stringify({alias: "Label"})
          },
          view: {
            type: "link",
            value: JSON.stringify({alias: "Page"})
          },
        },
      }),
      currentTab: JSON.stringify({
        alias: "Selected Tab",
      }),
    },
    types: {
      tabs: 'object-multi',
      currentTab: 'number'
    },
    styles: {
      layout: `'row'`,
      width: `'100%'`,
      gap: `'8px'`,
    }
  },
  children: [
    frameRootWithProps({...listNode, children: [
      frameRootWithProps({...listItemNode, children: [
        frameRootWithProps(
                textNode,
                {
                  value: `listItem.props.value.name`,
                },
                {
                  padding: `'4px 8px'`,
                  color: `$root.props.currentTab == listItem.props._index ? 'var(--mk-ui-text-primary)' : 'var(--mk-ui-text-tertiary)'`,
                  borderBottom: `$root.props.currentTab == listItem.props._index ? '2px solid var(--mk-ui-active)' : 'none'`
                 },
                 {
                  onClick: `$saveState({$root: {props: {currentTab: listItem.props._index}}})`
                }
              ),
          ]},  {})]},
        {value: `$root.props.tabs`}, 
        {layout: `'row'`, columnGap: `'8px'`,
          flexWrap: `'wrap'`,
          rowGap: `'4px'`}
        
      ),
      frameRootWithProps(
        flowNode,
        {
          value: `$root.props.tabs[$root.props.currentTab].view`,
        },
        {
          padding: `'0px'`,
          "--mk-expanded": `true`,
          "--mk-min-mode": `true`
        },
       {}),
      ]
};

export const fieldNode: FrameRoot = {
  id: "field",
  def: {
    id: 'field',
    description: i18n.frames.field.description,
  },
  node: {
    schemaId: "field",
    parentId: "",
    name: i18n.frames.field.label,
    rank: 0,
    id: "field",
    type: "group",
    props: {
      type: "",
      value: "",
      sticker: "",
      property: ""
    },
    types: {
      value: "text",
      type: "text",
      sticker: "text",
      property: 'object'
    },
    styles: {
      "--font-text-size": `'14px'`,
      fontSize: `'14px'`,
      hidden: `$root.props.value?.length == 0`
    }
    
  },
  children: [frameRootWithProps({...groupNode, children:[ 
    frameRootWithProps(
          iconNode,
          {
            value: `$api.properties.sticker($root.props.property, $root.props.value)`,
          },
      {
        "width": `'16px'`,
        "height": `'16px'`,
        "color": `'var(--mk-ui-text-secondary)'`,
        "marginTop": `'4px'`,
      }
    ),
    frameRootWithProps({...groupNode, children:[ 
    
    
        frameRootWithProps(
          textNode,
          {
            value: `$root.props.value`,
          },
      {
        padding: `'4px 8px'`,
    borderRadius: `'4px'`,
       background: `$api.properties.color($root.props.property, $root.props.value)`, 
        hidden: `$root.props.type != 'option'`,
      }
    ),
    frameRootWithProps(
      textNode,
      {
        value: `$root.props.value`,
      },
      {
        hidden: `$root.props.type != 'text' && $root.props.type != 'number' && $root.props.type != 'fileprop'`,
      }
    ),
    frameRootWithProps(
      textNode,
      {
        value: `$api.date.format($api.date.parse($root.props.value))`,
      },
      {
        hidden: `$root.props.type != 'date'`,
      }
    ),
    frameRootWithProps(
      {...groupNode, children: [
        frameRootWithProps(iconNode, {value: `'ui//check'`}, { background: `'var(--mk-ui-active)'`, "width": `'16px'`, height: `'16px'`, borderRadius: `'2px'`, padding: `'2px'`}),
        frameRootWithProps(textNode, {value: `$root.props.property?.name`})
      ]},
      {},
      {
        layout: `'row'`,
        gap: `'4px'`,
        layoutAlign: `'w'`,
        height: `'auto'`,
        hidden: `$root.props.type != 'boolean'`,
      }
    ),
    frameRootWithProps(
      imageNode,
      {
        value: `$root.props.value`,
      },
      {
        width: `'50px'`,
        height: `'50px'`,
        hidden: `$root.props.type != 'image'`,
      }
    ),
    frameRootWithProps(
      iconNode,
      {
        value: `$root.props.value`,
      },
      {
        hidden: `$root.props.type != 'icon'`,
      }
    ),
    frameRootWithProps(
      flowNode,
      {
        value: `$root.props.value`,
      },
      {
        hidden: `$root.props.type != 'link' && $root.props.type != 'file' && $root.props.type != 'context'`,
        padding: `'0px'`,
        "--mk-link": `true`
      }
    ),
  ]}, {}, {
    layout: `'row'`,
    layoutAlign: `'w'`,
    height: `'auto'`,
    gap: `'8px'`,
    minHeight: `'24px'`,
    hidden: `!($root.props.value?.length > 0) || $root.props.type?.contains('multi')`
  }), 
  frameRootWithProps({...listNode, children: [
    frameRootWithProps({...listItemNode, children: [
      frameRootWithProps(
              textNode,
              {
                value: `listItem.props.value`,
              },
              {
                padding: `'4px 8px'`,
                borderRadius: `'4px'`,
                background: `$api.properties.color($root.props.property, listItem.props.value)`, 
                 hidden: `$root.props.type != 'option-multi' && $root.props.type != 'tags'`,
               }
            ),
        frameRootWithProps(
          flowNode,
          {
            value: `listItem.props.value`,
          },
          {
            hidden: `$root.props.type != 'link-multi' && $root.props.type != 'context-multi'`,
            padding: `'0px'`,
            "--mk-link": `true`
          }
        )]}, {}),
      ]}, 
      {value: `$api.properties.value($root.props.type, $root.props.value)`}, 
      {layout: `'row'`, columnGap: `'8px'`,
      flexWrap: `'wrap'`,
      rowGap: `'4px'`, hidden: `!$root.props.type?.includes('multi')`})
    ]}, {}, {
      layout: `'row'`,
      layoutAlign: `'nw'`,
      gap: `'8px'`,
      height: `'auto'`,
    })]
}

export const previewNode: FrameRoot = {
  id: "preview",
  def: {
    id: 'preview',
  },
  node: {
    schemaId: "preview",
    parentId: "",
    name: "Preview",
    rank: 0,
    id: "preview",
    type: "group",
    props: {
      path: "",
      width: `"50px"`,
      height: `'50px'`,
      radius: `'8px'`,
      padding: `'16px'`,
    },
    types: {
      path: "link",
      width: 'text',
      height: 'text',
      radius: 'text',
      padding: 'text',
    },
    styles: {
        background: `'var(--background-secondary)'`,
        height: `$root.props.height`,
        borderRadius: `$root.props.radius`,
        overflow: `'hidden'`
    }
  },
  children: [
    frameRootWithProps(
      imageNode,
      {
        value: `$api.path.label(preview.props.path)?.cover`,
      },
      {
        width: `$root.props.width`,
        height: `$root.props.height`,
        hidden: `$api.path.label(preview.props.path)?.cover?.length == 0`,
        borderRadius: `$root.props.radius`,
      }
    ),
    frameRootWithProps(
      iconNode,
      {
        value: `$api.path.label(preview.props.path)?.sticker`,
      },
      {
        width: `$root.props.width`,
        height: `$root.props.height`,
        hidden: `$api.path.label(preview.props.path)?.cover?.length > 0`,
        borderRadius: `$root.props.radius`,
          background: `$api.path.label(preview.props.path)?.color`,
          padding: `$root.props.padding`,
          overflow: `'hidden'`
      }
    ),
  ]
}


export const ratingNode: FrameRoot = {
  id: "rating",
  def: {
    id: 'rating',
    icon: "ui//star"
  },
  node: {
    icon: "ui//star",
    schemaId: "rating",
    parentId: "",
    name: i18n.commands.rating,
    rank: 0,
    id: "rating",
    type: "group",
    props: {
      value: "5",
      icon: `'ui//star'`
    },
    types: {
      value: 'number',
      icon: 'icon'
    },
    styles: {
      layout: `'row'`,
      height: `'16px'`
    }
    
  }, children: [
    frameRootWithProps(iconNode, {
      value: `$root.props.icon`
    }, {
      width: `$root.styles.height`,
      height: `$root.styles.height`,
      hidden: `$root.props.value < 1`
    }),
    frameRootWithProps(iconNode, {
      
      value: `$root.props.icon`
    }, {
      width: `$root.styles.height`,
      height: `$root.styles.height`,
      hidden: `$root.props.value < 2`
    }),
    frameRootWithProps(iconNode, {
      
      value: `$root.props.icon`
    }, {
      width: `$root.styles.height`,
      height: `$root.styles.height`,
      hidden: `$root.props.value < 3`
    }),
    frameRootWithProps(iconNode, {
      
      value: `$root.props.icon`
    }, {
      width: `$root.styles.height`,
      height: `$root.styles.height`,
      hidden: `$root.props.value < 4`
    }),
    frameRootWithProps(iconNode, {
      
      value: `$root.props.icon`
    }, {
      width: `$root.styles.height`,
      height: `$root.styles.height`,
      hidden: `$root.props.value < 5`
    })
  ]
};

export const callout: FrameRoot = {
  id: "callout",
  def: {
    id: 'callout',
    icon: "ui//callout"
  },
  node: {
    icon: "ui//callout",
    schemaId: "callout",
    parentId: "",
    name: i18n.commands.callout,
    rank: 0,
    id: "callout",
    type: "group",
    props: {
      icon: "",
      note: ""
    },
    types: {
      icon: 'icon',
      note: "link"
    },
    styles: {
      borderRadius: `'8px'`,
      background: `'var(--mk-ui-background-contrast)'`,
      width: `'100%'`,
      layout: `'row'`,
      gap: `'8px'`,
      padding: `'16px'`,
    }
  }, children: [
    frameRootWithProps(iconNode, {
      value: `callout.props.icon`
    }, {
      width: `'18px'`,
      height: `'18px'`,
    }), frameRootWithProps({ ...contentNode, children: [
      frameRootWithProps(flowNode, {
        value: `callout.props.note`
      }, {
        width: `'100%'`,
        "--mk-expanded": `true`,
        "--mk-min-mode": `true`
      })]
    }, {}, {
      width: `'auto'`,
      flex: `'1'`,
    })
  ]
}

export const toggleNode: FrameRoot = {
  id: "toggle",
  def: {
    id: 'toggle',
    icon: "ui//collapse-solid",
    description: i18n.frames.toggle.description
  },
  node: {
    icon: "ui//collapse-solid",
    schemaId: "toggle",
    parentId: "",
    name: i18n.commands.toggle,
    rank: 0,
    id: "toggle",
    type: "group",
    props: {
      value: "false",
      label: "",
      note: "",
    },
    types: {
      value: 'boolean',
      label: "text",
      note: "link"
    },
    styles: {
      width: `'100%'`,
    }
  }, children: [
    frameRootWithProps(
      {
        ...slidesNode,
        children: [
          frameRootWithProps(
            {
              ...slideNode,
              children: [
                frameRootWithProps(
                  { ...deltaNode, node: { ...deltaNode.node, ref: "icon" } },
                  {},
                  {
                    transform: `'rotate(90deg)'`,
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
                  { ...deltaNode, node: { ...deltaNode.node, ref: "icon" } },
                  {},
                  {
                    transform: `'rotate(0deg)'`,
                  }
                ),
                
              ],
            },
            { value: "false" }
          ),
        ],
      },
      {
        value: `'value'`,
      }
    ),
    frameRootWithProps({
      ...groupNode, children: [
    {
      ...iconNode, node: {
        ...iconNode.node, props: {
          value: `'ui//collapse-solid'`
        },
        styles: {
          width: `'16px'`,
          height: `'16px'`,
          transform: `'rotate(90deg)'`,
        },
        actions: {
          onClick: `$saveState({ toggle: {props: { value: !toggle.props.value }} })`
        },
      }
    }, { ...textNode, node: { ...textNode.node, props: { value: `toggle.props.label` } } }]}, {}, {
      height: `'auto'`,
      layoutAlign: `'w'`,
      gap: `'8px'`,
layout: `'row'`
    }),
    frameRootWithProps({ ...contentNode, children: [
    frameRootWithProps(flowNode, {
      value: `toggle.props.note`
    }, {
      width: `'auto'`,
      flex: `'1'`,
      "--mk-expanded": `true`,
        "--mk-min-mode": `true`,
    })]
  }, {}, {paddingLeft: `'24px'`, hidden: `!toggle.props.value`})
  ]
}



export const progressNode: FrameRoot = {
  id: "progress",
  def: {
    id: 'progress',
    icon: "ui//pie-chart"
  },
  node: {
    icon: "ui//pie-chart",
    schemaId: "progress",
    parentId: "",
    name: i18n.commands.progress,
    rank: 0,
    id: "progress",
    type: "group",
    props: {
      value: "50",
      max: "100",
      color: "'var(--background-modifier-form-field)'",
      backgroundColor: `'var(--color-orange)'`
    },
    types: {
      value: 'number',
      max: "number",
      color: 'color',
      backgroundColor: 'color'
    },
    styles: {
      background: `$root.props.color`,
      height: `'10px'`,
      width: `'100px'`,
      borderRadius: `'5px'`,
    }
  }, children: [
    {
      ...groupNode, node: {
        ...groupNode.node, styles: {
          width: `$root.props.value/$root.props.max*100+'%'`,
          height: `'100%'`,
          borderRadius: `'5px'`,
          background: `$root.props.backgroundColor`,
          display: `'block'`
        }
      }
    }
  ]
};

export const circularProgressNode: FrameRoot = {
  id: "circularProgress",
  def: {
    id: 'circularProgress',
    icon: "ui//pie-chart"
  },
  node: {
    icon: "ui//pie-chart",
    schemaId: "circularProgress",
    parentId: "",
    name: i18n.commands.circularProgress,
    rank: 0,
    id: "circularProgress",
    type: "group",
    props: {
      value: "50",
      max: "100",
      color: `'var(--color-orange)'`,
      backgroundColor: "'var(--background-modifier-form-field)'",
      ringWidth: "5" 
    },
    types: {
      value: "number",
      color: 'color',
      max: 'number',
      backgroundColor: 'color',
      ringWidth: 'number'
    },
    styles: {
      height: `'100px'`,
      width: `'100px'`,
    }
  }, 
  children: [
    frameRootWithProps(groupNode,
      {

      }, 
      {
        background: 
    "`conic-gradient(${$root.props.color} ${$root.props.value/$root.props.max*100}%, ${$root.props.backgroundColor} 0)`",
    "maskImage": "`radial-gradient(circle calc(calc(${$root.styles.width} - ${$root.props.ringWidth}px) / 2) at calc(50%) calc(50%),transparent 100%,black 0%)`",
      height: `'100%'`,
      width: `'100%'`,
      borderRadius: `'50%'`,
      })
  ]
};

export const cardNode: FrameRoot = {
  id: "card",
  def: {
    id: 'card',
    icon: "ui//mouse-pointer-click"
  },
  node: {
    icon: "ui//mouse-pointer-click",
    schemaId: "card",
    parentId: "",
    name: i18n.commands.card,
    rank: 0,
    id: "card",
    type: "group",
    props: {
      icon: "",
      label: "",
    },
    types: {
      icon: 'icon',
      label: "text",
    },
    actions: {},
    styles: {
      borderRadius: `'10px'`,
      background: `'var(--background-primary-alt)'`,
      width: `'160px'`,
      height: `'80px'`,
      padding: `'16px'`,
      border: `'thin solid var(--mk-ui-divider)'`
    }
  }, children: [
    {
      ...iconNode, node: {
        ...iconNode.node, props: {
          value: `card.props.icon`
        }
      }
    }, { ...textNode, node: { ...textNode.node, props: { value: `card.props.label` } } }
  ]
};



export const linkNode: FrameRoot = {
  id: "link",
  def: {
    id: 'link',
    icon: "ui//link"
  },
  node: {
    icon: "ui//link",
    schemaId: "link",
    parentId: "",
    name: i18n.commands.link,
    rank: 0,
    id: "link",
    type: "group",
    props: {
      link: '',
      label: `$api.path.label(link.props.link)?.name`,
      sticker: `$api.path.label(link.props.link)?.sticker`,
      
    },
    styles: {
      sem: `'a'`,
      layout: '"row"',
    },
    actions: {
      onClick: '$api.path.open(link.props.link, false)'
    },
    types: {
      link: 'link',
      label: "text",
      sticker: 'sticker'
    }
  }, children: [
    { ...iconNode, node: { ...iconNode.node, props: { value: `link.props.sticker` }, styles: {
      width: `'18px'`,
      height: `'18px'`,
    } } },
    { ...textNode, node: { ...textNode.node, props: { value: `link.props.label` } } }
  ]
};
