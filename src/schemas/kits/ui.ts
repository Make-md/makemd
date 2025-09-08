import { frameRootWithProps } from "core/utils/frames/frames";
import { i18n } from "makemd-core";

import { FrameRoot } from "shared/types/mframe";
import {
  contentNode,
  flowNode,
  groupNode,
  iconNode,
  imageNode,
  textNode,
} from './base';
import { deltaNode, slideNode, slidesNode } from './slides';

export const groupableTypes = [
  'content',
  'group',
  'container',
  'column',
  'list',
  'slides',
  'slide',
];

export const listNode = () : FrameRoot => ({
  def: {
    id: 'list',
    icon: 'ui//list',
  },
  node: {
    icon: 'ui//list',
    schemaId: 'list',
    parentId: '',
    name: 'List',
    rank: 0,
    id: 'list',
    styles: {},
    type: 'list',

    props: {
      value: '',
    },
    types: {
      value: 'multi',
    },
  },
});

export const listItemNode = () : FrameRoot => ({
  def: {
    id: 'listItem',
    icon: 'ui//list',
  },
  node: {
    icon: 'ui//list',
    schemaId: 'listItem',
    parentId: '',
    name: 'List Item',
    rank: 0,
    id: 'listItem',
    styles: {},
    type: 'listItem',

    props: {
      value: '',
    },
    types: {
      value: 'object',
    },
  },
});
export const dividerNode : FrameRoot = {
  def: {
    id: 'divider',
    icon: 'ui//minus',
    description: i18n.frames.divider.description,
  },
  node: {
    icon: 'ui//minus',
    schemaId: 'divider',
    parentId: '',
    name: i18n.frames.divider.label,
    rank: 0,
    id: 'divider',
    type: 'group',
    styles: {
      width: `'100%'`,
      height: `'16px'`,
      borderBottom: `'1px solid var(--mk-ui-divider)'`,
    },
  },
};

export const countdownNode = () : FrameRoot => ({
  def: {
    id: 'countdown',
    icon: 'ui//clock',
  },
  node: {
    icon: 'ui//clock',
    schemaId: 'countdown',
    parentId: '',
    name: 'Countdown',
    rank: 0,
    id: 'countdown',
    type: 'group',
    props: {
      date: '',
    },
    types: {
      date: 'date',
    },
  },
  children: [
    {
      ...textNode,
      node: {
        ...textNode.node,
        props: {
          date: '',
          value: `var _second = 1000;
            var _minute = _second * 60;
            var _hour = _minute * 60;
            var _day = _hour * 24;
            var timer;
            var distance = new Date($root.props['date'])-$api.utils.date.now();
            var days = Math.floor(distance / _day);
            var hours = Math.floor((distance % _day) / _hour);
            var minutes = Math.floor((distance % _hour) / _minute);
            var seconds = Math.floor((distance % _minute) / _second);
            return days + ":" + hours + ":" + minutes + ':' + seconds;`,
        },
        types: {
          date: 'date',
          value: 'string',
        },
        actions: {
          onRun: `setTimeout(() => $saveState({}), 1000)`,
        },
      },
    },
  ],
});

export const buttonNode = () : FrameRoot => ({
  id: 'button',
  def: {
    id: 'button',
    icon: 'ui//mouse-pointer-click',
    description: i18n.frames.button.description,
  },
  node: {
    icon: 'ui//mouse-pointer-click',
    schemaId: 'button',
    parentId: '',
    name: i18n.frames.button.label,
    rank: 0,
    id: 'button',
    type: 'group',
    props: {
      icon: '',
      label: '',
      iconSize: '18',
      action: '',
      actionValue: '',
    },
    types: {
      icon: 'icon',
      iconSize: 'number',
      label: 'text',
      action: 'option',
      actionValue: 'super',
    },
    propsAttrs: {
      action: ({
        name: i18n.properties.super.whenClicked,
        icon: 'ui//mouse-pointer-click',
      }),
      actionValue: ({
        name: i18n.properties.super.performAction,
      }),
    },
    propsValue: {
      icon: ({
        alias: 'Icon',
      }),
      label: ({
        alias: 'Label',
      }),
      iconSize: ({
        alias: 'Icon Size',
      }),
      action: ({
        alias: 'Action',
        options: [],
        source: '$super',
      }),
      actionValue: ({
        alias: 'Action Properties',
        dynamic: true,
        field: 'action',
      }),
    },
    actions: {
      onClick: `$api.commands.runByPath(button.props.action, button.props.actionValue, $contexts, $saveState)`,
    },
    interactions: {
      onClick: 'onClick',
    },
    styles: {
      sem: `'button'`,
    },
  },
  children: [
    {
      ...iconNode,
      node: {
        ...iconNode.node,
        props: {
          value: `button.props.icon`,
        },
        styles: {
          '--icon-size': 'button.props.iconSize+"px"',
          // width: `'18px'`,
          // height: `'18px'`,
        },
      },
    },
    {
      ...textNode,
      node: { ...textNode.node, props: { value: `button.props.label` } },
    },
  ],
});

