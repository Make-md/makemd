import i18n from "core/i18n";
import { flattenToFrameNodes } from "core/utils/frames/ast";
import { nodeToFrame } from "core/utils/frames/nodes";
import { FrameRoot, MDBFrame } from "types/mframe";

export const defaultFrameSchema = {
    uniques: ["id,schemaId"],
    cols: [
        'id',
        'schemaId',
        'type',
        'parentId',
        'name',
        'rank',
        'icon',
        'props',
        'actions',
        'ref',
        'styles',
        'contexts',
    ],
  };

  export const frameStyles : string[] = [
    "alignItems", "alignSelf", "animation", "animationDelay", "animationDirection", "animationDuration", "animationFillMode", "animationIterationCount", "animationName", "animationPlayState", "animationTimingFunction", "background", "backgroundColor", "backgroundImage", "backgroundPosition", "backgroundRepeat", "backgroundSize", "border", "borderBottom", "borderBottomColor", "borderBottomLeftRadius", "borderBottomRightRadius", "borderBottomStyle", "borderBottomWidth", "borderColor", "borderLeft", "borderLeftColor", "borderLeftStyle", "borderLeftWidth", "borderRadius", "borderRight", "borderRightColor", "borderRightStyle", "borderRightWidth", "borderStyle", "borderTop", "borderTopColor", "borderTopLeftRadius", "borderTopRightRadius", "borderTopStyle", "borderTopWidth", "borderWidth", "boxShadow", "boxSizing", "clear", "color", "cursor", "display", "flex", "flexDirection", "flexGrow", "flexShrink", "flexWrap", "float", "fontFamily", "fontSize", "fontStyle", "fontWeight", "height", "justifyContent", "left", "letterSpacing", "lineHeight", "listStyle", "listStyleImage", "listStylePosition", "listStyleType", "margin", "marginBottom", "marginLeft", "marginRight", "marginTop", "maxHeight", "maxWidth", "minHeight", "minWidth", "opacity", "order", "overflow", "overflowX", "overflowY", "padding", "paddingBottom", "paddingLeft", "paddingRight", "paddingTop", "position", "right", "textAlign", "textDecoration", "textIndent", "textTransform", "top", "transform", "transition", "transitionDelay", "transitionDuration", "transitionProperty", "transitionTimingFunction", "verticalAlign", "visibility", "whiteSpace", "width", "wordBreak", "wordSpacing", "wordWrap", "zIndex"
  ]

  export const nodeToTypes = (type: string) => {
    return type == 'flow' ? { value: 'link' } :  type == 'container' || type == 'group' || type == 'content' || type == 'frame' ? {
    } : {
value: type
    }
  }


