import { i18n } from "makemd-core";
import { FrameRoot } from "shared/types/mframe";


export const iconNode: FrameRoot = {
  def: {
    id: 'icon',
    icon: "ui//gem"
  }, node: {
    icon: 'ui//gem',
    schemaId: "icon",
    parentId: "",
    name: i18n.properties.icon.label,
    rank: 0,
    id: "icon",
    type: "icon",

    props: {
      value: "",
    },
    types: {
      value: "icon",
    },
    styles: {
      "--icon-size": `'100%'`,
      width: `'36px'`,
      height: `'36px'`,
    }
  }
};

export const contextNode: FrameRoot = {
  def: {
    id: 'space',
    icon: "ui//layout-grid",
    description: i18n.frames.context.description,
  },
  node: {
    icon: "ui//layout-grid",
    schemaId: "space",
    parentId: "",
    name: i18n.frames.context.label,
    rank: 0,
    id: "space",
    styles: { width: `'100%'` },
    type: "space",

    props: {
      value: "",
    },
    types: {
      value: "view",
    },
  }
};

export const imageNode: FrameRoot = {
  def: {
    id: 'image',
    icon: "ui//image"
  },
  node: {
    icon: "ui//image",
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
  }
};

export const audioNode: FrameRoot= {
  def: {
    id: 'text',
    icon: "ui//audio",
  },
  node: {
    icon: "ui//audio",
    schemaId: "audio",
    parentId: "",
    name: i18n.properties.audio.label,
    rank: 0,
    id: "audio",
    type: "audio",
    props: {
      value: "",
    },
    types: {
      value: "audio",
    },
  }
}

export const textNode: FrameRoot = {
  def: {
    id: 'text',
    icon: "ui//type",
    description: i18n.frames.label.description
  },
  node: {
    icon: "ui//type",
    schemaId: "text",
    parentId: "",
    name: i18n.frames.label.label,
    rank: 0,
    id: "text",
    type: "text",
    props: {
      value: "",
    },
    types: {
      value: "text",
    },
    styles: {
        width: `'100%'`
    }
  }
};export const inputNode: FrameRoot = {
  def: {
    icon: ""
  },
  node: {
    schemaId: "input",
    parentId: "",
    name: 'input',
    rank: 0,
    id: "input",
    styles: { as: `"text"` },
    type: "input",
    props: { value: "" },
    types: {
      value: "text",
    },
    actions: {
      onChange: `$api.properties.update(input.props.value, $value, $contexts.$context['_keyValue'], $saveState)`
    },
  }
};



export const flowNode: FrameRoot = {
  def: {
    id: 'flow',
    icon: 'ui//file-text'
  },
  node: {
    icon: 'ui//file-text',
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
      width: `'100%'`,
      padding: `'8px'`
    },
    types: {
      value: "link",
    },
  }
};
export const newNode: FrameRoot = {
  def: {
    id: 'newNode',
    icon: "ui//lightbulb",
  },
  node: {
    id: "node",
    schemaId: "node",
    name: i18n.commands.idea,
    rank: 0,
    parentId: "",
    type: "new",
  }
};

export const groupNode: FrameRoot = {
  def: {
    id: 'groupNode',
    icon: "ui//box-select",
    description: "Groups allow you to customize your layout",
  },
  node: {
    id: "group",
    schemaId: "group",
    name: i18n.commands.group,
    rank: 0,
    parentId: "",
    styles: {
      layout: `"column"`,
      width: `'100%'`,
      height: `'100px'`,
    },
    type: "group",
  }
};

export const spacerNode: FrameRoot = {
  def: {
    id: 'spacerNode',
    icon: "ui//unfold-horizontal",
  },
  node: {
    id: "group",
    schemaId: "group",
    name: i18n.commands.group,
    rank: 0,
    parentId: "",
    styles: {
      flex: `'1'`,
    },
    type: "group",
  }
};
export const columnsNode: FrameRoot = {
  def: {
    id: 'columnsNode',
    icon: "ui//columns",
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
  }
};

export const columnNode: FrameRoot = {
  def: {
    id: 'columnNode',
    icon: "ui//columns",
  },
  node: {
    icon: "ui//columns",
    id: "column",
    schemaId: "column",
    name: i18n.commands.column,
    rank: 0,
    parentId: "",
    styles: {
      layout: `"column"`,
      layoutAlign: `'left'`,
      flex: `1`,
      gap: `'8px'`,
      width: '0'
    },
    type: "column",
  }
};
export const contentNode: FrameRoot = {
  def: {
    id: 'content',
    icon: "ui//type"
  },
  node: {
    icon: "ui//type",
    schemaId: "content",
    parentId: "",
    name: 'Content',
    rank: 0,
    id: "content",
    type: "content",
  }
};

export const visualizationNode: FrameRoot = {
  def: {
    id: 'visualization',
    icon: 'lucide//bar-chart-3',
  },
  node: {
    icon: 'lucide//bar-chart-3',
    schemaId: 'visualization',
    parentId: '',
    name: 'Data Visualization',
    rank: 0,
    id: 'visualization',
    type: 'visualization',
    props: {
      value: '', // References visualization MDBFrame ID
    },
    styles: {
      width: `'600px'`,
      height: `'400px'`,
    },
    types: {
      value: 'option',
    },
    propsValue: {
      value: {
        alias: 'Visualization Configuration',
        source: 'visualization',
      },
    },
  },
};

export const dataNode: FrameRoot = {
  def: {
    id: 'data',
    icon: 'ui//database',
    description: 'Display data with custom field types',
  },
  node: {
    icon: 'ui//database',
    schemaId: 'data',
    parentId: '',
    name: 'Data Field',
    rank: 0,
    id: 'data',
    type: 'data',
    props: {
      field: '',
      value: '',
    },
    types: {
      field: 'object',
      value: 'text',
    },
    propsValue: {
      field: {
        alias: 'Field Configuration',
      },
      value: {
        alias: 'Value',
      },
    },
  },
};

