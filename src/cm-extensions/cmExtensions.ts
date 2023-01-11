import { atomicSelect } from "./flowEditor/atomic";
import { flowIDStateField, flowTypeStateField } from "./markSans/callout";
import {
  flowEditorField,
  flowEditorInfo,
  internalLinkHover,
  internalLinkToggle,
  preloadFlowEditor,
} from "./flowEditor/flowEditor";
import { hrField, hrResetFix } from "./markSans/hr";
import { toggleMarkExtension } from "./inlineStylerView/marks";
import { makerDelete, makerSelect } from "./markSans/selection";
import { editBlockExtensions } from "./flowEditor/selectiveEditor";
import { cursorTooltip } from "./inlineStylerView/inlineStyler";
import { flowViewUpdates } from "./flowEditor/flowViewUpdates";
import { placeholder } from "./placeholder";
import MakeMDPlugin from "main";
import { tooltips } from "./tooltip";

export const cmExtensions = (plugin: MakeMDPlugin, mobile: boolean) => {
  let extensions = [];
  
  extensions.push(...[toggleMarkExtension, tooltips({ parent: document.body })])
  if (!mobile && plugin.settings.inlineStyler) {
    extensions.push(cursorTooltip(plugin));
  }
  if (plugin.settings.markSans) {
    if (!mobile) {
      extensions.push(
        hrResetFix, 
        makerSelect, 
        makerDelete, 
        hrField);
    }
  }
  if (plugin.settings.makeMenuPlaceholder) extensions.push(placeholder);
  if (plugin.settings.editorFlow) {
    extensions.push(
      flowTypeStateField,
      atomicSelect,
      editBlockExtensions(),
      preloadFlowEditor,
      flowEditorField,
      flowEditorInfo,
      flowIDStateField,
      flowViewUpdates
    );
    if (plugin.settings.internalLinkClickFlow) {
      extensions.push(internalLinkToggle);
    } else {
      extensions.push(internalLinkHover);
    }
  }
  

  return extensions;
};
