import { editBlockExtensions } from "../shared/utils/codemirror/selectiveEditor";
import {
  flowEditorInfo,
  internalLinkHover,
  internalLinkToggle,
  preloadFlowEditor
} from "./codemirror/flowEditor";
import { flowIDStateField, flowTypeStateField } from "./codemirror/flowStateFields";
import { flowViewUpdates } from "./codemirror/flowViewUpdates";
import { placeholderExtension } from "./codemirror/placeholder";
import { cursorTooltip } from "./menus/inlineStylerView/inlineStyler";
import { toggleMarkExtension } from "./menus/inlineStylerView/marks";

import { Extension } from '@codemirror/state';

import MakeBasicsPlugin from "./basics";
import { tooltips } from "./tooltip";

export const cmExtensions = (plugin: MakeBasicsPlugin, mobile: boolean) => {
  const extensions : Extension[] = [...editBlockExtensions()];

    extensions.push(
      ...[toggleMarkExtension, tooltips({ parent: document.body })]
    );
    if (!mobile && plugin.settings.inlineStyler) {
      extensions.push(cursorTooltip(plugin));
    }
    
    if (plugin.settings.flowMenuEnabled && plugin.settings.makeMenuPlaceholder) extensions.push(placeholderExtension(plugin));
    if (plugin.settings.editorFlow) {
      extensions.push(
        flowTypeStateField,
        
        preloadFlowEditor,
      );
      
      extensions.push(
        
        flowEditorInfo,
        flowIDStateField,
        flowViewUpdates(plugin)
      );
      if (plugin.settings.internalLinkClickFlow) {
        extensions.push(internalLinkToggle);
      } else {
        extensions.push(internalLinkHover(plugin));
    }
  }
  
  

  return extensions;
};
