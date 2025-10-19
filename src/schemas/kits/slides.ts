import i18n from "shared/i18n";

import { FrameRoot } from "shared/types/mframe";


export const slidesNode: FrameRoot = {
  def: {
    icon: "ui//gem"
  }, node: {
    icon: 'ui//gem',
    schemaId: "slides",
    parentId: "",
    name: i18n.labels.slides,
    rank: 0,
    id: "slides",
    styles: {},
    type: "slides",

    props: {
      value: ''
    },
    types: {
      value: 'string'
    },
  }
};

export const slideNode: FrameRoot = {
  def: {
    icon: "ui//gem"
  }, node: {
    icon: 'ui//gem',
    schemaId: "slide",
    parentId: "",
    name: i18n.labels.slide,
    rank: 0,
    id: "slide",
    styles: {},
    type: "slide",

    props: {
      value: "",
    },
    types: {
      value: "string",
    },
  }
};

export const deltaNode: FrameRoot = {
  def: {
    icon: "ui//gem"
  }, node: {
    icon: 'ui//gem',
    schemaId: "delta",
    parentId: "",
    name: i18n.labels.delta,
    rank: 0,
    id: "delta",
    styles: {},
    type: "delta",
  }
};
