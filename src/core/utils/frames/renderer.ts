import { FrameTreeProp } from "shared/types/mframe";
import { parseStylesForState, InteractionState } from "./stateStyles";

export const parseStylesToClass = (
  styles: FrameTreeProp = {}, 
  parentLayout?: string,
  currentState?: InteractionState
) => {
    // Parse state-prefixed styles if current interaction state is provided
    const resolvedStyles = currentState 
      ? parseStylesForState(styles, currentState)
      : styles;
    
    const classes = [];
    // If parent has layer layout, position children absolutely
    if (parentLayout === 'layer') {
      classes.push('absolute');
    }
    if (resolvedStyles.class) {
      classes.push(`${resolvedStyles.class}`);
    }
    // Note: sem (semantic) classes are handled by styleAstsForNode in the runner, not here
     if (resolvedStyles.layout) {
      if (resolvedStyles.layout === "row") {
        classes.push("flex-row");
        if (resolvedStyles.layoutAlign == 'nw' || resolvedStyles.layoutAlign == 'n' || resolvedStyles.layoutAlign == 'ne') {
          classes.push(`items-start`);
        }
        if (resolvedStyles.layoutAlign == 'nw' || resolvedStyles.layoutAlign == 'w' || resolvedStyles.layoutAlign == 'sw') {
          classes.push(`justify-start`);
        }
        if (resolvedStyles.layoutAlign == 'n' || resolvedStyles.layoutAlign == 'm' || resolvedStyles.layoutAlign == 's') {
          classes.push(`justify-center`);
        }
        if (resolvedStyles.layoutAlign == 'sw' || resolvedStyles.layoutAlign == 's' || resolvedStyles.layoutAlign == 'se') {
          classes.push(`items-end`);
        }
        if (resolvedStyles.layoutAlign == 'ne' || resolvedStyles.layoutAlign == 'e' || resolvedStyles.layoutAlign == 'se') {
          classes.push(`justify-end`);
        }
      }
      if (resolvedStyles.layout === "column") {
        classes.push("flex-col");
        if (resolvedStyles.layoutAlign == 'nw' || resolvedStyles.layoutAlign == 'w' || resolvedStyles.layoutAlign == 'sw') {
          classes.push(`items-start`);
        }
        if (resolvedStyles.layoutAlign == 'nw' || resolvedStyles.layoutAlign == 'n' || resolvedStyles.layoutAlign == 'ne') {
          classes.push(`justify-start`);
        }
        if (resolvedStyles.layoutAlign == 'w' || resolvedStyles.layoutAlign == 'm' || resolvedStyles.layoutAlign == 'e') {
          classes.push(`justify-center`);
        }
        if (resolvedStyles.layoutAlign == 'ne' || resolvedStyles.layoutAlign == 'e' || resolvedStyles.layoutAlign == 'se') {
          classes.push(`items-end`);
        }
        if (resolvedStyles.layoutAlign == 'sw' || resolvedStyles.layoutAlign == 's' || resolvedStyles.layoutAlign == 'se') {
          classes.push(`justify-end`);
        }
      }
      if (resolvedStyles.layout === "grid") {
        classes.push("grid");
      }
      if (resolvedStyles.layout === "masonry") {
        classes.push("columns-3");
      }
      if (resolvedStyles.layout === "scroll") {
        classes.push("overflow-scroll");
      }
      if (resolvedStyles.layout === "layer") {
        classes.push("relative");
      }
      // Keep legacy mk-layout classes for backward compatibility
      classes.push(`mk-layout-${resolvedStyles.layout}`);
    }
     if (resolvedStyles.layoutAlign) {
      classes.push(`mk-layout-align-${resolvedStyles.layoutAlign}`);
    }
     if (resolvedStyles.layoutWrap) {
      if (resolvedStyles.layoutWrap === "wrap") {
        classes.push("flex-wrap");
      }
      if (resolvedStyles.layoutWrap === "nowrap") {
        classes.push("flex-nowrap");
      }
      classes.push(`mk-layout-wrap-${resolvedStyles.layoutWrap}`);
    }
    if (resolvedStyles.iconSize) {
      if (resolvedStyles.iconSize === "s") {
        classes.push('w-[18px] h-[18px]');
      }
      if (resolvedStyles.iconSize === "m") {
        classes.push('w-[24px] h-6');
      }
      if (resolvedStyles.iconSize === "l") {
        classes.push('w-[48px] h-12');
      }
      classes.push(`mk-icon-size-${resolvedStyles.iconSize}`)
    }
    if (resolvedStyles.imageSize) {
        classes.push(`mk-image-size-${resolvedStyles.imageSize}`)
    }

    return classes.join(" ");
  };