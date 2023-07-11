import {
  flowEditorField,
  flowEditorInfo,
  internalLinkHover,
  internalLinkToggle,
  preloadFlowEditor
} from "./flowEditor/flowEditor";
import { flowViewUpdates } from "./flowEditor/flowViewUpdates";
import { editBlockExtensions } from "./flowEditor/selectiveEditor";
import { cursorTooltip } from "./inlineStylerView/inlineStyler";
import { toggleMarkExtension } from "./inlineStylerView/marks";
import { flowIDStateField, flowTypeStateField } from "./markSans/callout";
import { placeholder } from "./placeholder";

import { Extension } from '@codemirror/state';
import MakeMDPlugin from "main";
import {
  frontmatterHider,
  headerViewPlugin,
  statefulDecorations
} from "./inlineContext/inlineContext";
import { lineNumberExtension } from "./lineNumbers";
import { tooltips } from "./tooltip";

export const cmExtensions = (plugin: MakeMDPlugin, mobile: boolean) => {
  const extensions : Extension[] = [...editBlockExtensions()];

  if (plugin.settings.makerMode) {
    if (plugin.settings.inlineContext && plugin.settings.lineNumbers) {
      extensions.push(lineNumberExtension(plugin));
    }
  
    if (plugin.settings.inlineContext && plugin.settings.contextEnabled)
      extensions.push(...[statefulDecorations.field, headerViewPlugin(plugin), frontmatterHider(plugin)]);
  
    extensions.push(
      ...[toggleMarkExtension, tooltips({ parent: document.body })]
    );
    if (!mobile && plugin.settings.inlineStyler) {
      extensions.push(cursorTooltip(plugin));
    }
    // if (plugin.settings.markSans) {
    //   if (!mobile) {
    //     extensions.push(
    //       hrResetFix,
    //       makerSelect,
    //       makerDelete,
    //       hrField);
    //   }
    // }
    if (plugin.settings.flowMenuEnabled && plugin.settings.makeMenuPlaceholder) extensions.push(placeholder);
    if (plugin.settings.editorFlow) {
      extensions.push(
        // atomicSelect,
        flowTypeStateField,
        
        preloadFlowEditor,
        flowEditorField(plugin),
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
  }
  
  

  return extensions;
};
