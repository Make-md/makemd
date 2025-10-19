import i18n from "shared/i18n";

import type { FrameRoot } from 'shared/types/mframe';
import { groupNode, imageNode, textNode } from './base';

export const headerKit: FrameRoot = {
  id: 'pageHeader',
  def: {
    id: 'pageHeader',
    icon: 'ui//layout-header',
    name: i18n.labels.header,
    description: i18n.labels.pageHeaderContainingBannerAndTitle,
  },
  node: {
    icon: 'ui//layout-header',
    schemaId: 'pageHeader',
    parentId: '',
    name: i18n.labels.header,
    rank: 0,
    id: 'pageHeader',
    type: 'group',
    styles: {
      width: '"100%"',
      layout: '"column"',
      marginBottom: `'16px'`
    },
    props: {},
    types: {},
  },
  children: [
    // Banner/Cover Image
    {
      ...imageNode,
      node: {
        ...imageNode.node,
        id: 'banner',
        name: i18n.labels.banner,
        props: {
          value: '$contexts.$space.cover',
        },
        styles: {
          width: '"100%"',
          maxWidth: '"100%"',
          height: '"200px"',
          position: '"relative"',
          marginLeft: '0',
          marginRight: '0',
          marginBottom: '"16px"',
          hidden: '!$contexts.$space.cover.length > 0',
          objectFit: '"cover"',
        },
      }
    },
    {
      ...groupNode,
      node: {
        ...groupNode.node,
        id: 'spacer',
        name: 'Banner Spacer',
        styles: {
          height: '"16px"',
          minHeight: '"16px"',
          hidden: '$contexts.$space.cover.length > 0',
        }
      }
    },
    // Spacer for banner (when banner exists)

    {
      ...textNode,
      node: {
        ...textNode.node,
        id: 'title',
        name: i18n.labels.title,
        props: {
          value: '$contexts.$space.title',
        },
        styles: {
          sem: '"h1"',
          marginTop: '"0px"',
          "--font-text-size": '"2rem"',
          "--font-text-weight": '"bold"',
          lineHeight: '"1.2"',
          marginLeft: '"var(--file-margins)"',
            marginRight: '"var(--file-margins)"',
            maxWidth: '"calc(100% - var(--file-margins) * 2)"',
        },
      }
    },
  ],
};