export const tabsNode = (): FrameRoot => ({
  id: 'tabs',
  def: {
    id: 'tabs',
    icon: 'ui//tabs',
  },
  node: {
    icon: 'ui//tabs',
    schemaId: 'tabs',
    parentId: '',
    name: i18n.commands.tabs,
    rank: 0,
    id: 'tabs',
    type: 'group',
    props: {
      currentTab: '0',
      tabs: "[{'name': 'Tab 1', 'view': ''}, {'name': 'Tab 2', 'view': ''}]",
    },
    propsValue: {
      tabs: ({
        alias: 'Tabs',
        typeName: 'Tab',
        type: {
          name: {
            type: 'text',
            value: ({ alias: 'Label' }),
          },
          view: {
            type: 'link',
            value: ({ alias: 'Page' }),
          },
        },
      }),
      currentTab: ({
        alias: 'Selected Tab',
      }),
    },
    types: {
      tabs: 'object-multi',
      currentTab: 'number',
    },
    styles: {
      layout: `'column'`,
      width: `'100%'`,
      gap: `'8px'`,
    },
  },
  children: [
    frameRootWithProps(
      {
        ...listNode(),
        children: [
          frameRootWithProps(
            {
              ...listItemNode(),
              children: [
                frameRootWithProps(
                  textNode,
                  {
                    value: `listItem.props.value.name`,
                  },
                  {
                    sem: `$root.props.currentTab == listItem.props._index ? 'tab-active' : 'tab'`,
                  },
                  {
                    onClick: `$saveState({$root: {props: {currentTab: listItem.props._index}}})`,
                  },
                  {
                    onClick: 'onClick'
                  }
                ),
              ],
            },
            {},
          ),
        ],
      },
      { value: `$root.props.tabs` },
      {
        layout: `'row'`,
        columnGap: `'8px'`,
        flexWrap: `'wrap'`,
        rowGap: `'4px'`,
      },
    ),
    frameRootWithProps(
      flowNode,
      {
        value: `$root.props.tabs[$root.props.currentTab].view`,
      },
      {
        padding: `'0px'`,
        '--mk-expanded': `true`,
         '--mk-min-mode': `true`,
      },
      {},
    ),
  ],
});


export const checkboxNode = (): FrameRoot => ({
  id: 'checkbox',
  def: {
    id: 'checkbox',
    icon: 'ui//check',
  },
  node: {
    icon: 'ui//check',
    schemaId: 'checkbox',
    parentId: '',
    name: 'Checkbox',
    rank: 0,
    id: 'checkbox',
    type: 'group',
    props: {
      value: 'false',
    },
    types: {
      value: 'boolean',
    },
    styles: {
      layout: `'row'`,
      width: `'18px'`,
      height: `'18px'`,
      backgroundColor: `'var(--background-secondary)'`,
      padding: `'2px'`,
      border: `'thin solid var(--mk-ui-border)'`,
      borderRadius: `'4px'`,
      cursor: `'pointer'`,
      transition: `'all 0.15s ease'`,
      'hover:backgroundColor': `'var(--mk-ui-background-hover)'`,
      'hover:borderColor': `'var(--mk-ui-border-hover)'`,
      'hover:transform': `'scale(1.05)'`,
      'press:backgroundColor': `'var(--mk-ui-background-active)'`,
      'press:transform': `'scale(0.95)'`,
      'focus:borderColor': `'var(--mk-ui-accent)'`,
      'focus:outline': `'2px solid var(--mk-ui-accent)'`,
      'focus:outlineOffset': `'2px'`,
    },
    actions: {
      onClick: `$saveState({ $root: {props: { value: !$root.props.value }} })`,
    },
    interactions: {
      onClick: 'onClick',
    },
  },
  children: [
    frameRootWithProps(
      iconNode,
      {
        value: `$root.props.value ? 'ui//check' : ''`,
      },
      {
        width: `'12px'`,
        height: `'12px'`,
      },
    ),
  ],
});

export const previewNode = (): FrameRoot => ({
  id: 'preview',
  def: {
    id: 'preview',
  },
  node: {
    schemaId: 'preview',
    parentId: '',
    name: 'Preview',
    rank: 0,
    id: 'preview',
    type: 'group',
    props: {
      path: '',
      width: `"50px"`,
      height: `'50px'`,
      radius: `'8px'`,
      padding: `'16px'`,
    },
    types: {
      path: 'link',
      width: 'text',
      height: 'text',
      radius: 'text',
      padding: 'text',
    },
    styles: {
      background: `'var(--background-secondary)'`,
      height: `$root.props.height`,
      borderRadius: `$root.props.radius`,
      overflow: `'hidden'`,
    },
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
        overflow: `'hidden'`,
      },
    ),
  ],
});