export  const groupNode: FrameRoot = { 
  def: {
    icon: "lucide//box-select",
  },
  node: {
    id: "group",
    schemaId: "group",
    name: i18n.commands.group,
    rank: 0,
    parentId: "",
    styles: {
      layout: `"column"`,
    },
    type: "group",
  }};
  export  const columnsNode: FrameRoot = { 
    def: {
      icon: "lucide//columns",
    },
    node: {
      id: "container",
      schemaId: "container",
      name: i18n.commands.columns,
      rank: 0,
      parentId: "",
      styles: {
        layout: `"row"`,
        width: `'100%'`,
        gap: `'24px'`
      },
      type: "container",
    }};

    export  const columnNode: FrameRoot = { 
      def: {
        icon: "lucide//columns",
      },
      node: {
        icon: "lucide//columns",
        id: "column",
        schemaId: "column",
        name: i18n.commands.column,
        rank: 0,
        parentId: "",
        styles: {
          layout: `"column"`,
          layoutAlign: `'left'`,
          flex: `1`,
          gap: `'16px'`,
          width: '0'
        },
        type: "column",
      }};
  
  export const groupableTypes = ["content", "group", "container", 'column', 'list'];

  export const inputNode: FrameRoot = {
    def: {
      icon: ""},
      node: {
    schemaId: "input",
    parentId: "",
    name: 'input',
    rank: 0,
    id: "input",
    styles: {},
    type: "input",
    props: {},
  }};
  
  
  
  export const flowNode: FrameRoot = {
    def: {
      icon: 'lucide//file-text'
    },
    node: {
      icon: 'lucide//file-text',
    schemaId: "flow",
    parentId: "",
    name: i18n.commands.flow,
    rank: 0,
    id: "flow",
    type: "flow",
    props: {
      value: "",
    },
    styles: {
      width: `'100%'`
    },
    types: {
      value: "link",
    },
  }};
  
  export const listNode: FrameRoot = {
    def: {
icon: "lucide//list"
  }, node: {
    icon: 'lucide//list',
    schemaId: "list",
    parentId: "",
    name: 'List',
    rank: 0,
    id: "list",
    styles: {},
    type: "list",
  
    props: {
      list: "",
    },
    types: {
      list: "options",
    },
  }};
  export const iconNode: FrameRoot = {
    def: {
icon: "lucide//gem"
  }, node: {
    icon: 'lucide//gem',
    schemaId: "icon",
    parentId: "",
    name: i18n.properties.icon.label,
    rank: 0,
    id: "icon",
    styles: {},
    type: "icon",
  
    props: {
      value: "",
    },
    types: {
      value: "icon",
    },
  }};

  export const spaceNode: FrameRoot = 
  { 
    def: {
      icon: "lucide//layout-grid"
    },
    node: {
      icon: "lucide//layout-grid",
    schemaId: "space",
    parentId: "",
    name: i18n.properties.space.label,
    rank: 0,
    id: "space",
    styles: {width: `'100%'`},
    type: "space",
  
    props: {
      value: "",
    },
    types: {
      value: "view",
    },
  }};
  
  export const imageNode: FrameRoot = {
    def: {
      icon: "lucide//image"
    },
    node: {
      icon: "lucide//image",
    schemaId: "image",
    parentId: "",
    name: i18n.properties.image.label,
    rank: 0,
    id: "image",
    type: "image",
    props: {
      value: "",
    },
    types: {
      value: "image",
    },
  }};
  
  export const textNode: FrameRoot = {
    def: {
      icon: "lucide//type",
      description: "Insert a text labels to decorate your Space"
    },
    node: {
      icon: "lucide//type",
    schemaId: "text",
    parentId: "",
    name: i18n.commands.label,
    rank: 0,
    id: "text",
    type: "text",
    props: {
      value: "",
    },
    types: {
      value: "text",
    },
  }};

  export const dividerNode: FrameRoot = {
    def: {
      icon: "lucide//type"
    },
    node: {
      icon: "lucide//type",
    schemaId: "hr",
    parentId: "",
    name: i18n.commands.divider,
    rank: 0,
    id: "hr",
    type: "hr",
    styles: {
      as: `'hr'`
    }
  }};
  export const contentNode: FrameRoot = {
    def: {
      icon: "lucide//type"
    },
    node: {
      icon: "lucide//type",
    schemaId: "content",
    parentId: "",
    name: 'Content',
    rank: 0,
    id: "content",
    type: "content",
  }};

  export const buttonNode: FrameRoot = {
    id: "button",
    def: {
      icon: "lucide//mouse-pointer-click"
    },
    node: {
      icon: "lucide//mouse-pointer-click",
    schemaId: "button",
    parentId: "",
    name: i18n.commands.button,
    rank: 0,
    id: "button",
    type: "group",
    props: {
      icon: "",
      label: "",
      action: '',
      actionValue: ''
    },
    types: {
      icon: 'icon',
      label: "text",
      action: 'option',
      actionValue: 'super'
    },
    propsAttrs: {
      action: JSON.stringify({
        name: i18n.properties.super.whenClicked,
        icon: "lucide//mouse-pointer-click",
      }),
      actionValue: JSON.stringify({
        name: i18n.properties.super.performAction,
      })
    },
    propsValue: {
      action: JSON.stringify({
        options: [{ name: i18n.properties.super.runCommand, value: '$commands'}, {name: 'Open Link', value: '$links'}]
      }),
      actionValue: JSON.stringify({
        dynamic: true,
        field: 'action'
      })
    },
    actions: {
      onClick: `(a,b,c,api) => api.buttonCommand(button.props.action, button.props.actionValue)`
    },
    styles: {
      class: `'mk-button'`,
      gap: `'4px'`
    }
  }, children:[
    {...iconNode, node: {...iconNode.node, props: {
      value: `button.props.icon`
    }}}, {...textNode, node :{...textNode.node, props: {value: `button.props.label`}}}
  ]
  }

  

  export const progressNode: FrameRoot = {
    id: "progress",
    def: {
      icon: "lucide//pie-chart"
    },
    node: {
      icon: "lucide//pie-chart",
    schemaId: "progress",
    parentId: "",
    name: i18n.commands.progress,
    rank: 0,
    id: "progress",
    type: "group",
    props: {
      value: "50",
      total: "100",
      color: "'var(--background-modifier-form-field)'"
    },
    types: {
      total: 'number',
      value: "number",
      color: 'color'
    },
    styles: {
      background: `progress.props.color`,
      height: `'10px'`,
      width: `'100px'`,
      borderRadius: `'5px'`,
    }
  }, children:[
    {...groupNode, node: {...groupNode.node, styles: {
      width: `progress.props.value/progress.props.total*100+'%'`,
      height: `'100%'`,
      borderRadius: `'5px'`,
      background: `'var(--color-orange)'`,
      display: `'block'`
    }}}
  ]
  }

  export const cardNode: FrameRoot = {
    id: "card",
    def: {
      icon: "lucide//mouse-pointer-click"
    },
    node: {
      icon: "lucide//mouse-pointer-click",
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
    actions: {

    },
    styles: {
      borderRadius: `'10px'`,
      background: `'var(--background-primary-alt)'`,
      width: `'160px'`,
      height: `'80px'`,
      padding: `'16px'`,
      border: `'thin solid var(--divider-color)'`
    }
  }, children:[
    {...iconNode, node: {...iconNode.node, props: {
      value: `card.props.icon`
    }}}, {...textNode, node :{...textNode.node, props: {value: `card.props.label`}}}
  ]
  }



  export const linkNode: FrameRoot = {
    id: "link",
    def: {
      icon: "lucide//link"
    },
    node: {
      icon: "lucide//link",
    schemaId: "link",
    parentId: "",
    name: i18n.commands.link,
    rank: 0,
    id: "link",
    type: "group",
    props: {
      label: `"Link"`,
      link: ''
    },
    styles: {
      class: `'mk-a'`,
    },
    actions: {
      onClick: '(e,v,k,api) => { api.openLink(link.props.link, false) }'
    },
    types: {
      label: "text",
      link: 'link'
    }}, children:[
      {...textNode, node :{...textNode.node, props: {value: `link.props.label`}}}
    ]
  }
  export const rootToFrame = (root: FrameRoot) : MDBFrame => {
    return {
      schema: {id: root.id,name: root.node.name, type: 'frame'},
    cols: Object.keys(root.node.types ?? {}).map(f => {
      return {
        name: f,
        schemaId : root.id,
type: root.node.types[f],
value: root.node.propsValue?.[f],
attrs: root.node.propsAttrs?.[f]
      }
    }),
    rows: flattenToFrameNodes(root).map(f => nodeToFrame(f))
  }
}
  
  