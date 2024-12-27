import { FrameRoot } from "shared/types/mframe";


export const slidesNode: FrameRoot = {
  def: {
    icon: "ui//gem"
  }, node: {
    icon: 'ui//gem',
    schemaId: "slides",
    parentId: "",
    name: "Slides",
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
    name: "Slide",
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
    name: "Delta",
    rank: 0,
    id: "delta",
    styles: {},
    type: "delta",
  }
};