export const ratingNode = (): FrameRoot => ({
  id: 'rating',
  def: {
    id: 'rating',
    icon: 'ui//star',
  },
  node: {
    icon: 'ui//star',
    schemaId: 'rating',
    parentId: '',
    name: i18n.commands.rating,
    rank: 0,
    id: 'rating',
    type: 'group',
    props: {
      value: '5',
      icon: `'ui//star'`,
    },
    types: {
      value: 'number',
      icon: 'icon',
    },
    styles: {
      layout: `'row'`,
      height: `'16px'`,
    },
  },
  children: [
    frameRootWithProps(
      iconNode,
      {
        value: `$root.props.icon`,
      },
      {
        width: `$root.styles.height`,
        height: `$root.styles.height`,
        hidden: `$root.props.value < 1`,
      },
    ),
    frameRootWithProps(
      iconNode,
      {
        value: `$root.props.icon`,
      },
      {
        width: `$root.styles.height`,
        height: `$root.styles.height`,
        hidden: `$root.props.value < 2`,
      },
    ),
    frameRootWithProps(
      iconNode,
      {
        value: `$root.props.icon`,
      },
      {
        width: `$root.styles.height`,
        height: `$root.styles.height`,
        hidden: `$root.props.value < 3`,
      },
    ),
    frameRootWithProps(
      iconNode,
      {
        value: `$root.props.icon`,
      },
      {
        width: `$root.styles.height`,
        height: `$root.styles.height`,
        hidden: `$root.props.value < 4`,
      },
    ),
    frameRootWithProps(
      iconNode,
      {
        value: `$root.props.icon`,
      },
      {
        width: `$root.styles.height`,
        height: `$root.styles.height`,
        hidden: `$root.props.value < 5`,
      },
    ),
  ],
});

export const callout = (): FrameRoot => ({
  id: 'callout',
  def: {
    id: 'callout',
    icon: 'ui//callout',
  },
  node: {
    icon: 'ui//callout',
    schemaId: 'callout',
    parentId: '',
    name: i18n.commands.callout,
    rank: 0,
    id: 'callout',
    type: 'group',
    props: {
      icon: '',
      note: '',
    },
    types: {
      icon: 'icon',
      note: 'link',
    },
    styles: {
      borderRadius: `'8px'`,
      background: `'var(--mk-ui-background-contrast)'`,
      width: `'100%'`,
      layout: `'row'`,
      gap: `'8px'`,
      padding: `'16px'`,
    },
  },
  children: [
    frameRootWithProps(
      iconNode,
      {
        value: `callout.props.icon`,
      },
      {
        width: `'18px'`,
        height: `'18px'`,
      },
    ),
    frameRootWithProps(
      {
        ...contentNode,
        children: [
          frameRootWithProps(
            flowNode,
            {
              value: `callout.props.note`,
            },
            {
              width: `'100%'`,
              '--mk-expanded': `true`,
              '--mk-min-mode': `true`,
            },
          ),
        ],
      },
      {},
      {
        width: `'auto'`,
        flex: `'1'`,
      },
    ),
  ],
});

