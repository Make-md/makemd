import { FrameTreeProp } from "types/mframe";

export const parseStylesToClass = (styles: FrameTreeProp) => {
    const classes = [];
    if (styles.class) {
      classes.push(`${styles.class}`);
    }
     if (styles.layout) {
      classes.push(`mk-layout-${styles.layout}`);
    }
     if (styles.layoutAlign) {
      classes.push(`mk-layout-align-${styles.layoutAlign}`);
    }
     if (styles.layoutWrap) {
      classes.push(`mk-layout-wrap-${styles.layoutWrap}`);
    }
    if (styles.iconSize) {
        classes.push(`mk-icon-size-${styles.iconSize}`)
    }
    if (styles.imageSize) {
        classes.push(`mk-image-size-${styles.imageSize}`)
    }
    return classes.join(" ");
  };