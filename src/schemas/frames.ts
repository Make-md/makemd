import { flattenToFrameNodes } from "core/utils/frames/ast";
import { relinkProps } from "core/utils/frames/linker";
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

  const valueAliasForType = (type: string) => {
    switch (type) {
      case 'flow': return 'Link'
      case 'space': return 'Context'
      case 'text': return 'Label';
      case 'icon': return 'Sticker';
      case 'image': return 'Image';
      default: return type
    }
  }

  export const nodeToPropValue = (type: string) => {
    return type == 'container' || type == 'group' || type == 'content' || type == 'frame' ? {} : { value: JSON.stringify({alias: valueAliasForType(type)}) }
  }


  export const rootToFrame = (root: FrameRoot, schemaId?: string) : MDBFrame => {
    if (!schemaId) schemaId = root.node.id
    return {
      schema: {id: schemaId,name: root.node.name, type: 'frame', def: JSON.stringify(root.def)},
    cols: Object.keys(root.node.types ?? {}).map(f => {
      return {
        name: f,
        schemaId : schemaId,
type: root.node.types[f],
value: root.node.propsValue?.[f],
attrs: root.node.propsAttrs?.[f]
      }
    }),
    rows: flattenToFrameNodes({...root, id: schemaId, node: {...root.node, id: schemaId}}, schemaId).map(f => nodeToFrame(relinkProps('$root', schemaId, f, schemaId)))
  }
}
  
  