export const toggleNode = (): FrameRoot => ({
  id: 'toggle',
  def: {
    id: 'toggle',
    icon: 'ui//collapse-solid',
    description: i18n.frames.toggle.description,
  },
  node: {
    icon: 'ui//collapse-solid',
    schemaId: 'toggle',
    parentId: '',
    name: i18n.commands.toggle,
    rank: 0,
    id: 'toggle',
    type: 'group',
    props: {
      value: 'false',
      label: '',
      note: '',
    },
    types: {
      value: 'boolean',
      label: 'text',
      note: 'link',
    },
    styles: {
      width: `'100%'`,
    },
  },
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
                  { ...deltaNode, node: { ...deltaNode.node, ref: 'icon' } },
                  {},
                  {
                    transform: `'rotate(90deg)'`,
                  },
                ),
              ],
            },
            { value: 'true' },
          ),
          frameRootWithProps(
            {
              ...slideNode,
              children: [
                frameRootWithProps(
                  { ...deltaNode, node: { ...deltaNode.node, ref: 'icon' } },
                  {},
                  {
                    transform: `'rotate(0deg)'`,
                  },
                ),
              ],
            },
            { value: 'false' },
          ),
        ],
      },
      {
        value: `'value'`,
      },
    ),
    frameRootWithProps(
      {
        ...groupNode,
        children: [
          {
            ...iconNode,
            node: {
              ...iconNode.node,
              props: {
                value: `'ui//collapse-solid'`,
              },
              styles: {
                width: `'16px'`,
                height: `'16px'`,
                transform: `'rotate(90deg)'`,
                cursor: `'pointer'`,
                transition: `'all 0.15s ease'`,
                borderRadius: `'2px'`,
                'hover:backgroundColor': `'var(--mk-ui-background-hover)'`,
                'hover:transform': `'rotate(90deg) scale(1.1)'`,
                'press:backgroundColor': `'var(--mk-ui-background-active)'`,
                'press:transform': `'rotate(90deg) scale(0.95)'`,
                'focus:outline': `'2px solid var(--mk-ui-accent)'`,
                'focus:outlineOffset': `'2px'`,
              },
              actions: {
                onClick: `$saveState({ toggle: {props: { value: !toggle.props.value }} })`,
              },
              interactions: {
                onClick: 'onClick',
              },
            },
          },
          {
            ...textNode,
            node: { ...textNode.node, props: { value: `toggle.props.label` } },
          },
        ],
      },
      {},
      {
        height: `'auto'`,
        layoutAlign: `'w'`,
        gap: `'8px'`,
        layout: `'row'`,
      },
    ),
    frameRootWithProps(
      {
        ...contentNode,
        children: [
          frameRootWithProps(
            flowNode,
            {
              value: `toggle.props.note`,
            },
            {
              width: `'auto'`,
              flex: `'1'`,
              '--mk-expanded': `true`,
              '--mk-min-mode': `true`,
            },
          ),
        ],
      },
      {},
      { paddingLeft: `'24px'`, hidden: `!toggle.props.value` },
    ),
  ],
});

export const progressNode = (): FrameRoot => ({
  id: 'progress',
  def: {
    id: 'progress',
    icon: 'ui//pie-chart',
  },
  node: {
    icon: 'ui//pie-chart',
    schemaId: 'progress',
    parentId: '',
    name: i18n.commands.progress,
    rank: 0,
    id: 'progress',
    type: 'group',
    props: {
      value: '50',
      max: '100',
      color: "'var(--mk-ui-background)'",
      backgroundColor: `'var(--mk-color-orange)'`,
    },
    types: {
      value: 'number',
      max: 'number',
      color: 'color',
      backgroundColor: 'color',
    },
    styles: {
      background: `$root.props.color`,
      height: `'10px'`,
      width: `'100px'`,
      borderRadius: `'5px'`,
    },
  },
  children: [
    {
      ...groupNode,
      node: {
        ...groupNode.node,
        styles: {
          width: `$root.props.value/$root.props.max*100+'%'`,
          height: `'100%'`,
          borderRadius: `'5px'`,
          background: `$root.props.backgroundColor`,
          display: `'block'`,
        },
      },
    },
  ],
});



export const cardNode = (): FrameRoot => ({
  id: 'card',
  def: {
    id: 'card',
    icon: 'ui//mouse-pointer-click',
  },
  node: {
    icon: 'ui//mouse-pointer-click',
    schemaId: 'card',
    parentId: '',
    name: i18n.commands.card,
    rank: 0,
    id: 'card',
    type: 'group',
    props: {
      icon: '',
      label: '',
    },
    types: {
      icon: 'icon',
      label: 'text',
    },
    actions: {},
    styles: {
      sem: `'card'`,
    },
  },
  children: [
    frameRootWithProps(
      {
        ...contentNode,
        children: [
          {
      ...iconNode,
      node: {
        ...iconNode.node,
        props: {
          value: `card.props.icon`,
        },
      },
    },
    {
      ...textNode,
      node: { ...textNode.node, props: { value: `card.props.label` } },
    },
        ],
      },
      {},
      {
        width: `'auto'`,
        flex: `'1'`,
      },
    ),
  ],

});

export const linkNode = (): FrameRoot => ({
  id: 'link',
  def: {
    id: 'link',
    icon: 'ui//link',
  },
  node: {
    icon: 'ui//link',
    schemaId: 'link',
    parentId: '',
    name: i18n.commands.link,
    rank: 0,
    id: 'link',
    type: 'group',
    props: {
      link: '',
      label: `$api.path.label(link.props.link)?.name`,
      sticker: `$api.path.label(link.props.link)?.sticker`,
    },
    styles: {
      sem: `'a'`,
    },
    actions: {
      onClick: '$api.path.open(link.props.link, false)',
    },
    interactions: {
      onClick: 'onClick',
    },
    types: {
      link: 'link',
      label: 'text',
      sticker: 'sticker',
    },
  },
  children: [
    {
      ...iconNode,
      node: {
        ...iconNode.node,
        props: { value: `link.props.sticker` },
        styles: {
          width: `'18px'`,
          height: `'18px'`,
        },
      },
    },
    {
      ...textNode,
      node: { ...textNode.node, props: { value: `link.props.label` } },
    },
  ],
});