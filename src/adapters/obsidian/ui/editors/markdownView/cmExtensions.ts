import {
  flowEditorField,
  flowEditorInfo,
  internalLinkHover,
  internalLinkToggle,
  preloadFlowEditor
} from "./flowEditor/flowEditor";
import { flowIDStateField, flowTypeStateField } from "./flowEditor/flowStateFields";
import { flowViewUpdates } from "./flowEditor/flowViewUpdates";
import { editBlockExtensions } from "./flowEditor/selectiveEditor";
import { cursorTooltip } from "./menus/inlineStylerView/inlineStyler";
import { toggleMarkExtension } from "./menus/inlineStylerView/marks";
import { placeholderExtension } from "./placeholder";

import { Extension } from '@codemirror/state';
import MakeMDPlugin from "main";

import { tooltips } from "./tooltip";

export const cmExtensions = (plugin: MakeMDPlugin, mobile: boolean) => {
  const extensions : Extension[] = [...editBlockExtensions()];

  // extensions.push(Prec.highest(defaultKeymap));
  if (plugin.superstate.settings.makerMode) {
    
    

    extensions.push(
      ...[toggleMarkExtension, tooltips({ parent: document.body })]
    );
    if (!mobile && plugin.superstate.settings.inlineStyler) {
      extensions.push(cursorTooltip(plugin));
    }
    
    if (plugin.superstate.settings.flowMenuEnabled && plugin.superstate.settings.makeMenuPlaceholder) extensions.push(placeholderExtension(plugin));
    if (plugin.superstate.settings.editorFlow) {
      extensions.push(
        flowTypeStateField,
        
        preloadFlowEditor,
        flowEditorField(plugin),
        flowEditorInfo,
        flowIDStateField,
        flowViewUpdates(plugin)
      );
      if (plugin.superstate.settings.internalLinkClickFlow) {
        extensions.push(internalLinkToggle);
      } else {
        extensions.push(internalLinkHover(plugin));
      }
    }
  }
  
  

  return extensions;
};
